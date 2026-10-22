---
title: Packet Loss in Prod - 4 Steps to Find the Drop
description: A 4-step framework for diagnosing packet loss in production: ping, mtr, NIC stats, and tcpdump, with the NIC-buffer trap.
date: 2026-10-22
keywords: networking, devops interview questions, packet loss troubleshooting, packet loss interview question, network troubleshooting devops
category: networking
---

Packet loss in production feels random to most engineers, which is exactly why interviewers use it. It's a quick way to separate people who have a systematic debugging process from people who guess and reboot things until the graphs look better.

## The answer interviewers want

There are four steps, and the order matters because each one narrows down where the loss is actually happening.

**1. Confirm the loss exists.** Run `ping` against the affected host. This sounds trivial, but you need a baseline before you chase anything. If `ping` shows clean, consistent loss (not just one dropped packet), you know you're dealing with a real problem and not a one-off blip.

**2. Localize it with `mtr`.** `mtr` combines traceroute and ping, and it shows loss hop by hop. Run it long enough to get a stable sample, and look for the hop where loss starts. That tells you whether it's your host, your local network, or somewhere upstream like a provider's router.

**3. Check NIC stats.** Use `ethtool -S <interface>` or `ip -s link show <interface>` to look at hardware-level counters. This step catches drops that never show up in `mtr` at all, because they happen on the host itself, not in the network path.

**4. Use `tcpdump` to catch retransmits at the app layer.** This confirms what the TCP stack is actually seeing: retransmissions, out-of-order packets, resets. It ties the network-level symptoms back to what your application experiences.

The part most people miss: NIC buffer drops and actual network drops look identical from the application's point of view. Both show up as lost packets and retries. But if `ethtool` shows `RX missed` or `rx_missed_errors` incrementing, that's your host being overwhelmed, not the network failing. The fix for that is completely different from the fix for a flaky link or a congested router. You need to know which one you're looking at before you touch anything.

## Why interviewers ask this

They're checking whether you have an actual methodology for an ambiguous, multi-layer problem, or whether you jump straight to restarting services. Packet loss touches hardware, OS, network, and application layers, so this question also tests whether you understand where each tool operates and what it can and can't tell you.

## Follow-ups to expect

**If `ethtool` shows RX missed, what's the actual fix?** That points to the host being overwhelmed, not a network issue, so you're looking at things like NIC ring buffer sizing, interrupt distribution, or CPU contention on the box, not routing or upstream carriers.

**What if `mtr` shows loss on an intermediate hop you don't control?** You've localized the problem to a point outside your infrastructure, so the next step is engaging that provider or network team with the `mtr` data as evidence, not trying to fix it yourself.

**Why run `tcpdump` last instead of first?** The earlier steps tell you where to point `tcpdump`; running it blind on a busy production host without knowing where the loss is generates a lot of noise to sift through.

## The common wrong answer

Most candidates either say "check the logs" with no specifics, or jump straight to `tcpdump` without first confirming loss exists or localizing it. The real failure mode interviewers are listening for is treating every drop as a network problem by default, which misses the host-level NIC drops that need a completely different fix.
