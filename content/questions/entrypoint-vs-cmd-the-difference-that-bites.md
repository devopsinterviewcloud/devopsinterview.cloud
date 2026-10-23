---
title: ENTRYPOINT vs CMD - The Difference That Bites
description: Docker interview prep: the real ENTRYPOINT vs CMD difference, and why relying on CMD alone lets someone override your binary at runtime.
date: 2026-10-22
keywords: docker, devops interview questions, entrypoint vs cmd docker, docker entrypoint cmd difference, docker interview questions, docker entrypoint explained
category: docker
youtube: 5N9twgyrNCQ
---

Every Docker interview eventually asks you to explain ENTRYPOINT vs CMD, and most candidates give the textbook answer without understanding what actually breaks in production because of it.

## The answer interviewers want

Most people answer "CMD is the default command" and stop there. That's true, but it's only half the picture. ENTRYPOINT is the binary that always runs in the container - it's fixed. CMD is the default arguments passed to that binary - it's meant to be overridden.

Run `docker run myimage somearg` and you override CMD, not ENTRYPOINT. That's the whole point: ENTRYPOINT stays locked no matter what arguments someone passes at runtime.

The part most people miss: if you only define CMD and skip ENTRYPOINT, someone can accidentally override your entire executable at runtime, not just its arguments. A `docker run myimage /bin/bash` call replaces your intended process completely if nothing is pinning it down.

The pattern that signals real production experience: use ENTRYPOINT to lock the binary, and CMD to set safe default arguments for it. That separates candidates who've actually shipped containers from those who just memorized the docs.

## Why interviewers ask this

This question filters for people who've hit the failure mode, not just read the Dockerfile reference. Anyone can recite "CMD is the default command" - the real signal is whether you understand the operational and security implications of letting runtime arguments overwrite your container's entrypoint. It's a quick way to tell who has debugged a container running the wrong process in production.

## Follow-ups to expect

**What happens if you define both ENTRYPOINT and CMD?** CMD's value gets passed as arguments to ENTRYPOINT by default, so ENTRYPOINT defines the fixed binary and CMD supplies the default arguments to it.

**How would you override CMD at runtime without touching ENTRYPOINT?** Pass new arguments after the image name in `docker run`, for example `docker run myimage --flag value` - this replaces CMD but ENTRYPOINT still runs as the locked binary.

**Why is relying on CMD alone a risk?** Without ENTRYPOINT pinning the binary, someone can pass a completely different executable at runtime and replace what the container was built to run, which is both a correctness and security problem.

## The common wrong answer

Candidates say "CMD sets the default command and you can override it" and leave it there, treating ENTRYPOINT and CMD as interchangeable or skipping ENTRYPOINT entirely. That answer shows textbook recall but misses the actual engineering reason the two exist separately: locking down what always executes versus what can safely change at runtime.
