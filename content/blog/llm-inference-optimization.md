---
title: LLM Inference Optimization Interview Questions and Answers
description: LLM inference optimization interview questions on latency vs throughput, time to first token, continuous batching, KV cache, quantization and routing.
date: 2026-11-19
keywords: llm inference optimization, llm inference optimization interview questions, llm serving performance interview questions, time to first token optimization, continuous batching and kv cache, vllm performance tuning
topic_id: A04
---

LLM inference optimization questions come up whenever a team self-hosts a model and the first GPU bill or latency complaint arrives. The interviewer wants to know whether you can make one GPU serve more requests inside the latency target, and explain why each change works. Most answers come back to two phases with very different costs: prefill, which processes the whole prompt at once, and decode, which produces one token per step. The platform around the model server is in [AI infrastructure engineer interview questions](/blog/ai-infrastructure-engineer-interview-questions), and shorter answers on autoscaling and monitoring are on the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions).

## How do you measure LLM inference performance?

### 1. What do time to first token, time per output token and throughput measure?

A chat user and a batch job care about different numbers, so an LLM service needs a target for each.

| Metric | What it measures | What drives it |
|---|---|---|
| Time to first token (TTFT) | Request arrival to the first streamed token | Queue wait plus prefill, so load and prompt length |
| Time per output token (TPOT) | Average gap per token after the first, for one request | Decode speed, which slows as the batch grows, and any stalls |
| Inter-token latency (ITL) | Each gap between streamed outputs | Decode speed, plus stalls when other requests' prefills run |
| End-to-end latency | Arrival to the last token | TTFT plus TPOT times (output tokens minus one) |
| Throughput | Tokens per second across all requests | Batch size and GPU memory bandwidth |
| Goodput | Requests per second that meet every latency target | All of the above |

TPOT averages the gaps within a request, while ITL records each one, so ITL percentiles show stalls that TPOT averages away. vLLM exports both, as `vllm:request_time_per_output_token_seconds` and `vllm:inter_token_latency_seconds`. An isolated pause can hide even in p99, so check the maximum gap. With speculative decoding, one streamed output can carry several tokens.

### 2. Why do latency and throughput pull against each other?

Because of how decode uses the GPU. Each decode step reads all of a dense model's weights from GPU memory to produce one token per sequence in the batch. With one sequence, the GPU spends most of the step waiting on memory: decode is memory-bandwidth-bound. Add sequences and the same weight read serves all of them, so throughput climbs steeply at first. But each step also has more work to do and more KV cache to read, so it gets slower, and every user's TPOT rises with it. Prefill is the opposite: the prompt's tokens are processed in parallel and keep the compute units busy.

A chat product runs the largest batch that keeps TTFT and TPOT inside the target, so it tunes for goodput rather than peak tokens per second. An offline batch job can ignore per-token latency and use whatever batch and token budgets give the most sustained throughput in a benchmark.

### 3. How would you benchmark a model server before it takes traffic?

With your own prompt and output lengths, at several request rates, reading percentiles instead of averages. vLLM's `vllm bench serve` runs against an OpenAI-compatible server. This run sends 600 requests at four a second, forces each to generate the full 300 tokens with `--ignore-eos`, and counts how many met a one-second TTFT and a 50 ms TPOT:

```bash
vllm bench serve \
  --base-url http://chat-llm.inference.svc:8000 \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --dataset-name random \
  --random-input-len 2000 \
  --random-output-len 300 \
  --ignore-eos \
  --request-rate 4 \
  --num-prompts 600 \
  --percentile-metrics ttft,tpot,itl,e2el \
  --metric-percentiles 50,95,99 \
  --goodput ttft:1000 tpot:50
```

Step the request rate up in sustained runs. The highest rate that still meets the latency percentiles, with a queue that isn't growing, is one replica's capacity for this workload. Running plus waiting requests per replica at that rate, less some headroom, is a starting autoscaling target to validate under changing load. Replica cost divided by goodput there is the cost of a request that met its target. Three mistakes to avoid:

- **Random prompts share nothing**, so prefix caching never hits. Add `--random-prefix-len` or replay real prompts if production shares a long system prompt.
- **The default request rate is `inf`**, which sends every request at once: a burst, not a steady load.
- **Testing only against the pod.** Run it through the gateway too, to see what routing and TLS add.

## LLM inference optimization on the model server

### 4. What is continuous batching, and why does it beat static batching?

Static batching collects a fixed group of requests and runs it until the longest one finishes. Slots whose answers are done sit idle, and new requests wait for the next group. Continuous batching, also called iteration-level scheduling, decides at every step: finished sequences free their slots, and waiting requests join at the next step if the token budget and KV cache allow. The GPU stays busier, and new requests use freed slots without waiting for the longest request in the batch to finish.

vLLM, SGLang and TensorRT-LLM (which calls it in-flight batching) all batch this way. In vLLM the two knobs are `--max-num-seqs`, the most sequences in one step, and `--max-num-batched-tokens`, the most tokens in one step. Raising `--max-num-seqs` buys throughput until TPOT leaves the target or the KV cache runs out.

### 5. A long prompt arrives and every other user's stream stutters. Why?

The long prompt's prefill. Without chunking, a 30,000-token prompt is processed in one go, and every decode in the batch waits for it, so the other users see a pause mid-answer: an ITL spike. Chunked prefill splits the prompt into pieces that run alongside the decodes over several steps. vLLM V1 turns it on by default where it can, and the [vLLM optimization guide](https://docs.vllm.ai/en/latest/configuration/optimization.html) notes that smaller `--max-num-batched-tokens` values give better ITL and larger ones better TTFT.

If chunking isn't enough, disaggregated serving runs prefill and decode on separate instances and moves the KV cache between them, so each side is tuned for its own target. vLLM marks its implementation experimental and [states that it does not improve throughput](https://docs.vllm.ai/en/latest/features/disagg_prefill.html). What it buys is separate control over TTFT and tail ITL.

### 6. How does the KV cache limit concurrency?

Every token in flight keeps its keys and values in GPU memory for every layer. For Llama 3 8B at 16 bits that's 128 KiB per token, so one 8,192-token sequence holds 1 GiB (the arithmetic is in the [AI infrastructure post](/blog/ai-infrastructure-engineer-interview-questions)). The memory the weights leave free decides how many sequences can run at once.

Earlier serving systems reserved space for the maximum length up front, much of it never used. vLLM's PagedAttention stores the cache in fixed-size blocks handed out as tokens arrive, much like virtual memory pages, so a sequence holds only what it has used. When the blocks still run out, vLLM preempts. In V1 the default mode is recompute: the request goes back to the waiting queue and redoes its prefill later. A climbing `vllm:num_preemptions` means you're paying for the same prefill twice. The levers:

- Set `--max-model-len` to what your traffic needs. A server that accepts 128K-token prompts lets one request take much of the cache.
- Cap `--max-num-seqs` so the scheduler stops admitting more than fits.
- Store the KV cache in FP8 (question 8).
- Add GPUs with tensor parallelism, leaving more memory on each for cache.

### 7. When does prefix caching help, and when does it do nothing?

It helps when many requests start with the same tokens: a long system prompt, a document several questions are asked about, a multi-turn chat's history. vLLM hashes each full KV block together with everything before it, so a new request with the same opening reuses those blocks and skips their prefill. It's on by default in V1.

It doesn't speed up decode, so the gain in total latency shrinks when generation dominates, and it only matches an exact prefix. Two common ways to lose it:

- **Something variable early in the prompt.** A timestamp or user name in the system prompt makes every prompt unique from the first block. Put static content first and per-request content last.
- **Round-robin routing.** A shared prefix gets computed and cached once on every replica. Prefix-aware routing fixes that (question 12).

The hit rate is `vllm:prefix_cache_hits` divided by `vllm:prefix_cache_queries`.

## How do you choose a quantization scheme for inference?

### 8. What do you gain and lose with FP8, INT8 and INT4?

Quantization shrinks the weights, which frees memory for the KV cache and cuts the bytes each decode step reads. The cost is some accuracy, more for some models and tasks than others.

| Scheme | What's quantized | Memory vs 16-bit | Fits best | Watch for |
|---|---|---|---|---|
| FP8 W8A8 | Weights and activations | About half the weights | High-concurrency serving | On NVIDIA, FP8 compute needs compute capability 8.9 or newer (Ada, Hopper, Blackwell); Ampere runs FP8 checkpoints weight-only |
| INT8 W8A8 | Weights and activations | About half the weights | High-QPS and offline serving | Activation outliers make calibration matter |
| INT4 W4A16 (AWQ, GPTQ) | Weights only | About a quarter of the weights | Low-concurrency, latency-sensitive serving, or fitting a model on a smaller card | Gains shrink as batches grow and compute dominates |
| FP8 KV cache | The cache, not the weights | About half the cache | Longer contexts and more sequences per GPU | Without calibration the scales default to 1.0; some attention types are more sensitive |

The "fits best" column follows the [llm-compressor guidance](https://docs.vllm.ai/projects/llm-compressor/en/latest/guides/compression_schemes/). In vLLM the KV cache setting is one flag, `--kv-cache-dtype fp8`. Weight schemes usually come from a pre-quantized checkpoint that vLLM detects from its config.

### 9. How do you prove a quantized model is good enough?

Run the evals that gate any model release, on your own task's test set rather than perplexity or a leaderboard score, against the quantized and original models side by side. Include the cases you can least afford to get wrong, like long contexts, structured output and tool calls. Then benchmark both on the target GPU at your real request mix, since the speed-up depends on hardware and batch size. Ship it only when both gates pass, like any new model ([MLOps interview questions](/blog/mlops-interview-questions) covers eval gates and canaries).

## When do speculative decoding and parallelism pay off?

### 10. When does speculative decoding help?

Most when decode is memory-bound and the GPU has compute to spare, which means low to medium load. A cheap proposer (a small draft model, n-gram matches against the prompt, or an EAGLE head) guesses the next few tokens, and the target model checks all of them in one forward pass, so each accepted guess saves a step. vLLM's docs describe the sampling as lossless up to hardware precision.

At high load the batch already keeps the GPU busy and verification competes with real requests, so how much of the gain survives depends on the method, the acceptance rate and the workload. The [vLLM speculative decoding docs](https://docs.vllm.ai/en/latest/features/speculative_decoding/) rate EAGLE and MTP above a separate draft model or n-gram matching at high QPS. A draft model has to share the target's tokenizer, and the config goes in as JSON:

```bash
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --tensor-parallel-size 4 \
  --speculative-config '{"method": "draft_model", "model": "meta-llama/Llama-3.2-1B-Instruct", "num_speculative_tokens": 4}'
```

Benchmark it at production concurrency and watch the acceptance rate: a draft that's rarely accepted adds work for nothing.

### 11. Tensor parallelism or more replicas?

If the model fits on one GPU with room for a useful KV cache, more replicas is the simpler way to add throughput. Tensor parallelism splits every layer across GPUs. You need it when the weights don't fit, and it can also lower per-token latency, because each GPU reads only its share of the weights, as long as communication doesn't eat the gain. The cost is an all-reduce between the GPUs inside every layer, so it wants a fast interconnect. It can span nodes, but the common layout is tensor parallelism across the GPUs in a node and pipeline parallelism, which splits the layers into stages, across nodes.

## How do you route and scale on model-server load?

### 12. How should a gateway route LLM requests across replicas?

On what each replica already holds and how busy it is. Round-robin ignores both. With the Gateway API Inference Extension, a route sends traffic to an InferencePool and an endpoint picker chooses the replica. The full picker now lives in the llm-d project, and it ranks eligible replicas with the scoring plugins you configure. Three matter here:

- **prefix-cache-scorer** prefers a replica likely to hold the request's prefix already, which raises the cache hit rate and cuts TTFT.
- **queue-scorer** prefers replicas with short waiting queues.
- **kv-cache-utilization-scorer** prefers replicas with free cache, which lowers the chance of the request being preempted.

Weight prefix affinity too heavily and one popular system prompt piles onto one replica, so the load scores need the weight to pull traffic away. The free [Ingress vs Gateway API question](/questions/kubernetes-ingress-vs-gateway-api-what-changed) covers the routing model it plugs into.

### 13. Which signal should drive autoscaling once the server is tuned?

The one the benchmark found the limit on. If replicas at the sustainable rate from question 3 held about 30 running plus waiting requests each, scale on that number with a target a little under it, through KEDA and a Prometheus query. The [AI infrastructure post](/blog/ai-infrastructure-engineer-interview-questions) has a full ScaledObject, and the free [KEDA question](/questions/keda-event-driven-autoscaling-for-kubernetes) covers how KEDA feeds the HPA.

Keep TTFT and ITL percentiles as SLO alerts rather than scaling inputs. They lag behind the queue and move with prompt length as well as load. Re-run the benchmark after every tuning change, since a new `--max-num-seqs` or quantization scheme moves that limit and the scaling target with it.

## Which metrics show an inference server needs tuning?

### 14. What would you watch on a production model server?

Each symptom points at a lever:

| Symptom | Metric | Likely cause | Lever |
|---|---|---|---|
| High TTFT, queue growing | `vllm:num_requests_waiting`, `vllm:request_queue_time_seconds` | Not enough capacity | More replicas |
| High TTFT, queue empty | `vllm:request_prefill_time_seconds` | Long prompts, little cache reuse | Prompt layout, prefix-aware routing, larger prefill chunks |
| ITL spikes when long prompts arrive | `vllm:inter_token_latency_seconds` p99 | Prefill stalling decodes | Smaller `--max-num-batched-tokens`, disaggregated serving |
| Preemptions climbing | `vllm:num_preemptions`, `vllm:kv_cache_usage_perc` | KV cache full | Fewer sequences, FP8 KV cache, more GPU memory |

Counters such as `vllm:num_preemptions` and the prefix cache pair are exposed with a `_total` suffix, so the queries look like this:

```promql
# p95 time to first token
histogram_quantile(0.95, sum by (le) (rate(vllm:time_to_first_token_seconds_bucket{model_name="chat"}[5m])))

# prefix cache hit rate
sum(rate(vllm:prefix_cache_hits_total[5m])) / sum(rate(vllm:prefix_cache_queries_total[5m]))

# preemptions per second
sum(rate(vllm:num_preemptions_total[5m]))
```

The free [PromQL question](/questions/prometheus-promql-5-queries-you-must-know) covers `rate` and `histogram_quantile`.

## Interview questions this covers

- Why do latency and throughput trade against each other in LLM serving?
- What do continuous batching and chunked prefill fix?
- How does the KV cache limit concurrency, and what happens when it fills up?
- How do you choose between FP8, INT8 and INT4 quantization?
- How would you route and autoscale LLM traffic on model-server load?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

No book in the series covers LLM serving end to end, but the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle) covers the platform it runs on: five books and 252 senior-level questions with worked answers across cloud, Kubernetes, Terraform, CI/CD and SRE. A few are about AI and ML workloads: cutting AI/ML infrastructure costs without sacrificing training throughput or inference latency (Cloud Platforms), designing a custom Kubernetes scheduler for GPU ML workloads and building an MLOps platform on Kubernetes (Containers & Orchestration), and building a pipeline that trains, validates and ships a model (CI/CD & GitOps). Every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a system-design walkthrough scaffold. If a full AI infrastructure book goes ahead, the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions) is where to get the one email about it.
