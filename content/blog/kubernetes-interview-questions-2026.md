---
title: 25 Kubernetes Interview Questions You Will Actually Be Asked in 2026
description: Real Kubernetes interview questions from junior to senior level, with the answers interviewers are listening for: pods, services, scheduling, networking, debugging, and production war stories.
date: 2026-07-16
keywords: kubernetes interview questions, k8s interview questions 2026, kubernetes interview questions and answers, devops interview
---

Most Kubernetes interview lists are padded with definitions nobody asks anymore. Nobody senior is going to ask you "what is a pod" and stop there. What they will do is start with a simple question and drill into it until they find the edge of your knowledge. This list is organised the way real interviews go: each section starts with the opening question, then shows the follow-ups that separate a memorised answer from real experience.

## Fundamentals (asked at every level, drilled hard at senior level)

### 1. Why does Kubernetes use pods instead of scheduling containers directly?

Because some containers need to share a network namespace and volumes as a single unit. A pod gives its containers one IP, one localhost, and shared storage, which is what makes sidecar patterns (log shippers, service mesh proxies, init containers) possible. The follow-up is usually "give me a real case where you needed two containers in one pod." Have one ready.

### 2. A pod is stuck in Pending. Walk me through your debugging.

The answer they want is a sequence, not a guess:

```bash
kubectl describe pod <name>   # read Events first, always
```

Pending almost always means the scheduler cannot place it: insufficient CPU or memory on any node, a nodeSelector or affinity rule nothing satisfies, a taint without a matching toleration, or an unbound PersistentVolumeClaim. If the events show `FailedScheduling`, read the reason, it names the constraint. Saying "I would check the events before anything else" signals experience by itself.

### 3. What actually happens when you run kubectl apply?

kubectl sends the manifest to the API server, which validates it, runs admission controllers, and persists the object to etcd. Nothing is "created" yet. Controllers watching that resource type notice the new desired state and work to realise it: the Deployment controller creates a ReplicaSet, the ReplicaSet controller creates pods, the scheduler binds each pod to a node, and the kubelet on that node pulls images and starts containers. Interviewers love this question because it tests whether you understand Kubernetes as a set of reconciliation loops rather than a command executor.

### 4. Deployment vs StatefulSet vs DaemonSet. When is each one wrong?

A Deployment is wrong when pods need stable identities or ordered startup (databases, Kafka brokers). A StatefulSet is wrong for stateless services because you pay for ordering guarantees you do not need, and rolling updates are slower. A DaemonSet is wrong for anything that should not scale with the node count. The "when is it wrong" framing is increasingly common because it cannot be answered from a definition.

### 5. What is the difference between requests and limits, and what happens when each is exceeded?

Requests are what the scheduler reserves; limits are what the runtime enforces. Exceed a CPU limit and you get throttled. Exceed a memory limit and the kernel OOM-kills the container. The senior follow-up: "why might you set memory request equal to limit but leave CPU limit unset?" Because memory is incompressible (an OOM kill is data loss) while CPU throttling is survivable, many production teams set CPU requests only. Knowing this debate exists puts you ahead of most candidates.

## Networking and services

### 6. How does a ClusterIP service actually route traffic?

There is no proxy process sitting in the data path. kube-proxy programs iptables or IPVS rules on every node that rewrite the service's virtual IP to a randomly selected backend pod IP. The EndpointSlice controller keeps the backend list in sync with ready pods. If you can say "the ClusterIP never appears on the wire, it is rewritten before the packet leaves the node," you have answered at a senior level.

### 7. A service returns connection refused intermittently. Where do you look?

Check whether the endpoints list matches your expectation first: `kubectl get endpointslices` for the service. Intermittent failures usually mean some backends are unhealthy but still listed (readiness probe missing or wrong), a pod is being terminated while still receiving traffic (no preStop hook or too short a grace period), or the targetPort does not match the container port on some pods after a partial rollout.

### 8. Why do readiness and liveness probes exist separately, and how do you misuse them?

Readiness controls traffic (a failing pod is removed from endpoints); liveness controls restarts. The classic misuse is pointing a liveness probe at a dependency check: when the database blips, every pod fails liveness simultaneously and Kubernetes restarts your entire fleet, turning a dependency slowdown into a full outage. Liveness should check "is this process wedged," nothing more. Interviewers ask this because the failure mode is so common in production.

### 9. Explain NetworkPolicy default behaviour.

Without any NetworkPolicy, all pod-to-pod traffic is allowed. The moment any policy selects a pod, that pod denies everything not explicitly allowed in the policy's direction (ingress or egress). Also worth saying: NetworkPolicy does nothing unless the CNI plugin enforces it. Applying policies on a cluster whose CNI ignores them gives you compliance theatre, not security.

## Scheduling and reliability

### 10. How do taints and tolerations differ from node affinity?

Taints repel pods from nodes (node-driven); affinity attracts pods to nodes (pod-driven). A toleration only permits scheduling onto a tainted node, it does not require it, which is why dedicated node pools need both: a taint to keep everyone else off and an affinity rule to pull the right workload in.

### 11. What is a PodDisruptionBudget and when did one save you (or bite you)?

A PDB limits how many pods a voluntary disruption (node drain, cluster upgrade) can take down at once. The bite-you story interviewers recognise: a PDB of minAvailable equal to the replica count makes every drain hang forever, blocking cluster upgrades. If you have watched a managed-cluster upgrade stall for hours because of an over-strict PDB, tell that story.

### 12. Your cluster autoscaler keeps adding nodes but pods stay Pending. Why might that be?

Because the pending pods have constraints that no *new* node satisfies either: a nodeSelector for a label the node group does not carry, a pod anti-affinity rule that needs more distinct zones than exist, or a PVC bound to a zone-specific volume while the autoscaler adds nodes in another zone. The autoscaler simulates scheduling before scaling, but only against node groups it manages, so mismatched constraints loop forever.

## Senior-level and war-story territory

### 13. A node goes NotReady. What happens to its pods, exactly and in what order?

Nothing immediately. The node controller marks the node NotReady after missing heartbeats (default 40 seconds), then waits the eviction grace (default 5 minutes) before marking pods for deletion. Pods on the dead node cannot confirm termination, so StatefulSet pods stay stuck to guard at-most-one semantics until the node object is deleted or force-deleted. Reciting the two timing windows and the StatefulSet caveat is exactly what "senior" sounds like.

### 14. How would you debug high p99 latency that appeared after moving a service to Kubernetes?

A strong answer names CPU throttling first: check `container_cpu_cfs_throttled_periods_total`. CFS quota enforcement causes multi-millisecond stalls even at low average utilisation, and it is the single most common Kubernetes-specific latency regression. Then DNS (ndots:5 causes multiple lookups per external name), then conntrack exhaustion, then noisy neighbours on oversubscribed nodes.

### 15. How do you run a database on Kubernetes, and should you?

The honest answer wins: prefer a managed database unless you have a reason not to, and if you must run it in-cluster, use a battle-tested operator (CloudNativePG, Strimzi) rather than a hand-rolled StatefulSet. Explain what the operator gives you: automated failover, backup orchestration, and safe rolling upgrades that plain StatefulSets do not provide. Interviewers ask this to test judgement, not YAML.

## Quick-fire round

These get asked as warm-ups or filler. One or two sentences each is the right depth:

16. **What is the difference between a ReplicaSet and a Deployment?** The Deployment manages ReplicaSets to provide rollout and rollback; you almost never create a ReplicaSet directly.
17. **How do rolling updates achieve zero downtime?** New ReplicaSet scales up while the old scales down, gated by maxSurge/maxUnavailable and readiness probes. No readiness probe, no real zero downtime.
18. **What are init containers for?** Sequential setup that must finish before app containers start: waiting for dependencies, running migrations, fixing volume permissions.
19. **ConfigMap vs Secret?** Same mechanism, different intent; Secrets are base64-encoded (not encrypted) and support encryption at rest in etcd plus tighter RBAC.
20. **What is a headless service?** clusterIP: None; DNS returns the pod IPs directly instead of a virtual IP. Needed for StatefulSet stable network identities.
21. **Namespace vs cluster-scoped resources?** Nodes, PersistentVolumes, StorageClasses and CRDs are cluster-scoped; most workloads are namespaced. RBAC can be either (Role vs ClusterRole).
22. **What does kubectl drain do?** Cordons the node, then evicts pods respecting PodDisruptionBudgets. DaemonSet pods are skipped (they would just come back).
23. **How does HPA decide to scale?** Compares observed metric (CPU by default) against target across pods, scales toward the ratio, with a stabilisation window to prevent flapping.
24. **CrashLoopBackOff: what is it and what is the first command?** Container repeatedly exits; back-off delay doubles up to five minutes. First command: `kubectl logs <pod> --previous` to see why the last run died.
25. **What is the Ingress vs Gateway API story in 2026?** Ingress is frozen; Gateway API is the successor with typed routes and role separation. New platforms should default to Gateway API, and interviewers increasingly expect you to know it.

## How to prepare beyond a question list

Reading a list makes questions familiar. It does not make your answers survive follow-ups, and follow-ups are where offers are won. For each topic above, be ready to tell one story from real usage: a probe that caused an outage, a drain that hung, a throttled service. If your experience is thin, build the stories in a homelab: break a cluster deliberately and fix it.

If you want the full 100+ question set with worked answers, production war stories and follow-up chains for Docker and Kubernetes, that is exactly what [Container Orchestration Journey: Docker to Kubernetes](/ebooks/container-orchestration-journey) covers. It is one of the five books in the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
