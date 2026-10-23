---
title: RED vs USE Method - Which Metrics to Track
description: RED vs USE monitoring frameworks explained: when to use each, how they complement each other, and how interviewers test this.
date: 2026-10-22
keywords: observability, devops interview questions, RED vs USE method, RED method metrics, USE method monitoring, observability interview questions
category: observability
youtube: lGvSj2XNVe0
---

A platform team asks you to set up dashboards for a new service, and you have to decide what to actually measure. This question shows up constantly because it's a quick way to check if a candidate understands the difference between monitoring a service and monitoring the infrastructure underneath it.

## The answer interviewers want

RED and USE are two complementary metrics frameworks, not competing ones.

**RED** is for services: Rate, Errors, Duration. That means requests per second, error rate, and latency. It tells you how your application is performing from the outside.

**USE** is for resources: Utilization, Saturation, Errors. That means CPU, disk, and network saturation on the box (or container, or VM) underneath the service. It tells you how the infrastructure is holding up.

In production you run both side by side. RED dashboards catch slow endpoints and rising error rates at the application layer. USE dashboards catch the noisy neighbor eating CPU before your service even notices anything is wrong.

Here's the part people miss: RED can look perfectly healthy while a disk is about to fill up. Your request rate, error rate, and latency can all be green, and you still get paged an hour later because `/var/log` hit 100% and the box falls over. USE catches that kind of failure before it surfaces as a RED metric.

So when someone asks RED versus USE, the answer isn't either-or. It's both, paired together. Skip one and you're debugging blind.

## Why interviewers ask this

This question separates people who've memorized acronyms from people who've actually built dashboards and gotten paged. Interviewers want to know if you understand that application-level health and infrastructure-level health are different signals that can diverge, and whether you know which framework answers which question.

## Follow-ups to expect

- **Which one would you alert on first?** Usually RED for user-facing impact, since that's what customers feel directly, but USE metrics often give you earlier warning before RED degrades.
- **Give an example where RED looks fine but USE doesn't.** A disk slowly filling up from log growth: requests still succeed and latency is normal, but saturation is climbing toward failure.
- **How would you structure dashboards for a new service?** Put RED metrics on the top-level service dashboard for on-call triage, and USE metrics on a lower-level infra dashboard so you can correlate the two when something looks off.

## The common wrong answer

Most candidates either confuse the two frameworks outright, mixing up which letters apply to services versus resources, or they pick one as "the right one" to use everywhere. Treating RED and USE as an either-or choice signals you haven't actually run both in production and seen a case where only one of them caught the problem.
