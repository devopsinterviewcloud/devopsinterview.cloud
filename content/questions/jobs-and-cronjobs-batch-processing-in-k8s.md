---
title: Jobs and CronJobs - Batch Processing in K8s
description: Learn when to use a Kubernetes Job vs CronJob for batch processing, with the activeDeadlineSeconds detail interviewers probe for.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes jobs cronjobs, k8s batch processing interview, kubernetes interview questions, jobs vs cronjobs kubernetes
category: kubernetes
youtube: D2INBVeJE1w
---

Batch processing questions show up in almost every Kubernetes interview because they separate people who've only read the docs from people who've actually run workloads in production. The Job vs CronJob question looks simple, but the follow-up about runaway pods is where most candidates fall apart.

## The answer interviewers want

The core distinction is about repetition. A Job runs once to completion - think a database migration or a one-off data export. You kick it off, it does the work, it exits, and Kubernetes marks it done.

A CronJob is a Job that runs on a schedule. It's recurring, like a daily backup script that needs to fire at 2am every night without anyone manually triggering it.

In practice, the split looks like this:

- **Jobs**: migrations, data processing runs, cleanup tasks - anything triggered once, on demand, that needs to finish and stop.
- **CronJobs**: backups, scheduled reports, maintenance windows - anything that needs to repeat on a fixed interval.

The detail that separates a surface-level answer from a solid one: set `activeDeadlineSeconds` on your Job spec. Without it, a stuck or misbehaving pod can sit there consuming CPU and memory indefinitely - a zombie pod eating resources forever instead of failing cleanly. Setting a deadline forces Kubernetes to kill the Job if it overruns, so a bad run doesn't quietly drain your cluster's capacity.

## Why interviewers ask this

Anyone can recite "Job runs once, CronJob runs on a schedule" - that's a definition, not operational experience. Interviewers ask this to see if you've actually been burned by a batch job that didn't terminate, and whether you know the guardrails that keep that from happening in a shared cluster.

## Follow-ups to expect

- **What happens if you don't set activeDeadlineSeconds?** A hung or long-running pod keeps consuming cluster resources with no automatic cutoff, which can starve other workloads on the node.
- **Would you use a CronJob for a one-time data export?** No - a CronJob is for recurring work on a schedule. A one-time export is a Job, even if you trigger it manually or from a pipeline.
- **How do you decide between a Job and a CronJob for a recurring cleanup task?** If it genuinely needs to repeat on a schedule, like nightly maintenance, use a CronJob; if it's a single cleanup run tied to an event, a Job is enough.

## The common wrong answer

The typical wrong answer stops at the dictionary definition - "Jobs run once, CronJobs run on a schedule" - and never mentions failure handling. Candidates who only memorize the distinction miss the part interviewers actually care about: what happens when a batch pod misbehaves. Leaving out `activeDeadlineSeconds` signals you've described the feature but never operated it under real conditions.
