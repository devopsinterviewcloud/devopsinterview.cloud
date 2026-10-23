---
title: DaemonSets Explained - One Pod Per Node
description: DaemonSet interview question explained: what it is, when to use it for node agents, and the node taint gotcha interviewers probe for.
date: 2026-10-22
keywords: kubernetes, devops interview questions, daemonsets kubernetes explained, kubernetes daemonset interview questions, kubernetes one pod per node, k8s daemonset vs deployment
category: kubernetes
---

A monitoring agent that needs to live on every node is a classic Kubernetes interview setup. Deployments can't guarantee per-node scheduling, so interviewers use this gap to check whether you actually understand DaemonSets or just know the name.

## The answer interviewers want

A DaemonSet ensures exactly one pod runs on every node in your cluster. Think of it like installing software on every server, except Kubernetes handles the rollout and lifecycle automatically instead of you SSHing in one box at a time.

This is the right tool for system-level services that need to be present on each host: log collectors like Fluentd, monitoring agents like Node Exporter, or network plugins that need host-level access. If a Deployment would scatter replicas based on scheduler decisions and resource availability, a DaemonSet pins one copy per node regardless.

Here's the part that trips people up: DaemonSets ignore node taints by default. That means a DaemonSet pod will happily run on master/control-plane nodes even though those nodes are tainted to keep normal workloads off them. If you don't want your agent on master nodes, you have to explicitly handle that - otherwise it schedules there anyway, since DaemonSets bypass the usual taint-based exclusion unless tolerations are configured to say otherwise.

## Why interviewers ask this

This question separates people who've memorized "DaemonSet runs one pod per node" from people who've actually operated one in a cluster with mixed node roles. The taint behavior is the detail that only shows up once you've been bitten by an agent accidentally running somewhere it shouldn't, like a master node. Interviewers use it to check whether you understand scheduling behavior beyond the one-line definition.

## Follow-ups to expect

**How do you keep a DaemonSet off specific nodes?** Use node taints on those nodes, and simply don't add a matching toleration to the DaemonSet - without a toleration, the pod won't schedule there. You can also use node selectors or affinity rules to scope it further.

**Why not just use a Deployment with high replica count instead?** A Deployment's replica count isn't tied to node count, so it can't guarantee coverage as nodes are added or removed. A DaemonSet automatically adds a pod when a new node joins and removes it when a node leaves.

**What's a real example of a DaemonSet workload?** Log collectors like Fluentd, monitoring agents like Node Exporter, and network plugins needing host access are the standard examples, since all three need presence on every node, not just some of them.

## The common wrong answer

Most candidates can recite "DaemonSet equals one pod per node" but stop there. They miss the taint behavior entirely and assume DaemonSets respect the same node-exclusion rules as everything else, which leads to confusion later when someone asks why a monitoring agent is running on a master node nobody expected it on.
