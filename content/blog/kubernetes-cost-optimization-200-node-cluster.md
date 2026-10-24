---
title: Kubernetes Cost Optimization for a 200-Node EKS Cluster
description: Kubernetes cost optimization for a 200-node EKS cluster: find the waste, right-size requests, run spot safely, and choose Karpenter or Cluster Autoscaler.
date: 2026-10-24
keywords: kubernetes cost optimization, reduce kubernetes costs, karpenter vs cluster autoscaler, kubernetes resource requests and limits, spot instances kubernetes, kubernetes cost optimization interview questions
source_video_id: VYPjNDu_wmE
---

"We run a 200-node EKS cluster with about 400 microservices. The bill is out of control, and the VP of Engineering wants it cut by 40 percent without hurting reliability. Walk me through your approach." This is a common senior Kubernetes cost optimization interview question, and the weak answer is "right-size the pods", which is too vague to act on. Interviewers want an order of operations: measure first, take the low-risk wins, then make the architectural changes, and explain the trade-off at each step.

The video version covers the same scenario if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/VYPjNDu_wmE" title="Cut Kubernetes Cluster Costs: Real Tactics" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## Why do resource requests drive Kubernetes costs?

The scheduler places a pod by comparing the requests already on a node against that node's allocatable capacity. What the pods actually use plays no part in the decision. If every service copied a template that requests 2 CPU and 4Gi of memory, nodes fill up on paper long before they do in reality, and new pods need new nodes while existing ones sit mostly idle.

Picture a node with 32 vCPU allocatable, 31 vCPU requested and 3 vCPU in use. To the scheduler it has one CPU left, so the next 2-CPU pod cannot land there. The autoscaler is just as blind: Cluster Autoscaler judges whether a node is underutilized by the sum of its pods' requests, not by measured usage, so over-requesting can keep a mostly idle node above the scale-down threshold.

Worth saying out loud in an interview: if a container sets a limit but no request, and no LimitRange supplies a default, Kubernetes copies the limit into the request, so generous limits quietly become generous requests.

## How do you find where the money goes?

Before editing a single manifest, get cost allocation. [OpenCost](https://opencost.io/docs/specification) is the CNCF project that Kubecost originally built; it breaks cluster cost down by namespace, controller, pod or label. The Helm chart assumes you already run Prometheus, so point it at yours in `values.yaml`:

```bash
helm repo add opencost-charts https://opencost.github.io/opencost-helm-chart
helm repo update
helm install opencost opencost-charts/opencost \
  --namespace opencost --create-namespace -f values.yaml
```

The API listens on port 9003. This pulls the ten most expensive namespaces over the last week:

```bash
# in a second terminal: kubectl -n opencost port-forward deployment/opencost 9003
curl -sG http://localhost:9003/allocation \
  -d window=7d -d aggregate=namespace \
  | jq '.data[0] | to_entries | sort_by(-.value.totalCost) | .[:10]
        | map({namespace: .key, totalCost: .value.totalCost})'
```

How OpenCost assigns cost separates two different problems. Its specification charges each workload for the larger of what it requested and what it used. A container that requests 2 CPU and uses 200m is billed for 2 CPU, so over-requesting shows up on the owning team's line. Capacity that no workload requested or used lands in a separate `__idle__` entry, which the API returns when you add `includeIdle=true`.

- **High allocated cost, low usage:** pods ask for far more than they use. The fix is right-sizing.
- **Large idle cost:** nodes are running that nothing has claimed. The fix is better bin-packing and scale-down.

Mixing them up is how optimization projects stall: autoscaler tuning cannot fix over-requested pods, and right-sizing cannot remove nodes the autoscaler keeps. Before quoting numbers to a VP, check how OpenCost prices your nodes (list prices versus your discounted or spot rates); treat the first report as a ranking, not an invoice.

## How do you right-size requests without breaking production?

Once you know which namespaces cost the most, fix their requests. [Goldilocks](https://goldilocks.docs.fairwinds.com/installation/) from Fairwinds creates a Vertical Pod Autoscaler object in recommendation-only mode for each workload in a namespace you label, then shows the recommendations per container in a dashboard. It needs only the VPA recommender, not the VPA updater or admission controller, so nothing gets changed automatically. Install the recommender first, or set `vpa.enabled=true` to have the Goldilocks chart install it as a sub-chart.

```bash
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm install goldilocks fairwinds-stable/goldilocks \
  --namespace goldilocks --create-namespace

kubectl label namespace payments goldilocks.fairwinds.com/enabled=true
kubectl -n goldilocks port-forward svc/goldilocks-dashboard 8080:80
```

Let the recommender observe a full business cycle, including peak traffic and scheduled jobs, before trusting it. Then move the numbers into your Helm values or GitOps manifests and roll them out service by service. The code does not change, but requests do more than steer the scheduler, so watch three things:

- **CPU:** a lower request means a smaller guaranteed share when the node is contended. Throttling comes from CPU limits, not requests.
- **Memory:** be conservative. When a node runs short of memory, the kubelet's eviction ranking puts pods using more than they requested ahead of the rest, and a limit set too low gets the container OOMKilled. The [production debugging walkthrough](/blog/kubernetes-production-debugging-walkthrough) covers what that failure looks like.
- **HPA targets:** an HPA computes CPU utilization against the request. Lower the request and the same usage reads as a higher percentage, so a service scaled on a CPU target can add replicas and claw back the saving. Revisit the HPA target in the same change.

Should you let VPA apply changes automatically? Its `Recreate` mode evicts pods so their replacements start with new values. `Auto` was deprecated in VPA 1.5.0 and is currently an alias for `Recreate`. Newer releases add `InPlaceOrRecreate`, which resizes pods in place when it can and falls back to eviction when it cannot. Any of these needs solid PodDisruptionBudgets and readiness probes first, and the VPA project warns against having VPA and an HPA both act on CPU or memory for the same workload.

## How do you run spot instances on Kubernetes safely?

Right-sizing reduces how many nodes you need. Spot reduces what each node costs. AWS advertises spot at [up to 90 percent off On-Demand](https://aws.amazon.com/ec2/spot/); the real discount varies by instance type, region and time. The catch: EC2 can reclaim a spot instance with two minutes' notice.

Do it deliberately:

- **Separate the capacity.** Taint spot nodes so only workloads validated for interruption can land there. A toleration only permits scheduling on a tainted node; it does not attract pods to it. Add a node selector as well, using the label your provisioner sets: `karpenter.sh/capacity-type: spot` with Karpenter, or `eks.amazonaws.com/capacityType: SPOT` on EKS managed node groups.

```yaml
# Pod template of a deployment validated for spot interruption
nodeSelector:
  karpenter.sh/capacity-type: spot
tolerations:
  - key: spot
    operator: Equal
    value: "true"
    effect: NoSchedule
```

- **Diversify instance types and zones.** Spot capacity is priced and reclaimed per pool, so more pools means fewer simultaneous losses. With Cluster Autoscaler, every instance type in one node group must have the same vCPU and memory (m5.xlarge, m5a.xlarge and m6i.xlarge all have 4 vCPU and 16 GiB), so add more node groups for more shapes. Karpenter can choose from a broad list in one NodePool.
- **Handle the notice.** Something must cordon and drain the node when the warning arrives: Karpenter's interruption queue (SQS plus EventBridge rules) does this, as does AWS Node Termination Handler on self-managed node groups. Pods should shut down cleanly well inside two minutes.
- **Know what PodDisruptionBudgets do here.** A PDB limits voluntary evictions such as drains, consolidation and scale-down. It cannot stop AWS reclaiming the instance; when the two minutes are up, the node is gone either way. Reliability on spot comes from replicas spread across many pools and zones, with the PDB keeping planned disruption orderly.

Keep stateful systems, singletons and long batch jobs without checkpointing on on-demand capacity.

## Karpenter vs Cluster Autoscaler: which one saves more?

Cluster Autoscaler resizes node groups you defined in advance (Auto Scaling groups on AWS). It scales up when pods are unschedulable and, by default, marks a node for removal when the requests on it fall below 50 percent of allocatable and stay there for 10 minutes, provided its pods can move elsewhere. It can only add the shape a group defines, so if the only group runs 16-CPU nodes, a pending pod that needs 3 CPU gets a new 16-CPU node.

Karpenter works from the pending pods instead. It picks instance types from the NodePool's requirements to fit what is waiting, launches them directly, and runs consolidation: deleting empty nodes and replacing or merging underutilized ones. Its core lives in kubernetes-sigs under SIG Autoscaling (not, as often claimed, a CNCF project), with providers for AWS and Azure.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: spot-general
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      taints:
        - key: spot
          value: "true"
          effect: NoSchedule
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
    budgets:
      - nodes: "10%"
  limits:
    cpu: "1000"
```

The trade-offs interviewers probe:

- **Churn.** Consolidating occupied nodes moves pods. PDBs, the `karpenter.sh/do-not-disrupt` annotation and NodePool disruption budgets (10 percent of nodes by default) limit how much moves at once, but your monitoring needs to tell routine restarts apart from real regressions.
- **Spot replacement.** Karpenter deletes empty or redundant spot nodes by default, but replacing one spot node with a cheaper one requires the `SpotToSpotConsolidation` feature flag and, for single-node replacement, at least 15 candidate instance types.

The [Karpenter migration guide](https://karpenter.sh/docs/getting-started/migrating-from-cas/) does not run both autoscalers side by side: it pins Karpenter's controller to an existing node group, scales Cluster Autoscaler to zero, then shrinks the old node groups while Karpenter provisions replacements. On EKS, lowering a managed node group's desired size terminates instances without honoring PDBs, and the Auto Scaling group chooses which ones go. So empty the nodes before shrinking anything: keep the controller on a node group you are not retiring, cordon the retiring nodes, drain them in small batches with `kubectl drain` (eviction respects PDBs), and shrink or delete those groups only once they run nothing but DaemonSet pods.

## Can topology spread constraints inflate your node count?

Yes. A chart written years ago might say "spread evenly across zones, never schedule anything that breaks the spread":

```yaml
# Strict: a pod stays Pending rather than exceed the skew
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: internal-reports
```

With `DoNotSchedule`, if the zone that would keep the skew in bounds has no room, the pod stays Pending, and the only way to place it is a new node in that specific zone, even when other zones have plenty of free capacity. The same rules work against scale-down: Cluster Autoscaler will not remove a node whose pods have nowhere legal to go, and Karpenter's consolidation runs the same check. Required pod anti-affinity on `kubernetes.io/hostname` (one replica per node) has the same effect at higher replica counts.

Audit these rules per service. Keep strict zone spreading where a service genuinely needs to survive a zone failure. For low-traffic internal services, a soft constraint lets the scheduler prefer an even spread without blocking placement:

```yaml
# Soft: spread is a scoring preference, not a hard rule
topologySpreadConstraints:
  - maxSkew: 2
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: internal-reports
```

The price of `ScheduleAnyway` is that the spread is no longer guaranteed. Pods that define no constraints of their own and belong to a Service, ReplicaSet or StatefulSet already get the scheduler's built-in soft defaults (`maxSkew: 3` per hostname and `maxSkew: 5` per zone, both `ScheduleAnyway`).

## Which metric shows a cluster is over-provisioned?

Track requested-to-allocatable utilization, for CPU and memory separately: the share of each node's allocatable capacity that pods have requested. It maps directly to node count. A quick per-node view:

```bash
kubectl describe nodes | grep -A 8 "Allocated resources"
```

For a dashboard, kube-state-metrics exposes both sides:

```promql
sum(
  kube_pod_container_resource_requests{resource="cpu"}
  * on (namespace, pod) group_left ()
  (kube_pod_status_phase{phase="Running"} == 1)
)
/
sum(kube_node_status_allocatable{resource="cpu"})
```

Treat this as an approximation: it ignores init containers, pod overhead and pods still starting. Where you can scrape kube-scheduler, its `kube_pod_resource_request` metric on the `/metrics/resources` endpoint reports the effective request the scheduler actually uses. Either way, read it alongside actual usage against requests. A low requested ratio points at idle capacity the autoscaler is not removing. A high requested ratio with low real usage points at over-requesting, the right-sizing problem. There is no universal target; the right number depends on how much headroom you keep for traffic surges, zone loss and autoscaler lag. For reference, Cluster Autoscaler's default scale-down threshold treats a node under 50 percent requested as removable.

## In what order should you apply Kubernetes cost optimization changes?

| Step | What it fixes | Risk | Effort |
|---|---|---|---|
| 1. OpenCost visibility | Shows who drives cost; separates over-requesting from idle | None (read-only) | Low |
| 2. Right-size requests | Over-requested pods inflating node count | Low with memory headroom and gradual rollout | Medium |
| 3. Spot for tolerant workloads | Price per node | Medium | Medium |
| 4. Karpenter or a tuned Cluster Autoscaler | Idle capacity and poor bin-packing | Medium (pod churn) | High |
| 5. Spread constraint audit | Nodes held up by strict placement rules | Low to medium | Low |

Measure after each step so you can show which change saved what. Once right-sizing has settled the steady baseline, cover the always-on on-demand capacity with Savings Plans or Reserved Instances; committing before right-sizing locks in the waste. And stop the problem returning: a LimitRange gives containers that omit requests a default, and a ResourceQuota caps what each namespace can request. On a shared cluster, quotas pair with the per-team permissions in the [RBAC lockdown guide](/blog/kubernetes-rbac-least-privilege-lockdown).

A strong close sounds like this: "I would start with visibility and right-sizing because they are low risk and show where the rest of the money is, move tolerant workloads to spot once interruption handling is proven, and treat the autoscaler change as the biggest project because it touches every workload."

## Interview questions this covers

- Why does the Kubernetes scheduler use requests rather than actual usage, and what does that mean for cost?
- How would you cut the bill of a 200-node cluster by 40 percent without hurting reliability?
- Karpenter vs Cluster Autoscaler: how does each decide when to add and remove nodes?
- What does a PodDisruptionBudget protect against on spot capacity, and what can it not prevent?
- How can topology spread constraints increase your node count?

The [25 Kubernetes interview questions for 2026](/blog/kubernetes-interview-questions-2026) cover more of the scheduling, networking and debugging ground.

Cost questions lead straight into the rest of the Kubernetes interview: how you set requests and limits across a multi-tenant cluster, what happens when a node runs out, and how a tenancy model keeps unit economics sane. [Containers & Orchestration](/ebooks/container-orchestration-journey) covers that arc with 52 worked questions, follow-up chains and production war stories. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
