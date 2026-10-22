---
title: Kubernetes DNS Not Resolving - Troubleshoot CoreDNS
description: How to troubleshoot CoreDNS and Kubernetes DNS resolution failures, a common DevOps and SRE interview scenario with real debugging steps.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes dns troubleshooting, coredns not working kubernetes, kubernetes dns resolution failed, kubectl debug coredns interview
category: kubernetes
youtube: eCL8QeFwx28
---

Pods that were talking fine yesterday suddenly can't resolve service names today, and nothing else in the cluster has changed. This is one of the most common Kubernetes troubleshooting questions in interviews because it tests whether you have a real debugging sequence, not just a memorized fix.

## The answer interviewers want

Start with the basics: check whether the `CoreDNS` pods are actually running, usually with `kubectl get pods -n kube-system` and a filter for the `coredns` label. Most DNS issues in Kubernetes come down to CoreDNS being down or misconfigured, so this is the first thing to rule out before you go any deeper.

If CoreDNS pods are healthy, the next step is verifying the cluster DNS settings and confirming that pods can actually reach the DNS service IP. That means checking the `kube-dns` (or `coredns`) Service and making sure pods are pointed at the right resolver in their `/etc/resolv.conf`-equivalent config.

Here's the part that trips people up: network policies. Check whether a `NetworkPolicy` is blocking traffic on port `53`, both TCP and UDP. This is a subtle failure mode because the DNS service itself can look perfectly healthy while policy rules silently drop the traffic that would reach it. This kind of misconfiguration can break DNS resolution cluster-wide, not just for one namespace or one app, which is why it's worth checking early rather than last.

## Why interviewers ask this

This question isn't really about DNS trivia. It's about whether you troubleshoot top-down and systematically, starting with the most likely cause (CoreDNS down) before moving to less obvious ones (network policy blocking port 53). Interviewers are watching for a logical elimination process, since that's exactly what you need at 3AM when a cluster-wide outage looks like a dozen unrelated symptoms.

## Follow-ups to expect

**"What if CoreDNS is running but pods still can't resolve names?"** Move on to checking cluster DNS settings and confirming pods can actually reach the DNS service IP, since a healthy CoreDNS pod doesn't guarantee the service in front of it is reachable.

**"How would a network policy break DNS for an entire cluster?"** If a policy blocks port 53 traffic broadly rather than scoping it to specific pods or namespaces, it can cut off DNS for every workload that depends on it, which is why port 53 rules deserve extra scrutiny during any policy review.

**"Where do you look first when DNS fails?"** CoreDNS pod health first, since that's the most common root cause, then DNS service reachability, then network policies on port 53.

## The common wrong answer

Candidates often jump straight to exotic explanations, talking about pod network CNI bugs or kubelet issues, without first confirming the obvious: is CoreDNS even running. Interviewers notice when someone skips the cheap, high-probability checks in favor of sounding sophisticated. The strongest answers work outward from CoreDNS health, to DNS service reachability, to network policy rules on port 53, in that order.
