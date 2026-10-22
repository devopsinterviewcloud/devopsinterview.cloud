---
title: BuildKit vs Legacy Builder - 10x Faster Docker Builds
description: BuildKit vs the legacy Docker builder: parallel stages, cache mounts, and why your builds are slower than they should be.
date: 2026-10-22
keywords: docker, devops interview questions, docker buildkit, docker buildkit vs legacy builder, docker build cache optimization, docker interview questions
category: docker
youtube: i0EyXcQxs2s
---

A lot of candidates can run `docker build` all day and still freeze when asked why BuildKit exists. This question comes up because it separates people who memorized commands from people who actually understand how the build engine works.

## The answer interviewers want

The legacy builder executes every layer sequentially, one instruction at a time, even if two stages in a multi-stage build have no dependency on each other. It builds everything it's told to, whether you need the result or not.

BuildKit changes that model. It parallelizes independent build stages and skips stages that aren't required to produce the final image. If your Dockerfile has a test stage or a debug stage that the final `COPY --from` doesn't reference, BuildKit won't waste time building it.

You can turn it on with a single environment variable: `DOCKER_BUILDKIT=1 docker build .`. In practice you probably don't need to do this manually anymore. BuildKit has been the default builder since Docker 23, so if you're on a reasonably current install, you're already using it.

The detail most people miss is cache mounts. With `--mount=type=cache`, BuildKit can persist a directory, like your package manager's cache, across builds even when the layer above it changes. That means `npm install` or `apt-get install` stops re-downloading the same packages on every single build. The cache mount survives layer invalidation in a way that regular Docker layer caching doesn't. If your builds are slow and most of the time is going into dependency installation, this is usually the fix, not rewriting your Dockerfile from scratch.

## Why interviewers ask this

This question is a proxy for whether you've actually optimized a build pipeline or just copy-pasted a Dockerfile that works. It also tests whether you keep up with defaults changing over time, since an engineer who doesn't know BuildKit is now default is probably running an outdated mental model of the whole toolchain.

## Follow-ups to expect

**How do you check which builder you're currently using?** Run `docker build` and look at the output format. BuildKit's output shows stage-by-stage progress with timing; the legacy builder's output is a flat, linear log.

**What happens to cache mounts if you build on a different machine or a fresh CI runner?** The cache is local to the builder instance, so a brand new runner starts cold. This is why teams pair cache mounts with a persistent or remote cache backend in CI rather than relying on the CI runner's local disk alone.

**Can BuildKit skip a stage and still fail silently if that stage has a side effect you needed?** Yes, if a stage isn't referenced by the final image and you were relying on it running anyway, like a lint check with no output consumed, it won't run under BuildKit unless you explicitly target it.

## The common wrong answer

Most candidates say something vague like "BuildKit is faster" without explaining why, or they confuse it with layer caching in general. The weak answer stops at "it's the new builder." The strong answer explains the sequential-versus-parallel execution model and can name cache mounts specifically, because that's the detail that actually shows up in day-to-day build time.
