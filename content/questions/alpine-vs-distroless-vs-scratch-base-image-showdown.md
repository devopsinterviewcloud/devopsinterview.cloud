---
title: Alpine vs Distroless vs Scratch - Base Image Showdown
description: Alpine vs distroless vs scratch base images compared: musl libc bugs, attack surface, and why distroless beats Alpine in interviews.
date: 2026-10-22
keywords: docker, devops interview questions, alpine vs distroless vs scratch, docker base image comparison, distroless docker interview question, alpine linux docker
category: docker
---

A team picks Alpine for every Dockerfile because it's small and familiar, then spends an afternoon chasing a bug that only happens in the container. This question shows up because interviewers want to know if you've actually hit that wall or just copy-pasted `FROM alpine` out of habit.

## The answer interviewers want

Alpine is not the safe default most people assume it is. It ships a shell and a package manager, which is genuinely useful for debugging, but it's built on musl libc instead of glibc. That difference causes subtle bugs with glibc-linked binaries: code that runs fine on your dev machine or in CI can misbehave inside the Alpine container, and these bugs are hard to trace back to the base image.

`scratch` sits at the other extreme. It has zero attack surface because there's nothing in it, but that also means you're on your own. No shell, no libc, no utilities. If something goes wrong in prod, you can't exec in and poke around.

Distroless is the actual sweet spot. No shell, no package manager, so the attack surface stays small, but it includes the runtime your application actually needs, so you don't fight compatibility issues the way you do with Alpine's musl libc. The detail most people don't know: distroless images come in a debug variant. It's the same image with busybox added on top. That means you can run hardened, shell-less distroless in production, and swap to the debug variant when you need to get a shell and investigate an incident.

So the real answer isn't "Alpine, because it's small and safe." It's distroless, because it gives you a minimal attack surface in production and a debugging path when you need one, without the glibc/musl landmines Alpine carries.

## Why interviewers ask this

This is a quick way to check whether a candidate has actually debugged a container in anger or is just repeating the common wisdom that Alpine is the lightweight, safe choice. It also tests whether you understand attack surface as a spectrum rather than a binary, since `scratch`, distroless, and Alpine all make different tradeoffs along that spectrum.

## Follow-ups to expect

- **What kind of bugs does musl libc actually cause?** Binaries compiled against glibc can behave differently or fail outright when run against musl, which is why a glibc-linked binary might work on your laptop and break inside an Alpine container.
- **When would you still choose `scratch`?** When you want the absolute smallest attack surface and your application is fully self-contained, accepting that you lose any ability to exec in and debug live.
- **How do you debug a distroless container in production?** Swap in the debug variant of the same image, which adds busybox on top, giving you a shell without changing anything else about the image.

## The common wrong answer

Most candidates say "Alpine, because it's small and more secure than a full OS image," and stop there. That answer misses that Alpine's shell and package manager widen the attack surface compared to distroless, and it ignores the musl libc compatibility risk entirely, which is the exact tradeoff interviewers are trying to surface.
