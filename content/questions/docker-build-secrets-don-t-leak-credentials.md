---
title: Docker Build Secrets - Don't Leak Credentials
description: How to handle secrets in Docker builds using BuildKit mount=type=secret and multi-stage builds without leaking them into image layers.
date: 2026-10-22
keywords: docker, devops interview questions, docker build secrets, docker secrets interview questions, docker build credentials leak, docker mount type secret
category: docker
youtube: uoRIYXL6NoQ
---

A classic Docker interview question: how do you pass credentials, API keys, or private repo tokens into a build without them ending up baked into the final image? It trips up a lot of candidates because the obvious answers all leave a trail.

## The answer interviewers want

The core problem is that Docker images are built from layers, and anything written during a `RUN` or `COPY` step gets committed to a layer. If you copy a secrets file in and then delete it in a later step, the file is gone from the final filesystem view, but it's still sitting in the image history. Anyone who runs `docker history` or pulls apart the layers can recover it.

The fix is BuildKit's secret mount: `RUN --mount=type=secret,id=mysecret cat /run/secrets/mysecret`. This mounts the secret into the container filesystem only for the duration of that specific `RUN` instruction. It's never written to a layer, so it doesn't persist in the image at all.

The part most people miss is pairing this with multi-stage builds. Use the secret in your build stage, do whatever you need with it, then in your final stage only `COPY --from=build` the compiled artifacts over. The build stage with the secret mount never ships. The result is a build that can safely use credentials and a final image that's clean of any trace of them.

## Why interviewers ask this

This question separates people who've only run `docker build` from people who've actually had to secure a CI pipeline. It tests whether you understand how image layers and history actually work, not just that "secrets are bad." It also checks whether you know BuildKit features exist and when to reach for them instead of hacky workarounds.

## Follow-ups to expect

- **What about build args for secrets?** Build args get stored in the image history and in `docker inspect` output, so they're not safe for anything sensitive, even if they feel convenient.
- **What if you're stuck on a Docker version without BuildKit secret mounts?** You'd need to rely on external secret injection at runtime, or orchestrate the build so secrets are fetched and used outside the layer that gets committed, which is messier and why BuildKit's approach is preferred.
- **How do you confirm no secret leaked into the final image?** Inspecting `docker history` and the actual layer contents for the final stage is the practical check, since multi-stage builds mean the build stage layers simply aren't part of the shipped image.

## The common wrong answer

The most common mistake is copying a secret file into the image and then adding a `RUN rm` step to delete it, assuming that makes it disappear. It doesn't: the secret still exists in the earlier layer, and anyone with access to the image can extract it. Using `ARG` or plain environment variables for secrets is the same trap wearing a different hat.
