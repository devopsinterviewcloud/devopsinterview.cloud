---
title: Multi-Stage Builds - Shrink and Secure Your Images
description: A 2GB Docker image is a common interview prompt. Learn how multi-stage builds cut image size and remove build tools from production.
date: 2026-10-22
keywords: docker, devops interview questions, multi stage docker builds, docker multi stage build tutorial, docker image optimization interview, docker build best practices
category: docker
youtube: L0uRVOFqREA
---

A bloated, slow-to-deploy Docker image full of unpatched build tools is one of the most common prompts interviewers reach for, because it tests whether you actually understand how images get built, not just whether you can write a Dockerfile that works.

## The answer interviewers want

The fix is multi-stage builds. You build your application in one stage that has all your tools installed, then copy just the compiled artifacts into a clean, minimal runtime image. The build stage never ships to production, only its output does.

A minimal example:

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM alpine:latest AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
```

The `AS builder` stage has Node, npm, and whatever compilers or dependencies you need to produce the build. The final `FROM alpine:latest AS runtime` stage starts clean and only pulls in the `dist` folder via `COPY --from=builder`. Everything else from the first stage, including the tools used to build it, gets discarded.

The part candidates often miss: this isn't just about image size. Build tools like `gcc` and `npm` simply aren't present in the production image anymore. That means fewer packages to patch, a smaller attack surface, and a security team that isn't flagging your image for compiler toolchains sitting in a runtime container that never needs them.

## Why interviewers ask this

This question separates people who've only ever written single-stage Dockerfiles from people who've had to actually ship and secure containers in production. It also tests whether you connect image size to real operational costs: slower deploys, slower autoscaling, and a bigger vulnerability surface for scanners to flag.

## Follow-ups to expect

**"Why does image size matter beyond disk space?"** Smaller images pull faster, which matters for deploy speed and for autoscaling events where new nodes need the image fast.

**"What would a security scan flag in a single-stage image that it wouldn't in a multi-stage one?"** Build-time tools and dependencies like `gcc` and `npm` that have no reason to be in a running production container, since they only exist to compile or install things during the build.

**"Could you have more than two stages?"** Yes, the pattern extends to as many stages as needed, each one handling a distinct part of the build, with only the final stage being what actually ships.

## The common wrong answer

Most candidates jump straight to "use alpine" or "add a `.dockerignore`" and stop there, treating image bloat as purely a disk-space problem. That misses the real point: the issue is that build-only tools are sitting in a production image at all, which is a security and attack-surface problem, not just a size problem. Multi-stage builds address both at once, and interviewers are listening for whether you connect the two.
