---
title: Memory Leak in Prod - Debug in 5 Steps
description: How to debug a Kubernetes pod stuck in an OOMKilled loop: the five-step process senior candidates are expected to walk through.
date: 2026-10-22
keywords: scenario, devops interview questions, memory leak kubernetes, kubernetes memory leak debug, debug memory leak production
category: scenario
youtube: xlZ5a-ShLFc
---

A pod keeps getting OOMKilled and restarting doesn't fix it. This scenario shows up constantly in senior DevOps and SRE interviews because it tests whether you actually debug memory problems or just restart things and hope.

## The answer interviewers want

Work through this in order, and don't skip step one.

**1. Confirm it's actually a leak.** Run `kubectl top pods` over time. You're looking for memory that climbs steadily, not just spikes under load. A spike that gets reclaimed is normal behavior, not a leak.

**2. Check limits vs requests.** Misconfigured memory limits are a very common cause of false OOMKills. If the limit is set too low for the workload's normal footprint, you'll get killed even with zero leak. Rule this out before you do anything else - most OOMKills aren't leaks at all, they're just limits set too low. Skip this check and you'll burn an hour chasing a leak that doesn't exist.

**3. Grab a heap dump.** If it's a Go service, use `pprof` to capture a heap profile. For other languages, grab the equivalent (JVM heap dump, Node `--inspect` snapshot, etc.) so you can see what's actually holding memory.

**4. Look for goroutine or connection leaks.** Unclosed connections, leaked goroutines, or client objects that never get released are classic root causes. The heap dump or profile should point you at what's accumulating.

**5. Reproduce under load in staging.** Confirm the growth pattern outside prod before you ship a fix, so you can verify the fix actually closes the leak instead of just changing the symptom.

## Why interviewers ask this

They want to see a methodical process, not a guess. OOMKilled is one of the most common prod pages a DevOps or SRE engineer gets, so this question checks whether you reach for `kubectl top`, requests/limits, and profiling tools in a sane order, or whether you just bump the memory limit and move on. It also tests whether you know that restarting a pod is a mitigation, not a fix.

## Follow-ups to expect

**What's the difference between a request and a limit, and how does it relate to OOMKills?** The request is what's guaranteed for scheduling, the limit is the hard cap that triggers an OOMKill if exceeded; a limit set too low causes kills even on a healthy app.

**How would you find a leak without being able to attach a profiler in prod?** Pull a heap dump during a load test in staging where you can safely attach tooling, then correlate the growth pattern with prod's `kubectl top` data.

**What's a common root cause behind goroutine leaks specifically?** Goroutines blocked waiting on a channel or connection that never closes, often from a missing timeout or context cancellation.

## The common wrong answer

Most candidates jump straight to "grab a heap dump and find the leak," skipping the cheaper check of requests vs limits. That's backwards: a huge share of OOMKills are just underprovisioned limits, not actual leaks, and senior engineers rule out the cheap explanation before reaching for profiling tools.
