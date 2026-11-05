---
title: Kubernetes GPU Sharing: MIG, Time-Slicing, MPS and DRA
description: Kubernetes GPU sharing interview questions: the device plugin and GPU Operator, MIG vs time-slicing vs MPS, Dynamic Resource Allocation, taints and GPU cost.
date: 2026-11-05
keywords: kubernetes gpu sharing, kubernetes gpu sharing interview questions, mig vs time-slicing vs mps, nvidia gpu operator kubernetes, dynamic resource allocation gpu kubernetes, kubernetes gpu utilization and cost
topic_id: A02
---

Kubernetes GPU sharing usually comes up in an interview as a cost problem: a small model holds a whole card, and the card sits mostly idle. The interviewer then wants to know how a pod gets a GPU at all, what MIG, time-slicing and MPS each isolate, where Dynamic Resource Allocation fits, and how you would prove the savings. These questions follow that order. They assume NVIDIA hardware, since that's where most of the tooling and most of the interview questions are.

## How does Kubernetes schedule a GPU by default?

### 1. What does the NVIDIA device plugin actually do?

It runs as a DaemonSet, finds the GPUs on each node and advertises them to the kubelet as an extended resource, `nvidia.com/gpu`. From then on the scheduler treats GPUs as a count, and a pod asks for them in its limits:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

Three follow-ups come straight from that design:

- **Why can't a pod ask for half a GPU?** The API server [restricts extended resources to whole numbers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#consuming-extended-resources), so `0.5` is rejected. Every sharing method has to work around that.
- **Why limits and not requests?** [GPUs are only specified in limits](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/). The limit becomes the request, and if you set both they must match, because extended resources can't be overcommitted.
- **What can't the scheduler see?** Anything other than the count. Memory size, model and how busy the card is aren't part of the decision unless you add node labels and selectors.

The [plugin's README](https://github.com/NVIDIA/k8s-device-plugin#running-gpu-jobs) also warns about containers that don't request a GPU. Depending on the node's runtime configuration they can still see all of them, because [base CUDA images default `NVIDIA_VISIBLE_DEVICES` to `all`](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/docker-specialized.html). That's a good reason to keep general workloads off these nodes.

### 2. What does the GPU Operator add on top?

The device plugin assumes the node already has an NVIDIA driver and container runtime support. The [GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/overview.html) manages that whole stack: driver, container toolkit, device plugin, GPU Feature Discovery labels, the DCGM exporter and the MIG Manager. If your node image already ships the driver, install with `driver.enabled=false` and let the Operator handle the rest.

## Kubernetes GPU sharing: MIG vs time-slicing vs MPS

They differ mainly in what they isolate.

| | Time-slicing | MPS | MIG |
|---|---|---|---|
| How it shares | Processes take turns on the GPU | Kernels from different processes run concurrently | Fixed hardware partitions |
| Memory | Shared, no per-pod limit | Separate address spaces, per-client limit | Dedicated to each instance |
| Compute | Equal time per process, no guarantee | Limited per client | Dedicated to each instance |
| Fault isolation | None | None between clients on the same GPU | Yes, between instances |
| Hardware | NVIDIA GPUs generally | Whole GPUs only in the device plugin | Ampere and newer data center GPUs |

### 3. What does time-slicing isolate?

Nothing. The device plugin advertises several replicas of each GPU and hands them to whoever asks. This config makes one GPU look like four:

```yaml
version: v1
flags:
  migStrategy: none
sharing:
  timeSlicing:
    failRequestsGreaterThanOne: true
    resources:
    - name: nvidia.com/gpu
      replicas: 4
```

Replicas aren't units of capacity. [NVIDIA's docs](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html) are explicit: with four replicas, a pod requesting two gets the same share of compute as a pod requesting one. Setting `failRequestsGreaterThanOne: true` makes that request fail with `UnexpectedAdmissionError` instead of quietly misleading someone. It defaults to `false`.

Memory is the bigger risk. Each workload can reach all of the GPU's memory, so one pod can use up what its neighbour needed. The workloads also share a fault domain. The README's wording is blunt: "if one workload crashes, they all do."

Time-slicing suits dev environments, notebooks and bursty batch jobs from teams who trust each other, and not much else.

### 4. What does MIG isolate, and what does it cost you?

[MIG](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/introduction.html) splits one GPU into up to seven instances, with separate paths through the memory system, partitioned compute and fault isolation between them. One tenant's heavy load doesn't take another's cache allocation or memory bandwidth, so performance stays predictable.

Profile names give you the slice and the memory. On an H100 80GB, [`1g.10gb`](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/latest/supported-mig-profiles.html) gets 1/7 of the compute and 1/8 of the memory, and you can fit seven. On an A100 40GB the same slot is `1g.5gb`. MIG starts at the Ampere generation, and [the supported list](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/supported-gpus.html) doesn't include T4, L4 or L40S, so it won't help on those cards.

With the GPU Operator you pick a layout through a node label:

```bash
kubectl label nodes gpu-node-1 nvidia.com/mig.config=all-1g.10gb --overwrite
```

The [`single` strategy](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-operator-mig.html) exposes every slice as `nvidia.com/gpu` and needs the same profile on all the node's GPUs. The `mixed` strategy gives each profile its own resource, such as `nvidia.com/mig-1g.10gb`.

The costs:

- **Reconfiguring is disruptive.** MIG Manager requires that no user workloads are running on the GPUs being changed, and some clouds need a reboot. A layout is a capacity-planning decision, not something a pod chooses.
- **Slices don't lend to each other.** Whatever a tenant leaves idle inside its slice stays idle.
- **Multi-GPU work suffers.** [Peer-to-peer between MIG instances on different GPUs isn't supported](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/latest/deployment-considerations.html), so large distributed training belongs on whole cards.

Can you combine them? In the device plugin, yes for time-slicing on top of MIG resources from the `mixed` strategy, and no for MPS, which isn't supported on MIG-enabled devices there.

### 5. What does MPS isolate?

Memory and compute, but not faults. A control daemon manages access to the GPU, and [kernels from different processes can run concurrently](https://docs.nvidia.com/deploy/mps/when-to-use-mps.html), which helps when no single process has enough work to saturate the card. Clients get isolated address spaces. The device plugin limits each replica to an equal fraction of device memory and also limits its compute.

It isn't full isolation. A fatal fault from one client reaches every client on that GPU, and it [spreads further](https://docs.nvidia.com/deploy/mps/when-to-use-mps.html#memory-protection-and-error-containment) when one of those clients also uses another GPU. The error doesn't say which client caused it. The device plugin also labels its MPS support experimental, and time-slicing and MPS are mutually exclusive there.

### 6. Which one would you pick?

Start with who shares the card:

- **Tenants who shouldn't affect each other, or inference with a latency target:** MIG, or a whole GPU if the model doesn't fit a slice.
- **Dev, notebooks and trusted bursty jobs:** time-slicing.
- **Small trusted processes that don't saturate a GPU and need to run at the same time:** MPS, after you've tested it on your own workload.
- **Training or a large model that fills the card:** don't share it.

## What does Dynamic Resource Allocation change for GPUs?

### 7. What problem does DRA solve?

The count. [DRA graduated to GA in Kubernetes 1.34](https://kubernetes.io/blog/2025/09/01/kubernetes-v1-34-dra-updates/), and from 1.35 its feature gate is locked on. Instead of asking for a number of an extended resource, a pod references a claim. The driver publishes its devices with their attributes and capacity, and the claim selects from them with a CEL expression, so the scheduler can match on things it could never see before:

```yaml
apiVersion: resource.k8s.io/v1
kind: ResourceClaimTemplate
metadata:
  name: large-gpu
spec:
  spec:
    devices:
      requests:
      - name: gpu
        exactly:
          deviceClassName: gpu.nvidia.com
          selectors:
          - cel:
              expression: device.capacity['gpu.nvidia.com'].memory.compareTo(quantity('40Gi')) >= 0
---
apiVersion: v1
kind: Pod
metadata:
  name: inference
spec:
  resourceClaims:
  - name: gpu
    resourceClaimTemplateName: large-gpu
  containers:
  - name: server
    image: registry.example/server:v1
    resources:
      claims:
      - name: gpu
```

A template gives each pod its own claim, and that claim is deleted with the pod. A standalone `ResourceClaim` referenced by several pods shares one allocation.

Know which parts are mature, because this is moving quickly. In the [NVIDIA DRA driver](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/dra-intro-install.html), full GPUs and existing MIG slices are GA. MPS, custom time-slice intervals, dynamic MIG creation and consumable shares are all alpha gates, off by default. Consumable shares build on [consumable capacity](https://kubernetes.io/docs/concepts/resource-management/dynamic-resource-allocation/dra-features/#consumable-capacity), beta in Kubernetes since 1.36, which lets independent claims share one device while the scheduler tracks how much is used. Device plugin replicas never gave you that accounting.

### 8. Would you move to DRA today?

On a new cluster where you want attribute-based selection, it's a reasonable default. For a fleet where the device plugin works, plan it rather than rush it, because of these catches:

- **Migration.** With the GPU Operator, a cluster has either a `GPUCluster` for DRA or a `ClusterPolicy` for the device plugin, not both, and moving in place isn't supported. That workflow means a new cluster.
- **Preemption.** [The scheduler doesn't preempt for DRA resources](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/), so a high-priority pod waits until a device frees up. If your design relies on [pod priority and preemption](/questions/pod-priority-and-preemption-who-gets-evicted) to evict batch work for inference, that's a real gap.
- **Autoscaling.** [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/docs/dra_support.md) can scale a DRA node group up from zero only if the cloud provider implements it for that driver. Otherwise you keep at least one node.

There's a bridge for old manifests: a DeviceClass can set [`extendedResourceName`](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/#extended-resources-allocation-by-dra), so pods still asking for an extended resource can get devices through DRA. It went stable in 1.37.

## How do you keep GPU nodes for GPU workloads?

### 9. How do taints and node pools fit in?

Give GPUs their own node pools and use two mechanisms together, because they do different jobs. A taint keeps other pods off, and a label selector or affinity pulls GPU pods on. A toleration alone only permits a pod to land there. The free [taints and node affinity question](/questions/taints-tolerations-and-node-affinity-quick-guide) covers the general distinction.

```yaml
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
  nodeSelector:
    nvidia.com/gpu.product: A100-SXM4-40GB
```

Tainting with the resource name lets the [`ExtendedResourceToleration`](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#extendedresourcetoleration) admission controller add that toleration for you, though it isn't on by default. GKE adds the [`nvidia.com/gpu=present:NoSchedule` taint](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/gpus) itself when you add a GPU pool to a cluster that already has a non-GPU pool, so check what your provider does.

Separate the pools by GPU model and by sharing mode too, since the plugin applies one sharing method to all the GPUs on a node. On shared clusters, a [ResourceQuota on `requests.nvidia.com/gpu`](https://kubernetes.io/docs/concepts/policy/resource-quotas/) caps each team, and the [multi-tenant cluster design](/blog/kubernetes-multi-tenancy-shared-cluster-design) post covers the rest of that layout. Time-slicing replicas count as GPUs in that quota, so a limit of four could mean a single physical card.

## How do you measure GPU utilization and cost?

### 10. How do you prove that sharing saves money?

Keep allocation and real use apart. A pod holding `nvidia.com/gpu: 1` blocks the card whether it's working or not. [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md) makes the same assumption: `scale-down-gpu-utilization-threshold` (default 0.5) compares GPU requests with allocatable GPUs and ignores CPU and memory. A node full of idle GPU pods never looks underused to it.

For real use, the DCGM exporter gives you hardware numbers:

- `DCGM_FI_PROF_GR_ENGINE_ACTIVE`: the fraction of time the graphics or compute engines were active.
- `DCGM_FI_PROF_SM_ACTIVE`: closer to useful work, though commented out in the exporter's default counters. [NVIDIA's guidance](https://docs.nvidia.com/datacenter/dcgm/latest/user-guide/feature-overview.html) is that 0.8 or above is necessary but not sufficient for effective use, and below 0.5 likely means ineffective use.
- `DCGM_FI_DEV_FB_USED`: GPU memory in use on the device. Measure a workload's peak on a dedicated card, add headroom, and you know which slice it fits.

This query averages engine activity per GPU, and per MIG instance where one exists:

```promql
avg by (UUID, GPU_I_ID) (avg_over_time(DCGM_FI_PROF_GR_ENGINE_ACTIVE[7d]))
```

Monitoring has two gaps here. The exporter [can't associate metrics with containers when time-slicing is on](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html), so per-team chargeback gets harder. And on Ampere GPUs, [NVML and `nvidia-smi` can't attribute utilization to MIG devices](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/getting-started-with-mig.html), so use DCGM there.

Then report a unit cost: cost per thousand requests for inference, or per run for training. Measure throughput on the slice instead of assuming it. Sharing has only saved money if that unit cost falls and the latency target still holds. The rest of the toolkit is the usual one, covered in [Kubernetes cost optimization for a 200-node cluster](/blog/kubernetes-cost-optimization-200-node-cluster): scale dev GPU pools to zero outside working hours, and run checkpointed training on spot. The wider round is on the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions).

## GPU sharing scenario-based interview questions

### 11. You turned on time-slicing and pods stopped scheduling. Why?

Sharing changes what the node advertises, in one of two ways:

- With `renameByDefault: true`, the resource becomes `nvidia.com/gpu.shared`, so pods asking for `nvidia.com/gpu` no longer fit.
- With the default of `false`, the resource name stays but the product label gains a suffix, such as `A100-SXM4-40GB-SHARED`, so an exact `nodeSelector` on the old value stops matching.

The Operator also doesn't watch time-slicing ConfigMaps, so after editing one you restart the device plugin pods yourself.

### 12. Two pods share a GPU and one keeps hitting CUDA out-of-memory. What do you do?

Find out what's holding the memory. `nvidia-smi` on the node lists GPU processes and their memory use, while `DCGM_FI_DEV_FB_USED` only gives the device total. On a time-sliced GPU nothing stops a neighbour from taking it all. A framework cap such as PyTorch's [`set_per_process_memory_fraction`](https://docs.pytorch.org/docs/2.15/generated/torch.cuda.memory.set_per_process_memory_fraction.html) helps, but it limits that process's caching allocator and depends on every team setting it. The real fix is a boundary the platform enforces: MIG slices, MPS limits, or separate cards.

### 13. A GPU pod is Pending but the cluster has free GPUs. Where do you look?

`kubectl describe pod` first, then compare the event's reason with what the nodes advertise:

```bash
kubectl describe node gpu-node-1 | grep -E 'nvidia.com/(gpu|mig)'
```

The usual causes:

- The plugin or driver isn't up, so the node advertises zero.
- The MIG layout doesn't offer the profile the pod requested.
- A taint has no matching toleration, or a label doesn't match.
- The free GPUs are spread out: a pod needs two on one node, and two nodes each have one free.

If the autoscaler is involved, its [`resourceUnready`](https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md) count points at nodes whose GPU resource never registered.

## Interview questions this covers

- How does Kubernetes schedule a GPU, and why can't a pod request half of one?
- MIG vs time-slicing vs MPS: what does each one isolate?
- What does Dynamic Resource Allocation change compared with the device plugin?
- How do you keep general workloads off GPU nodes?
- How do you measure GPU utilization and prove that sharing saved money?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

None of the books covers AI infrastructure end to end, but they cover the platform underneath it. [Containers & Orchestration: Kubernetes Interview Questions](/ebooks/container-orchestration-journey) works through 52 senior-level questions with worked answers, including how you would design a custom scheduler for GPU ML workloads that prefers spot instances and how you would build an MLOps platform on Kubernetes. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework. If a full AI infrastructure book goes ahead, the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions) is where to get the one email about it.
