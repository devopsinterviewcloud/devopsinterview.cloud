---
title: Capacity Planning for Cloud - Don't Guess, Measure
description: How to answer SRE interview questions on cloud capacity planning for unpredictable traffic: baselines, metrics, and auto-scaling thresholds.
date: 2026-10-22
keywords: sre, devops interview questions, capacity planning cloud, cloud capacity planning interview questions, sre capacity planning interview, cloud resource optimization
category: sre
---

Capacity planning questions show up constantly in SRE and platform interviews because they separate engineers who react to dashboards from engineers who actually understand their system's behavior over time. This one is usually framed around a service with spiky, unpredictable traffic, and the interviewer wants to see your process, not a magic number.

## The answer interviewers want

Capacity planning comes down to three things: understanding your baseline, identifying patterns in how load changes, and setting scaling thresholds based on real metrics instead of guesses.

In practice, that means monitoring CPU, memory, and request latency over a period of weeks, not days, so you actually see the shape of your traffic including the weird edge cases. Once you have that data, you configure auto-scaling rules with proper headroom built in, so the system isn't scrambling to add capacity the moment load ticks up.

A good rule of thumb: plan for roughly double your expected peak on the upside, so you've got margin when traffic surprises you. But don't just over-provision and walk away. Scale down aggressively during low-traffic periods. The expensive mistake most teams make isn't under-provisioning, it's leaving that extra capacity running 24/7 out of caution, which is a huge source of wasted cloud spend.

So the full answer has two halves: measure first, then build in asymmetric scaling. Generous headroom going up, aggressive scale-down coming back.

## Why interviewers ask this

They're checking whether you treat capacity as a data problem or a gut-feeling problem. Anyone can say "add more servers," but interviewers want to hear that you'd baseline real metrics over time before setting thresholds, and that you understand cost is part of the engineering tradeoff, not just an afterthought for finance.

They're also listening for whether you think about both directions of scaling. Candidates who only talk about handling peak traffic are missing half the problem: capacity planning that never scales back down is just budget waste with extra steps.

## Follow-ups to expect

**How would you set the actual scaling thresholds, not just the headroom multiplier?** You'd derive them from the CPU, memory, and latency data collected over weeks, looking for the point where latency starts degrading before CPU maxes out, and set the trigger ahead of that point.

**What's the risk of scaling down too aggressively?** If scale-down is too fast or too eager, you risk flapping, where the system scales down right before a traffic burst and then scrambles to catch up, so the aggressive scale-down still needs guardrails informed by your observed patterns.

**Why plan for double the peak instead of just matching projected peak?** Real traffic doesn't follow the forecast exactly, and unpredictable spikes are the whole premise of the question, so the extra headroom is insurance against being wrong about what "peak" actually is.

## The common wrong answer

The typical weak answer is "just set up auto-scaling" with no mention of baselining or metrics, as if auto-scaling rules write themselves. The other common miss is talking only about handling spikes and saying nothing about scaling back down, which is exactly the half of the answer that explains where most of that wasted cloud budget actually comes from.
