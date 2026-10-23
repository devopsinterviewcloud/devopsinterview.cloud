---
title: Why Your App Needs More Than One Container
description: Why mid-level DevOps interviews probe single-container vs multi-container design, and how to explain single-responsibility container patterns.
date: 2026-10-22
keywords: docker, devops interview questions, multi-container docker apps, why use multiple containers docker, docker interview questions for beginners, sidecar pattern docker
category: docker
youtube: YJcATbDKjL0
---

A classic interview scenario: you're asked to review a Dockerfile that runs the app, the database, and the logging agent all in one container. The question tests whether you actually understand container design or just know the `docker run` syntax. It comes up constantly because it separates people who've only built toy projects from people who've run things in production.

## The answer interviewers want

One container should do one job. If you cram your app and your database into the same container, a crash in either one takes the whole thing down. Split them, and only the broken piece restarts.

In practice: run your app in its own container, then attach a sidecar for logging, metrics, or a proxy like `nginx`. You wire these together with Docker Compose or, in Kubernetes, with a pod spec that groups the containers that need to share a network namespace or volume.

The detail most candidates miss: each container gets its own restart policy. That means your logging sidecar can crash and get reloaded without ever touching your main app container. The app keeps serving traffic while the sidecar recovers on its own.

So the point isn't "never run two processes near each other." It's about splitting responsibility so failure in one component doesn't cascade into the others.

## Why interviewers ask this

They're checking if you understand the single-responsibility principle as it applies to containers, not just as a buzzword. They also want to see if you know how restart policies and process isolation actually work, since that's the mechanism that makes splitting containers useful rather than just tidy. A candidate who can explain the failure mode (one crash takes both services down) shows they've thought about production behavior, not just build-time convenience.

## Follow-ups to expect

- **How do sidecar containers communicate with the main container?** Within a Kubernetes pod they share a network namespace and can talk over `localhost`, and they can share volumes for log files or sockets. In Docker Compose, containers communicate over the network Compose creates for that project.
- **What's the tradeoff of splitting everything into separate containers?** You gain independent restart and scaling, but you add orchestration complexity: more containers to define, network wiring, and separate lifecycle management to reason about.
- **When would you still combine two things in one container?** The source pattern is about splitting by responsibility, so the implication is you combine only processes that are so tightly coupled they have no independent failure mode worth isolating, otherwise you keep them separate.

## The common wrong answer

Candidates often say "just use `docker-compose` to split services" without explaining why that matters operationally. That answer sounds right but skips the actual mechanism: independent restart policies per container. Without naming that, it's unclear whether the candidate understands the benefit or just memorized that microservices use multiple containers.
