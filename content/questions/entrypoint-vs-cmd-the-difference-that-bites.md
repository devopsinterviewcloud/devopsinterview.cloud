---
title: ENTRYPOINT vs CMD - The Difference That Bites
description: Docker interview prep: the real ENTRYPOINT vs CMD difference, and why relying on CMD alone lets someone override your binary at runtime.
date: 2026-10-22
keywords: docker, devops interview questions, entrypoint vs cmd docker, docker entrypoint cmd difference, docker interview questions, docker entrypoint explained
category: docker
youtube: 5N9twgyrNCQ
---

ENTRYPOINT vs CMD comes up in a lot of Docker interviews, and most candidates give the textbook answer without understanding what actually breaks in production because of it.

## The answer interviewers want

Most people answer "CMD is the default command" and stop there. That's true, but it's only half the picture. ENTRYPOINT is the executable the container runs by default. CMD is the default arguments passed to it, and it's meant to be overridden.

Run `docker run myimage somearg` and you override CMD, not ENTRYPOINT: arguments after the image name replace CMD and get appended to ENTRYPOINT. Changing ENTRYPOINT itself takes an explicit `docker run --entrypoint` (or `command` in a Kubernetes pod spec), so it's a sticky default, not a lock.

The part most people miss: if you only define CMD and skip ENTRYPOINT, any argument someone passes replaces your entire command, not just its arguments. A `docker run myimage --verbose` meant as a flag tries to execute `--verbose` and fails, and `docker run myimage /bin/bash` swaps out your process completely.

The pattern that signals real production experience: use exec-form ENTRYPOINT for the binary, and CMD for safe default arguments to it. That separates candidates who've actually shipped containers from those who just memorized the docs.

## Why interviewers ask this

This question filters for people who've hit the failure mode, not just read the Dockerfile reference. Anyone can recite "CMD is the default command". The real signal is whether you understand what happens when runtime arguments replace the command your image was built to run. It's a quick way to tell who has debugged a container running the wrong process in production.

## Follow-ups to expect

**What happens if you define both ENTRYPOINT and CMD?** With both in exec form, CMD's value gets passed as arguments to ENTRYPOINT, so ENTRYPOINT sets the binary and CMD supplies its default arguments. Use shell form for ENTRYPOINT and CMD is ignored, along with anything passed after the image name.

**How would you override CMD at runtime without touching ENTRYPOINT?** Pass new arguments after the image name in `docker run`, for example `docker run myimage --flag value`. This replaces CMD and ENTRYPOINT still runs.

**Why is relying on CMD alone a risk?** Without ENTRYPOINT, any argument passed at runtime replaces the whole command, so a flag meant for your app gets executed as the program. That's a correctness problem, not a security boundary: anyone who can run the container can also pass `--entrypoint`.

## The common wrong answer

Candidates say "CMD sets the default command and you can override it" and leave it there, treating ENTRYPOINT and CMD as interchangeable or skipping ENTRYPOINT entirely. That answer shows textbook recall but misses the actual engineering reason the two exist separately: a default executable versus default arguments that are meant to change at runtime.
