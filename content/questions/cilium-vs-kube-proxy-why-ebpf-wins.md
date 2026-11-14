---
title: Cilium vs kube-proxy - Why eBPF Wins
description: Why Cilium's eBPF dataplane replaces kube-proxy at scale: iptables O(n) rule matching vs O(1) hash lookups, explained.
date: 2026-10-22
keywords: networking, devops interview questions, cilium vs kube-proxy, cilium ebpf kubernetes, replace kube-proxy with cilium, kubernetes networking interview questions
category: networking
youtube: -PQ4aGzvZxw
---

A senior engineer gets asked why anyone would bother replacing kube-proxy with Cilium, and this question separates people who read a changelog from people who've actually thought about what happens at scale.

## The answer interviewers want

kube-proxy is fine at scale - that's actually a myth worth unpacking first, at least for its default `iptables` mode (the `nftables` mode, GA since Kubernetes 1.33, uses map lookups instead). In `iptables` mode, rule matching is O(n): every new connection walks the service rules linearly until it hits a match, and every service change rewrites the rule set. That's fine with 50 services. At 5000 it starts to hurt.

Cilium replaces that with eBPF, which runs kernel-level hash lookups - effectively O(1) regardless of how many services you have. At 5000 services, the gap between linear rule matching and a hash lookup is brutal, and that's the actual problem, not "eBPF is newer."

In production you deploy this in kube-proxy-free mode: set `kubeProxyReplacement: true` in your Cilium Helm values (it was `strict` before Cilium 1.14), set `k8sServiceHost` to the API server, and don't run kube-proxy. Cilium then owns all service routing.

The part most candidates miss: you also get Hubble for free. Hubble gives you per-flow network observability with zero application changes, because it reads events from the same eBPF datapath that's doing the routing. Per-request HTTP detail needs Cilium's L7 proxy enabled for that traffic. kube-proxy gives you nothing in that department. So the honest test for whether someone understands this: ask them how kube-proxy's `iptables` mode handles 5000 services, and watch them realize it doesn't handle it gracefully at all.

## Why interviewers ask this

This question filters for people who understand the underlying mechanism versus people who've memorized that "eBPF is the new hotness." An interviewer wants to hear the algorithmic complexity argument (O(n) vs O(1)), not a buzzword. It also signals whether you've actually run something at a scale where `iptables` rule count becomes a bottleneck, since most tutorial-scale clusters never surface this problem.

## Follow-ups to expect

- **What exactly does `kubeProxyReplacement: true` do under the hood?** It tells Cilium to take over all service routing via eBPF programs attached to the kernel, so kube-proxy's `iptables` chains are no longer part of the packet path at all.
- **What do you get beyond performance?** Hubble, which provides per-flow network observability without any application instrumentation, since it taps into the same eBPF layer handling routing (HTTP-level detail needs the L7 proxy).
- **At what point does the `iptables` approach actually start hurting?** The answer isn't a fixed number you should memorize, but the mechanism is clear: as service count grows, linear rule matching scales worse than hash lookups, and the gap compounds with every added service.

## The common wrong answer

Most candidates reach straight for "eBPF is faster" or "it's more modern" without explaining why. That answer sounds confident but says nothing about the actual mechanism. It also tends to skip the Hubble observability angle entirely, which is the part that makes Cilium a genuine upgrade rather than just a performance tweak - and skipping it is usually the tell that someone hasn't operated this in production.
