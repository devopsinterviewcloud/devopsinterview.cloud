---
title: AI Infrastructure Engineer Interview Questions and Answers
description: AI infrastructure engineer interview questions on system design: GPU clusters, model serving, queue-depth autoscaling, cold starts and cost per request.
date: 2026-11-12
keywords: ai infrastructure engineer interview questions, ai infrastructure engineer interview questions and answers, ai platform system design interview questions, llm serving system design interview, ml infrastructure engineer interview questions, gpu cluster design interview questions
topic_id: A03
---

This guide covers AI infrastructure engineer interview questions from the platform system design round. The prompt sounds simple, something like "design a platform that serves our models to the whole company", and the interviewer spends the rest of the round on what makes it different from serving a web app: GPUs are scarce, expensive and slow to start, and two requests to the same endpoint can differ in cost many times over. The questions follow the order a strong answer takes, from requirements to rollback. Shorter answers to six related questions are on the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions).

## AI infrastructure engineer interview questions on requirements and sizing

### 1. What do you ask before drawing anything?

Requirements, because each one changes the design.

| Ask | Why it matters |
|---|---|
| Which models, and how big? | Sets GPU memory per replica and whether one card is enough |
| Interactive or batch? | Interactive needs a latency target and warm capacity; batch can queue on cheaper capacity |
| What latency target? | For LLMs, time to first token and time per output token are separate targets |
| What does traffic look like over a day? | Steady load suits committed capacity; spiky load needs headroom |
| How long are prompts and outputs? | They drive KV-cache memory, and so how many requests fit on one GPU |
| How many tenants? | Per-team quotas, rate limits and cost reporting |
| Where can the data go? | Whether prompts may leave a region or go to a hosted API at all |

If a hosted model API meets the data rules and the budget, self-hosting has to justify itself.

### 2. How do you estimate how many GPUs a model needs?

Start with memory. Weights take parameters times bytes per parameter: an 8B model at 16-bit precision is about 16 GB, and a 70B model is about 140 GB, more than one 80 GB H100 holds. That model gets split across several GPUs with tensor parallelism, usually inside one node where the GPUs talk over NVLink. Quantized to 8 bits it is about 70 GB and fits on one card, with little room left.

What needs the room is mostly the KV cache, which grows with every token in flight. Per token it is 2 × layers × KV heads × head dimension × bytes per value. For Llama 3 8B (32 layers, 8 KV heads, head dimension 128) at 16 bits:

```text
2 × 32 × 8 × 128 × 2 bytes = 131,072 bytes = 128 KiB per token
one 8,192-token sequence    = 1 GiB
```

On a 24 GB L4 the weights already take about 16 GB, so only a few full-length sequences fit beside them. On an 80 GB card the same model has room for dozens.

The arithmetic picks the card. The capacity number comes from a load test with your real prompt and output lengths: the highest request rate one replica sustains inside the latency target. vLLM ships `vllm bench serve` for this, and the autoscaling threshold and cost per request both depend on the result.

## How would you design the GPU cluster?

### 3. Should training and inference share a cluster?

They can, and the simplest version keeps them on separate node pools so a training job can't hurt serving latency. Serving gets its own GPU node pool on committed capacity, sized for the warm floor, and a PriorityClass above training so that serving wins if the two ever compete. Training and batch inference run on a separate pool and queue through Kueue, which holds quotas per team, admits jobs when capacity exists and preempts lower-priority work. The [Kubernetes GPU sharing post](/blog/kubernetes-gpu-sharing-mig-time-slicing-mps) covers taints, node pools and splitting a card between small models.

On-demand GPU instances can be unavailable when you need them, so the serving floor belongs on reserved capacity, such as On-Demand Capacity Reservations on AWS. Capacity Blocks end on a fixed date, so they suit a training run better.

### 4. What does a multi-node training job need that a web service doesn't?

- **All pods or none.** A job with half its workers running holds GPUs and does no work. Kueue admits a job as a whole, and with `waitForPodsReady` it evicts and requeues one whose pods don't all start in time.
- **Placement.** Workers that exchange gradients every step should sit close together. Kueue's topology-aware scheduling keeps each PodSet inside one rack or block with the `kueue.x-k8s.io/podset-required-topology` annotation, and a shared `kueue.x-k8s.io/podset-group-name` keeps a leader and its workers in the same domain.
- **A fast interconnect.** NVLink inside a node and RDMA between nodes (InfiniBand, RoCE, or EFA on AWS), which NCCL uses for collective operations. On the ordinary pod network, gradient exchange becomes the bottleneck as the job grows.
- **Checkpoints** written often to fast shared storage, so a failed GPU or a reclaimed spot node costs the work since the last checkpoint, not the whole run.

## How do you design the model serving path?

### 5. What sits between the user and the GPU?

| Layer | Job | Common choices |
|---|---|---|
| API gateway | Authentication, per-tenant rate limits and token quotas, usage metering | An Envoy-based gateway, Kong, a cloud API gateway |
| Inference-aware routing | Picks a replica based on its load and cache state | Gateway API Inference Extension |
| Model server | Batching, KV-cache management, streaming tokens | vLLM, SGLang, Triton |
| Weights | Versioned, immutable model files | Object storage or a model registry, cached on the node |
| Async path | Bulk jobs that can wait | A queue and workers on the batch pool, off the online replicas |

### 6. Why does round-robin load balancing work badly for LLM traffic?

Because it assumes requests cost about the same. One request carries a short prompt and finishes in a second. The next carries a long document and streams for a minute, holding KV-cache memory the whole time. Round-robin ignores how long a request runs. Least-connections at least counts open streams, but neither sees token counts or KV-cache pressure, so a replica can be full while its connection count looks normal.

The Gateway API Inference Extension adds an [InferencePool](https://gateway-api-inference-extension.sigs.k8s.io/api-types/inferencepool/) backend for HTTPRoutes, GA since v1.0.0. Its endpoint picker tracks each model server's KV-cache utilization, pending-request queue length and active LoRA adapters, and sends each request to the replica best placed to serve it.

## How do you autoscale inference on queue depth?

### 7. Which metric should drive inference autoscaling?

Not CPU, and not GPU utilization either. `DCGM_FI_DEV_GPU_UTIL` is the share of time any kernel was running, not how much work the GPU did, so it can read high at low concurrency and says little about how many more requests a replica can take.

Queue depth measures what users feel. vLLM admits requests into its running batch until it hits its sequence limit or runs out of KV-cache space, and after that they wait. `vllm:num_requests_waiting` counts them, and every waiting request adds to time to first token. `vllm:kv_cache_usage_perc` (a 0 to 1 fraction, despite the name) is the early warning: when it nears full, the queue is about to grow.

With KEDA and a Prometheus trigger, the ScaledObject looks like this:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: chat-llm
  namespace: inference
spec:
  scaleTargetRef:
    name: chat-llm            # the vLLM Deployment
  minReplicaCount: 2          # warm floor, see cold starts below
  maxReplicaCount: 12
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleUp:
          policies:
            - type: Pods
              value: 2
              periodSeconds: 120
        scaleDown:
          stabilizationWindowSeconds: 600
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring.svc:9090
        query: sum(vllm:num_requests_waiting{model_name="chat"})
        threshold: "4"
```

KEDA's default metric type is `AverageValue`, so the HPA aims for about four waiting requests per replica: 20 waiting across the pool asks for five replicas. KEDA's `cooldownPeriod` [only applies when scaling to zero](https://keda.sh/docs/2.18/reference/scaledobject-spec/), so with a floor of two, scale-down pacing comes from the behavior block. The free [KEDA question](/questions/keda-event-driven-autoscaling-for-kubernetes) covers how KEDA feeds the HPA.

### 8. What goes wrong when you scale on queue depth?

- **It drains to zero.** With enough replicas the queue empties and the metric says you need none. The ten-minute scale-down window slows the drop, but a queue-only signal can still oscillate once the window passes. Running plus waiting requests per replica, with a target from the load test, is steadier.
- **It overshoots.** A new replica takes minutes to load while the queue keeps growing, so the HPA keeps asking for more. Hence the scale-up cap above.
- **Readiness passes too early.** A pod that reports ready before its model is loaded takes traffic it can't serve.
- **The queue moves.** If the gateway queues requests itself, the model servers look idle while users wait upstream. Scale on wherever requests wait.
- **Scale-down cuts streams.** Give endpoint removal time to propagate with a short preStop delay, check that the server drains in-flight requests on SIGTERM, and set `terminationGracePeriodSeconds` (30 by default) to cover the preStop delay plus your longest allowed generation.

## How do you handle cold starts?

### 9. Where does an inference cold start spend its time?

Count every stage between "the autoscaler wants a replica" and "that replica serves its first token":

| Stage | What takes the time | Fixes |
|---|---|---|
| New GPU node | VM boot, GPU driver, device plugin registering the GPUs | A node image with the driver installed, or the GPU Operator's precompiled drivers; a spare warm node |
| Image pull | CUDA and PyTorch images run to several gigabytes | Images baked into the node image, lazy-loading snapshotters such as SOCI or stargz |
| Weights download | About 16 GB for an 8B model, well over 100 GB for a 70B one | A node-local NVMe cache (KServe's LocalModelCache), streaming loads with vLLM's `--load-format runai_streamer` |
| Load and warm-up | Copying weights to GPU memory, torch.compile, CUDA graph capture | Share vLLM's compile cache between replicas, or trade throughput for startup with `--enforce-eager` |

If the pod waits for a new GPU node, its startup time is the node's boot plus the rest of the table. The free [Karpenter vs Cluster Autoscaler question](/questions/karpenter-vs-cluster-autoscaler-node-scaling-compared) covers that layer.

### 10. Would you scale an LLM service to zero?

For a user-facing service, usually not. The first request after zero waits for the whole table above, which can take minutes. Keep a warm floor sized for baseline traffic and pay for it.

For internal tools, rarely used fine-tuned models and batch endpoints, it can be worth it if something holds requests while a replica starts. KServe's serverless mode runs on Knative, whose activator buffers requests for a revision scaled to zero, and the KEDA HTTP add-on's interceptor does the same job. Without either, the caller has to retry or go through a queue.

## How do you work out cost per request?

### 11. How do you calculate cost per request for a model?

From what you actually spent, not from one replica's best throughput. GPU spend is the usual starting point, with CPU, storage and networking added for the full figure, and idle warm replicas and headroom belong in it:

```text
GPU cost per 1,000 requests = GPU spend for the period / (requests served / 1,000)

4 replicas × $5 an hour (illustrative) × 24 hours = $480
360,000 requests in the day / 1,000                = 360
$480 / 360                                         = about $1.33 per 1,000 requests
```

The load test gives the floor. A replica that sustains 5 requests a second inside the latency target serves 18,000 requests an hour, so at $5 an hour it costs about $0.28 per 1,000 when fully busy. The gap between the two numbers is idle capacity you're paying for.

For LLMs, report cost per million tokens too, input and output separately: the prompt is processed in parallel during prefill, while output tokens are generated one step at a time. Meter tokens per tenant at the gateway so each team sees its own bill.

### 12. How would you bring cost per request down?

- **Right-size the card.** An 8B model doesn't need an H100 if a smaller card meets the latency target. Small models can share a card with MIG.
- **Fill the replicas.** Let each run more sequences at once (vLLM's `--max-num-seqs`) while latency stays inside the target. Set `minReplicaCount` to the overnight floor and let a KEDA cron trigger raise it during the day.
- **Quantize where the evals allow it.** Smaller weights leave more memory for the KV cache, and so more concurrent requests per card.
- **Commit to the floor, burst on demand.** Reservations or savings plans cover the always-on replicas.
- **Use spot for batch, not for chat.** AWS gives a best-effort two-minute warning before reclaiming a Spot instance. Streams that outlast the drain are cut off, and the replacement may need a cold start. Batch jobs can retry.

The Kubernetes side of the bill is in [cutting costs on a 200-node Kubernetes cluster](/blog/kubernetes-cost-optimization-200-node-cluster).

## How do you roll out and roll back a model on a GPU fleet?

### 13. What makes a model rollout harder on GPUs than an app rollout?

Capacity. A rolling update needs somewhere to put new pods. The defaults allow 25% extra pods (rounded up) and 25% unavailable (rounded down), so a Deployment with four or more replicas can free a GPU by removing an old pod first, running short until the rollout ends. With fewer replicas, or `maxUnavailable: 0`, on a pool with no free cards, the new pods stay Pending. The rollout reports `ProgressDeadlineExceeded` after its progress deadline (600 seconds by default), and Kubernetes doesn't roll it back for you. Blue-green avoids that but doubles the GPU bill while both versions run.

The usual answer is a canary: a second Deployment with one or two replicas of the new version behind an HTTPRoute that splits traffic by weight, on GPUs held back as headroom or freed by shrinking the stable Deployment. Then:

- Pin weights to an immutable version, a registry version or a commit hash, so a restarted pod can't quietly load a different model.
- Gate on time to first token, error rate and a quality signal. Offline evals, shadow traffic and canary analysis are in [MLOps interview questions](/blog/mlops-interview-questions), and the general mechanics in the free [canary deployment question](/questions/canary-deployments-test-in-production-safely).

### 14. How do you make a model rollback fast?

Make it a routing change. If the previous version is still running, even with fewer replicas, rollback is a weight change on the route. If it was scaled away, rollback is a cold start, and the old weights should at least still be in the node cache. The slower failures are compatibility problems:

- **Prompt templates and tokenizers.** An app that changed its prompt format for the new model can break against the old one. Version the template with the model and roll back both.
- **The API contract.** Clients should call a stable model name that the platform maps to a version, so rollback needs no client change.

## Interview questions this covers

- How would you design a platform that serves LLMs to many internal teams?
- How do you estimate how many GPUs a model needs?
- Which metric would you autoscale an inference service on, and why not GPU utilization?
- How do you cut cold-start time for a model server?
- How do you calculate cost per request, and how do you bring it down?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

None of the books covers AI infrastructure end to end, but the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle) covers the platform underneath it: five books and 252 senior-level questions with worked answers across cloud, Kubernetes, Terraform, CI/CD and SRE. Some are about AI and ML workloads: cutting AI/ML infrastructure costs without sacrificing training throughput or inference latency (Cloud Platforms), designing a custom Kubernetes scheduler for GPU ML workloads and building an MLOps platform on Kubernetes (Containers & Orchestration), and building a pipeline that trains, validates and ships a model (CI/CD & GitOps). Every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a system-design walkthrough scaffold. If a full AI infrastructure book goes ahead, the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions) is where to get the one email about it.
