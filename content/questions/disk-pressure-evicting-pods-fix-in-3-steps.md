---
title: Disk Pressure Evicting Pods - Fix in 3 Steps
description: DiskPressure evicting pods? A 3-step fix: confirm the condition, find the disk hog, set GC and log rotation thresholds.
date: 2026-10-22
keywords: scenario, devops interview questions, disk pressure evicting pods, kubernetes disk pressure fix, pod eviction troubleshooting, kubernetes interview questions
category: scenario
youtube: Az_MXttrbys
---

A node hits DiskPressure, kubelet starts evicting pods with no obvious cause in your app logs, and the on-call engineer burns an hour chasing the wrong signal. This comes up in interviews because it tests whether you actually understand kubelet's node-pressure eviction mechanism or just know how to restart pods and hope.

## The answer interviewers want

Three steps, in order.

**Step one: confirm the condition.** Run `kubectl describe node <node>` and check the Conditions section for `DiskPressure=True`. Don't assume - verify it's actually disk and not memory or PID pressure, since the symptoms look similar from the pod's side.

**Step two: find the hog.** SSH onto the node and run `du -sh` against `/var/lib/containerd`. It's almost always one of two things: accumulated container images or unbounded log files. You're looking for what's actually eating the disk, not guessing.

**Step three: fix the root cause, not the symptom.** Set image garbage collection thresholds so kubelet cleans up unused images before disk fills up, and set log rotation so logs don't grow unbounded. This means kubelet reclaims space proactively instead of waiting until it has to start killing pods to free space.

One detail that trips people up: eviction order isn't random. Kubelet evicts pods that are over their resource requests first. If your logging is unbounded, that's very often what pushes a node into DiskPressure before anything else even gets close to its limits.

## Why interviewers ask this

This question separates people who've only read about eviction from people who've actually diagnosed it. It checks whether you know the diagnostic path (condition, then cause, then fix) instead of jumping straight to "restart the node," and whether you understand that eviction targets pods based on resource request accounting, not randomly.

## Follow-ups to expect

- **Why does kubelet evict pods instead of just failing?** Because kubelet is protecting the node itself - if disk fills completely, the kubelet and container runtime can't function, so it sacrifices pods to keep the node alive.
- **What's the difference between soft and hard eviction thresholds?** The source doesn't give specifics here, but expect this as a natural next question - be ready to explain that kubelet supports configurable thresholds with grace periods versus immediate eviction.
- **How do you prevent this from recurring?** Garbage collection thresholds and log rotation are the proactive fix described above - they stop the disk from filling in the first place instead of reacting after eviction starts.

## The common wrong answer

Most candidates jump straight to "cordon the node" or "restart kubelet" without checking what's actually consuming disk. That treats the symptom and leaves the node to hit DiskPressure again within hours, because nobody found the log file or image cache that caused it. A good answer always starts with confirming the condition and finding the actual hog before touching any remediation.
