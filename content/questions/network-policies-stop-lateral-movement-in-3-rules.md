---
title: Network Policies - Stop Lateral Movement in 3 Rules
description: How Kubernetes network policies stop lateral movement after a pod breach, using default-deny rules and CNI enforcement.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes network policies, kubernetes network policies setup, kubernetes security interview questions, network policies lateral movement
category: kubernetes
---

A single compromised pod shouldn't be a free pass to the rest of your cluster, but by default it is. Every pod can talk to every other pod unless you say otherwise. This question comes up in interviews because it separates people who know Kubernetes networking exists from people who've actually locked a cluster down.

## The answer interviewers want

By default, pods can talk to everything in the cluster. There's no isolation unless you build it. Network policies are the mechanism for that isolation: think of them as firewall rules for pods. They use labels and selectors to define which pods are allowed to talk to which other pods, and over which ports.

The pattern to describe is simple: start with a default deny-all policy for a namespace, blocking all ingress and egress traffic. Then explicitly allow only the specific traffic you need, service by service. For example, allow the frontend to call the backend API on its port, and nothing else. This way, if an attacker breaches one pod, they can't just pivot sideways through the cluster to everything else, because there's nothing open for them to pivot through.

The catch that trips people up: most CNIs don't enforce network policies by default. You can write a perfectly correct `NetworkPolicy` manifest and have it do absolutely nothing. Calico and Cilium enforce them. Standard `kubenet` does not. So part of a correct answer is checking what CNI the cluster actually runs before assuming network policies are doing any work at all.

## Why interviewers ask this

They're checking whether you think about Kubernetes security as a layered problem instead of assuming RBAC or pod security policies cover everything. Lateral movement is one of the most common real-world attack patterns, so they want to know you'd actually contain a breach, not just detect it after the fact. The CNI detail also tests whether you've been burned by assuming a feature works just because the YAML applied cleanly.

## Follow-ups to expect

- **How would you verify a network policy is actually being enforced?** Check which CNI the cluster runs; `kubenet` won't enforce anything, so you'd need to confirm Calico, Cilium, or another policy-aware CNI is in place and test with a denied connection to see it actually fail.
- **What's your rollout strategy for default-deny in an existing cluster?** Start with deny-all in a non-critical namespace first, then add explicit allow rules for each known service-to-service path before expanding cluster-wide, since applying deny-all blind in production will break things.
- **How do network policies interact with namespaces?** Policies are scoped per namespace and selectors can target pods across namespace boundaries using namespace labels, so isolation has to be designed at both the pod and namespace level.

## The common wrong answer

Candidates often describe network policies correctly in the abstract, labels, selectors, allow rules, but never mention that the CNI has to actually enforce them. They write a deny-all manifest, assume it's protecting the cluster, and move on. That's the gap: a policy that exists in etcd but isn't enforced by the underlying CNI gives you a false sense of security, which is arguably worse than having no policy at all.
