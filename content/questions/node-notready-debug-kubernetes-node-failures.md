---
title: Node NotReady - Debug Kubernetes Node Failures
description: Learn how to debug a NotReady Kubernetes node step by step, including the disk pressure root cause interviewers expect you to name.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes interview questions, kubernetes node notready debug, k8s node troubleshooting interview
category: kubernetes
youtube: El6jy2FbeyQ
---

A node flips to NotReady in production and everyone looks at you to explain why. This comes up constantly in Kubernetes interviews because it is a fast way to see whether you actually troubleshoot methodically or just panic and start restarting things.

## The answer interviewers want

Start with `kubectl get nodes` to confirm the status, then `kubectl describe node <name>` to see the reported conditions. NotReady means the kubelet on that node has stopped reporting healthy status to the control plane. It is not necessarily the node that is down, it is the heartbeat that stopped.

From there, go straight to the kubelet logs, either through `journalctl -u kubelet` on the node or through your logging pipeline if you cannot SSH in. You are looking for three usual suspects: disk pressure, memory issues, or container runtime failures (things like the container runtime not responding, or crashing).

Here is the part that separates a canned answer from a real one: most NotReady incidents are not exotic hardware failures or networking blips. They are disk pressure, usually because log files filled up the root partition. The kubelet watches disk usage, and once it crosses the eviction threshold it marks the node under `DiskPressure` and eventually stops reporting Ready. So after checking conditions and logs, check disk usage on the node directly before you assume something more complicated is going on.

## Why interviewers ask this

They are not testing whether you memorized the word `NotReady`. They are testing whether you have an actual debugging sequence: conditions first, logs second, resource exhaustion third, instead of guessing or immediately cordoning and replacing the node. Naming disk pressure as the most common cause signals you have actually operated clusters, not just read the docs.

## Follow-ups to expect

**How would you confirm it's disk pressure before digging further?** Check the node conditions for a `DiskPressure` flag in `kubectl describe node`, and confirm directly with `df -h` on the node if you have access.

**How do you prevent this from recurring?** Put log rotation in place, keep container and kubelet logs off the root partition where possible, and ship logs out to aggregation quickly so they do not pile up locally.

**What other conditions besides DiskPressure would you look for?** MemoryPressure and PIDPressure cover resource exhaustion, and NetworkUnavailable points you toward a networking problem instead of a resource one.

## The common wrong answer

Candidates often jump straight to "I'd restart the kubelet" or "I'd cordon and drain the node and move on," skipping the diagnostic step entirely. That answer might resolve the symptom temporarily, but it tells the interviewer you treat NotReady as something to clear rather than something to understand, and you'll likely see the same node go NotReady again a few hours later for the same unaddressed reason.
