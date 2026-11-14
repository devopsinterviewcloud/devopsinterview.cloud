---
title: Init Containers - Run Setup Before Your App Starts
description: Learn what Kubernetes init containers are, when to use them, and how to answer this common DevOps interview question.
date: 2026-10-22
keywords: kubernetes, devops interview questions, init containers, devops, docker
category: kubernetes
---

Your app crashes on startup because the database isn't ready yet. You could hack around it with retry loops in app code, or you could let Kubernetes handle it properly. This is a classic Kubernetes interview question because it separates people who've only read the docs from people who've actually run migrations in production.

## The answer interviewers want

Init containers run before your main app container starts. Kubernetes runs them sequentially, in order, and each one must complete successfully before the next one (or the main container) starts.

They're a good fit for setup tasks that have to finish before your app is actually serving traffic: things like downloading config files, pulling in dependencies the main container shouldn't have to carry, or database migrations. Every replica runs its own init containers, though, so a migration has to be safe to run concurrently and more than once.

Common use cases:

- Waiting for a dependent service to be ready (so the main container doesn't crash-loop while it polls a database or API)
- Running database migrations before the app starts handling requests
- Fetching secrets from external systems and writing them somewhere the main container can read

One thing worth saying out loud in an interview: set resource requests and limits on init containers. If you don't, a migration can quietly eat the CPU and memory on its node while it runs, and you won't notice until something else on that node gets starved or evicted.

## Why interviewers ask this

This question checks whether you understand the Kubernetes pod lifecycle beyond "container starts, container runs." It also tests whether you think about startup dependencies as a design problem rather than something to patch over with retries and sleep statements in app code. Mentioning resource limits on init containers is a signal that you've actually operated this in production, not just read about it.

## Follow-ups to expect

**What happens if an init container fails?** The kubelet keeps restarting that init container, with backoff, until it succeeds; the ones that already completed don't run again. If the pod's `restartPolicy` is `Never`, the whole pod is marked failed instead. The main container never starts until all init containers succeed.

**How is this different from a sidecar container?** Init containers run to completion before the main container starts and then they're done. Sidecars run alongside the main container for the lifetime of the pod, handling ongoing concerns like log shipping or proxying.

**Why not just put this setup logic in the main container's entrypoint script?** You could, but then the main container's resource profile, image, and failure behavior get tangled up with one-time setup work. Splitting it into an init container keeps the main container focused on just running the app.

## The common wrong answer

Candidates often describe init containers correctly in isolation, that they run before the main container, but they stop there. They miss the operational angle: what happens on failure, how init containers chain together, and especially the resource limits point. Skipping resource limits on a migration init container is a real way to starve a node, and interviewers notice when candidates don't bring that up unprompted.
