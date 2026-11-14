---
title: Container OOMKilled - Why and How to Fix
description: Learn how to debug a container that keeps getting OOMKilled, using kubectl top and describe, plus request/limit sizing tips for interviews.
date: 2026-10-22
keywords: scenario, devops interview questions, oomkilled container fix, kubernetes oomkilled debugging, container memory issues interview, pod oomkilled troubleshooting
category: scenario
youtube: 78MwCFn0lE8
---

A pod keeps restarting with no clear error in your logs, just a status flag you don't recognize. Interviewers ask about OOMKilled containers because it tests whether you actually understand Kubernetes resource management or just set numbers and hope.

## The answer interviewers want

OOMKilled means Out Of Memory Killed. The kernel's OOM killer terminated your container, usually because it went over its memory limit, though a node running out of memory overall can do it too. This is a kernel-level kill, not an application crash, so your app's own error handling never gets a chance to run.

To debug it, start with current usage: `kubectl top pod <name> --containers`. This shows what each container is using right now, though it's a sampled number and can miss the spike that caused the kill. Then run `kubectl describe pod <name>` to look at the last termination reason, which will confirm whether OOMKilled is what actually happened and give you the exit code and timing.

Once you've confirmed the cause, the fix is in how you size requests and limits. Set memory requests close to the container's real usage under normal load, and set limits with headroom above the peaks you've seen in your metrics, not a single reading from `kubectl top`. Requests set too low mean the scheduler under-provisions the node and you get contention. Requests set too high waste capacity you're paying for. Limits set too low mean you get killed for normal operation; limits set too high mean a single pod can starve its neighbors before the kernel steps in. Sizing requests near real usage and limits with headroom above it is what prevents both starvation and waste.

## Why interviewers ask this

This question separates people who've only read about requests and limits from people who've actually tuned them against real usage data. It also checks whether you know the difference between a kernel-level kill and an application-level crash, since the debugging path and the fix are different for each.

## Follow-ups to expect

**What's the difference between a request and a limit?** A request is what the scheduler guarantees and uses for bin-packing onto nodes. A limit is the hard ceiling the kernel enforces, and crossing it on memory is what triggers an OOMKill.

**How do you tell an OOMKill apart from an app crash?** Check `kubectl describe pod` for the termination reason and exit code; an OOMKilled reason confirms the kernel killed it, whereas an app crash would show a different exit code and usually leaves logs explaining why.

**What if you don't know the actual usage pattern yet?** Use `kubectl top pod` over time, or historical metrics if you have them, before picking request and limit values, rather than guessing a number and hoping.

## The common wrong answer

Most candidates jump straight to "just raise the memory limit" without ever running `kubectl top pod` or checking the termination reason first. That treats the symptom, not the cause, and it often just delays the next OOMKill instead of preventing it. A good answer always starts with confirming the cause before touching any numbers.
