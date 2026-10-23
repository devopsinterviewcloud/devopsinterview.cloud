---
title: Pod Priority and Preemption - Who Gets Evicted?
description: How Kubernetes picks which pods to evict under resource pressure, using PriorityClasses and preemption, explained for interviews.
date: 2026-10-22
keywords: kubernetes, devops interview questions, pod priority preemption kubernetes, kubernetes interview questions experienced, pod eviction kubernetes explained
category: kubernetes
youtube: WQ60WDzS_kE
---

A node fills up, the scheduler needs room for a new pod, and suddenly one of your "important" pods is gone. This comes up constantly in Kubernetes interviews because it tests whether you understand scheduling pressure, not just YAML syntax.

## The answer interviewers want

Kubernetes decides what to evict using PriorityClasses. Think of it like airline boarding: higher priority pods get to board (schedule) first, and if there's no room, lower priority pods already seated can get bumped to make space.

In practice, you define a `PriorityClass` object with a numeric value, then reference it in your deployment spec via `priorityClassName`. When the scheduler can't place a new pod because the node is full, it looks for lower priority pods it can preempt (evict) to free up enough resources, then schedules the higher priority pod in that space.

The part that catches people out: preemption can cause cascading failures if you're not careful with resource requests. If your requests don't accurately reflect what a pod actually needs, evicting a "lower priority" pod to fit a higher priority one can trigger a chain reaction, that evicted pod's replacement then competes for resources elsewhere, which can bump something else, and so on. Priority and preemption solve one problem (make sure critical workloads get scheduled) but only if your resource requests are honest.

## Why interviewers ask this

This question separates people who've memorized the term "PriorityClass" from people who've actually dealt with a noisy cluster. Interviewers want to see that you understand preemption is a scheduling mechanism with real side effects, not a free safety net. They're also checking whether you connect priority classes to resource requests, because the two are tightly coupled in practice.

## Follow-ups to expect

**What happens if two pods have the same priority class?** The source doesn't go into tie-breaking detail, but the expectation is that you'd explain priority only matters when the scheduler has to choose between pods of different priority during contention, same-priority pods aren't preempted against each other.

**How do you prevent a critical pod from ever being evicted?** You'd want to talk about setting an appropriately high priority class and making sure its resource requests match actual usage, since under-requesting is what triggers the cascading failure scenario described above.

**Why would preemption cause cascading failures specifically?** Because evicting a lower priority pod to free resources doesn't remove demand from the cluster, it just displaces it, and if requests across the cluster are inaccurate, that displaced pod's rescheduling can trigger further evictions elsewhere.

## The common wrong answer

Most candidates stop at "higher priority pods preempt lower priority ones" and treat that as the full answer. That's technically true but incomplete, it skips the fact that priority is only half the story. Without correct resource requests backing it up, priority classes don't just protect critical workloads, they can actively destabilize a cluster by setting off a chain of evictions that nobody accounted for.
