---
title: Docker Healthcheck - Catch Dead Containers Early
description: How Docker HEALTHCHECK works, why a running container can still be dead, and why Kubernetes ignores this instruction entirely.
date: 2026-10-22
keywords: docker, devops interview questions, docker healthcheck, docker healthcheck interview questions, docker healthcheck tutorial, docker interview questions
category: docker
youtube: XSRdv36HHwU
---

A container can show as "running" in `docker ps` while the process inside is completely wedged. This question separates people who know Docker's process model from people who think a running PID means a working app, and it's a common trap in container and orchestration interviews.

## The answer interviewers want

"Running" only tells Docker that PID 1 inside the container hasn't exited. It says nothing about whether the application is actually serving traffic. A process can hang, deadlock, or get stuck waiting on a dependency while still technically being alive, and Docker has no built-in way to know that unless you tell it how to check.

That's what `HEALTHCHECK` is for. You add it to your Dockerfile and give it a command to run inside the container, something like:

```
HEALTHCHECK --interval=30s --retries=3 CMD curl -f http://localhost/health || exit 1
```

Docker runs that command on the interval you set, here every 30 seconds. If it fails enough consecutive times, three in this example, Docker flags the container as unhealthy. In standalone Docker that status just shows up in `docker ps`. In Docker Swarm, an unhealthy container triggers a reschedule, Swarm kills it and starts a replacement.

The part that trips people up: Kubernetes ignores `HEALTHCHECK` entirely. It's a Docker and Swarm-only instruction. If you're running on Kubernetes, that Dockerfile line does nothing at runtime. Kubernetes has its own mechanism, liveness and readiness probes defined in the pod spec, and it needs those configured separately regardless of what's baked into the image. So the honest answer to "how does Docker know a container's healthy" is: it doesn't, unless you explicitly tell it how to check, and that check only matters if you're actually running under Docker or Swarm.

## Why interviewers ask this

This question checks whether you understand the gap between "process alive" and "application healthy," which is the root cause of a lot of silent outages. It also screens for people who assume Docker concepts carry over unchanged into Kubernetes, which is a dangerous assumption in production.

## Follow-ups to expect

- **What's the difference between a liveness probe and a readiness probe in Kubernetes?** A liveness probe decides if the container should be restarted, a readiness probe decides if it should receive traffic; they answer different questions even though both can use similar checks.
- **What happens if your healthcheck command itself is slow or flaky?** A slow or unreliable check command can cause false unhealthy flags and unnecessary restarts, so the check itself needs to be fast and dependable.
- **How does Swarm behave once a container is marked unhealthy?** Swarm reschedules it, killing the unhealthy container and starting a new one in its place.

## The common wrong answer

Candidates usually say Docker checks if the container is "up" and leave it there, treating a running process as proof of health. Some also assume `HEALTHCHECK` works the same way in Kubernetes, which immediately signals they haven't actually run workloads on both platforms.
