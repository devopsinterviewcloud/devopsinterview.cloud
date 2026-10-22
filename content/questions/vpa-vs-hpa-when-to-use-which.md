---
title: VPA vs HPA - When to Use Which?
description: VPA vs HPA interview question explained: when to use each, how they differ, and why VPA restarts pods while HPA doesn't.
date: 2026-10-22
keywords: kubernetes, devops interview questions, vpa vs hpa kubernetes, kubernetes autoscaling interview questions, vertical pod autoscaler vs horizontal, kubernetes interview questions experienced
category: kubernetes
youtube: 6FXU0u6rgvo
---

Pods either starve for CPU and memory or sit there wasting money on resources nobody's using. This question shows up constantly in Kubernetes interviews because most candidates can recite what VPA and HPA do but can't explain when to reach for each one, or what it actually costs you in practice.

## The answer interviewers want

`HPA` (Horizontal Pod Autoscaler) scales pods horizontally when CPU or memory hits a defined threshold. It adds or removes replicas of the same pod spec.

`VPA` (Vertical Pod Autoscaler) adjusts the resource `requests` and `limits` on existing pods, it doesn't change the replica count.

Use `HPA` for stateless apps that can handle running as multiple replicas behind a service. Use `VPA` for legacy apps that can't scale horizontally, or workloads with unpredictable resource needs where you don't know the right `requests`/`limits` up front.

Here's the part people skip over: `VPA` restarts pods to apply new resource values. That's downtime, even if it's brief. `HPA`, by contrast, just spins up new pods alongside the existing ones, so there's no disruption to what's already running.

## Why interviewers ask this

They're checking whether you understand the mechanism, not just the acronym. Anyone can say "HPA scales pods, VPA scales resources." The real signal is whether you know the operational tradeoff: VPA's restart behavior makes it a poor fit for anything latency-sensitive or stateful without careful rollout planning. This also tells them if you've actually run these in production versus just read the docs.

## Follow-ups to expect

**Can you run VPA and HPA on the same workload?** This is a common trap question. If both are configured to react to CPU or memory, they can fight each other, VPA changing requests while HPA is making scaling decisions based on those same metrics. The safer pattern is to use VPA in recommendation-only mode alongside HPA, or split the metrics they act on.

**What happens to an app during a VPA-triggered restart if it's a single replica?** Since VPA restarts pods to apply new resource limits, a single-replica app takes a full outage during that restart. This is exactly why VPA is a better fit for workloads that can tolerate a restart, not for anything requiring continuous availability without redundancy.

**Why wouldn't you just always use HPA?** Because HPA assumes your app can run as multiple replicas safely. Legacy apps with in-memory state, singleton processes, or licensing tied to a single instance can't do that, so scaling resources vertically is the only option.

## The common wrong answer

Most candidates give a textbook definition, HPA adds pods, VPA adjusts resources, and stop there. They miss the operational cost: VPA causes pod restarts and real downtime, while HPA doesn't touch running pods at all. Without naming that tradeoff, the answer sounds memorized rather than understood, and it misses the follow-up about why running both together can cause conflicts.
