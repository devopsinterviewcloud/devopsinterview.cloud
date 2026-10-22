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

kube-proxy is fine at scale - that's actually a myth worth unpacking first. The real issue is how kube-proxy implements service routing: it uses `iptables`, and `iptables` rule matching is O(n). Every packet has to check every rule linearly. That's fine with 50 services. It is not fine with 5000.

Cilium replaces that with eBPF, which runs kernel-level hash lookups - effectively O(1) regardless of how many services you have. At 5000 services, the gap between linear rule matching and a hash lookup is brutal, and that's the actual problem, not "eBPF is newer."

In production you deploy this in kube-proxy-free mode: set `kubeProxyReplacement: strict` in your Cilium Helm values. That's it. Cilium owns all service routing and kube-proxy is removed from the data path entirely.

The part most candidates miss: you also get Hubble for free. Hubble gives you per-request network observability with zero application changes, because it's reading the same eBPF programs that are already doing the routing. kube-proxy gives you nothing in that department. So the honest test for whether someone understands this: ask them how kube-proxy handles 5000 services, and watch them realize it doesn't handle it gracefully at all.

## Why interviewers ask this

This question filters for people who understand the underlying mechanism versus people who've memorized that "eBPF is the new hotness." An interviewer wants to hear the algorithmic complexity argument (O(n) vs O(1)), not a buzzword. It also signals whether you've actually run something at a scale where `iptables` rule count becomes a bottleneck, since most tutorial-scale clusters never surface this problem.

## Follow-ups to expect

- **What exactly does `kubeProxyReplacement: strict` do under the hood?** It tells Cilium to take over all service routing via eBPF programs attached to the kernel, so kube-proxy's `iptables` chains are no longer part of the packet path at all.
- **What do you get beyond performance?** Hubble, which provides per-request network observability without any application instrumentation, since it taps into the same eBPF layer handling routing.
- **At what point does the `iptables` approach actually start hurting?** The answer isn't a fixed number you should memorize, but the mechanism is clear: as service count grows, linear rule matching scales worse than hash lookups, and the gap compounds with every added service.

## The common wrong answer

Most candidates reach straight for "eBPF is faster" or "it's more modern" without explaining why. That answer sounds confident but says nothing about the actual mechanism. It also tends to skip the Hubble observability angle entirely, which is the part that makes Cilium a genuine upgrade rather than just a performance tweak - and skipping it is usually the tell that someone hasn't operated this in production.
