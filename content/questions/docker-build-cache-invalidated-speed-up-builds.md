---
title: Docker Build Cache Invalidated - Speed Up Builds
description: A DevOps interview breakdown of why Docker builds are slow, how layer caching invalidation works, and how to fix it with ordering, dockerignore, and BuildKit.
date: 2026-10-22
keywords: scenario, devops interview questions, docker build cache, docker build optimization, docker cache invalidation fix, dockerfile best practices
category: scenario
youtube: 90WN7SxN3O4
---

A Docker build that used to take ten seconds suddenly takes three minutes, and nobody touched the base image. This is one of the most common scenario questions in DevOps interviews because it tests whether you actually understand how layer caching works, not just that "Docker has caching."

## The answer interviewers want

Docker builds images in layers, and it caches each layer. The catch is that caching is sequential: one change invalidates every layer below it in the Dockerfile. If you change something early in the file, Docker has to rebuild everything that comes after it, even if those steps had nothing to do with your change.

The classic mistake is copying the entire project into the image first, then running the dependency install. Something like `COPY . .` followed by `npm install` or `pip install -r requirements.txt`. Since source code changes on almost every commit, that `COPY` invalidates the cache, which means the install step reruns every single build, even though your dependencies haven't changed.

The fix is ordering. Copy only the package manifest files first (`package.json` and `package-lock.json`, or `requirements.txt`), run the install, and only then copy the rest of the source code:

```
COPY package*.json .
RUN npm install
COPY . .
```

Now the install layer only invalidates when the dependency files actually change, not on every source edit.

On top of that, use a `.dockerignore` file to keep things like `node_modules` and `.git` out of the build context entirely. They bloat the context, slow down the initial upload to the daemon, and can accidentally invalidate layers if they end up copied in.

For further gains, use multi-stage builds to keep the final image lean and separate build-time dependencies from runtime ones, and use BuildKit's mount cache for package managers so dependency caches (npm, pip, apt) persist across builds without being baked into the image layers themselves.

## Why interviewers ask this

This question separates people who've memorized "Dockerfile best practices" from people who understand the underlying caching mechanism. It also signals whether you've actually debugged a slow CI pipeline, since build time directly affects deploy frequency and developer feedback loops.

## Follow-ups to expect

**Why does the order of instructions in a Dockerfile matter so much?** Because cache invalidation cascades downward: once one layer changes, every subsequent layer rebuilds regardless of whether it needs to.

**What does BuildKit's mount cache actually solve?** It lets package manager caches persist across builds without becoming part of the image layers, so you get the speed benefit without the image bloat.

**What problem does `.dockerignore` solve beyond cache invalidation?** It keeps unnecessary files like `node_modules` and `.git` out of the build context, which speeds up the context upload to the Docker daemon.

## The common wrong answer

Most candidates jump straight to "use multi-stage builds" as a buzzword without explaining why, or they suggest throwing more CPU and memory at CI runners instead of fixing the actual Dockerfile layer ordering, which is the root cause.
