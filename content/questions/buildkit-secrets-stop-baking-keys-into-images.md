---
title: BuildKit Secrets - Stop Baking Keys Into Images
description: Why Docker ARG and ENV leak secrets into image layers, and how BuildKit's --mount=type=secret keeps them out for good.
date: 2026-10-22
keywords: docker, devops interview questions, buildkit secrets, docker buildkit secrets tutorial, how to hide secrets in docker build, docker interview questions
category: docker
youtube: HqDugRwISck
---

A candidate who says "just pass the API key as a build ARG" is telling you they've never looked at `docker history` on their own image. This question comes up because it separates people who've memorized Dockerfile syntax from people who understand what a layer actually is.

## The answer interviewers want

ARG and ENV values get baked into the image's build history and cache layers. Even if you unset an ENV variable in a later instruction, the earlier layer still exists and still contains the value. Anyone with access to the image can pull it out with `docker history` or by inspecting the layers directly. ARG and ENV were never designed to hide anything, they're designed to be visible.

BuildKit secrets work differently. Instead of writing the secret into the filesystem that gets committed as a layer, BuildKit mounts it as a temporary file that exists only for the duration of that one `RUN` instruction, then throws it away. Nothing ever touches a layer, so there's nothing to leak.

Getting it working is three steps. First, turn on BuildKit. Second, add `--mount=type=secret,id=mysecret` to the relevant `RUN` line in your Dockerfile, and reference the mounted file path inside that command. Third, run the build with the secret supplied: `docker build --secret id=mysecret,src=secret.txt .`

The catch nobody mentions: a lot of CI runners still default to the legacy Docker builder, not BuildKit. If that's the case, your `--secret` flag does nothing useful and you won't necessarily get an obvious error telling you so. Check with `docker buildx` before you assume this protects you in production.

## Why interviewers ask this

They want to know if you understand image layers well enough to explain why a "fix" that looks secure actually isn't. They're also checking whether you think about build-time secrets as a production concern, not just a local dev convenience, and whether you'd actually verify your CI pipeline's builder before trusting it.

## Follow-ups to expect

**How would you verify a secret didn't end up in an image?** Run `docker history` on the built image and inspect the layers, or export and grep the filesystem, looking for the secret value or any trace of the file that held it.

**What happens if your CI runner is still on the legacy builder?** The `--secret` flag either fails outright or silently does nothing useful depending on setup, so you need to explicitly confirm BuildKit is active with `docker buildx` rather than assuming it by default.

**Why not just use an ARG and avoid writing it to disk?** The ARG value itself still gets recorded in the build history and cache metadata, so it's recoverable even if your running container never writes it to a file.

## The common wrong answer

Most candidates reach for "use ENV and then unset it in a later RUN step" or "use ARG, it's not visible in the final container filesystem." Both miss the point: the image is made of layers, and the layer containing the secret still exists in the build cache and history, fully extractable, regardless of what later instructions do to the running container's environment.
