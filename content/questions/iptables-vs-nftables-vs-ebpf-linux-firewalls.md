---
title: iptables vs nftables vs eBPF - Linux Firewalls
description: How to answer the iptables vs nftables vs eBPF interview question: when each Linux firewall tool fits production use cases.
date: 2026-10-22
keywords: linux, devops interview questions, linux firewall interview questions, iptables vs nftables vs ebpf, linux networking interview
category: linux
youtube: f5NdYMqyZyo
---

Linux firewalling comes up in almost every infra interview because it's a quick way to check if you understand the kernel networking stack beyond just running a command you memorized once. The question sounds simple but the answer separates people who've read a man page from people who've run these tools in production.

## The answer interviewers want

`iptables` is the legacy standard. It's been around forever, most existing infrastructure still runs on it, and in production today `iptables` still dominates despite being the older tool. You can't assume a shop has moved on just because something newer exists.

`nftables` is the modern replacement with better syntax. It's perfect for complex rule sets, since it was designed to fix the awkward, hard-to-read rule chains that `iptables` is known for. If you're building out rich rule logic and maintainability matters, `nftables` is the better fit.

eBPF is a different category entirely. It bypasses the kernel's normal packet-processing path for extreme performance, and it shines in high-throughput scenarios like load balancers, where every microsecond of latency matters. The catch: eBPF has a steep learning curve. It's not a drop-in firewall replacement, it's a programmable layer that takes real investment to use well. That said, it's where the industry is heading for performance-critical applications, so expect it to keep showing up in interviews and in production stacks.

The short version: pick `iptables` if it's already there and working, pick `nftables` when you need cleaner syntax and complex rules, and reach for eBPF when you're optimizing for raw throughput and have the engineering time to invest in it.

## Why interviewers ask this

They want to know if you can match a tool to a constraint instead of defaulting to whatever you learned first. Picking eBPF for a simple rule set or sticking with `iptables` out of habit when nftables would be cleaner are both signs of shallow experience. This question also tests whether you know what's actually running in most real production environments versus what's trendy on conference slides.

## Follow-ups to expect

**Why hasn't iptables been fully replaced yet?** Because it's deeply embedded in existing tooling and infrastructure, and migrating stable rule sets carries real risk for marginal gain.

**When would you NOT reach for eBPF?** When the use case isn't high-throughput or latency-sensitive, since the learning curve and complexity aren't worth it for ordinary rule management.

**How do nftables and iptables relate under the hood?** Both operate in the same general space of packet filtering, but nftables was built to replace iptables with better syntax and more maintainable complex rules.

## The common wrong answer

Candidates usually pick a favorite and defend it as universally superior, often pushing eBPF as the answer to everything because it sounds advanced. That misses the point: the right choice depends on what's already in production, how complex the rules are, and whether raw throughput is actually the bottleneck. A senior answer acknowledges all three have a place rather than crowning one winner.
