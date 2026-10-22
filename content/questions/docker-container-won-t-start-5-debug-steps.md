---
title: Docker Container Won't Start - 5 Debug Steps
description: A clear five-step process for debugging a Docker container that won't start, covering logs, exit codes, and entrypoint overrides.
date: 2026-10-22
keywords: docker, devops interview questions, docker container won't start, docker debugging tutorial, docker troubleshooting interview questions
category: docker
youtube: x8g4zYVE9XE
---

A container that exits immediately after `docker run` is one of the most common real-world Docker problems, and interviewers like it because it's a fast way to see if you debug systematically or just guess and restart things.

## The answer interviewers want

Start with logs and the exit code. Run `docker logs <container_name>` to see what the application actually printed before it died. Then run `docker inspect <container_name>` and look at the exit code in the output. An exit code of `0` means the process ran and finished successfully on its own, which usually means your command or entrypoint wasn't meant to run forever in the first place. Any non-zero code means something failed, and the logs are your first clue as to what.

Second, verify the image and its dependencies actually exist and are what you think they are. Run `docker images` to confirm the image is built and tagged the way you expect. Then run the image interactively with `docker run -it <image>` to test it manually instead of relying on whatever command or script normally launches it.

A useful trick here is overriding the entrypoint entirely: `docker run --entrypoint /bin/sh <image>`. This drops you into a shell inside the container before the application ever tries to start, so you can look around, check that files exist, check environment variables, and run the actual start command by hand to see exactly where it breaks.

## Why interviewers ask this

This question is really checking whether you have a repeatable debugging process instead of randomly restarting the container and hoping it works. They also want to see that you understand the difference between an application-level failure and an environment or image-level failure, since those require different fixes.

## Follow-ups to expect

**What does it mean if the exit code is 0 but the container still isn't running?** It means the process completed and exited normally, so the problem usually isn't a crash. It's more likely that the container's main process was something short-lived, like a one-off script, rather than a long-running service.

**Why override the entrypoint instead of just checking the Dockerfile?** The Dockerfile tells you what should happen, but overriding the entrypoint with `/bin/sh` lets you actually get inside the running environment and verify what's really there, including files, permissions, and env vars, before the application's own startup logic gets in the way.

**What would you check if `docker images` doesn't show the image you expect?** That points to a build or tagging problem upstream, not a runtime problem, so the fix is in your build pipeline rather than in the container's startup behavior.

## The common wrong answer

Most candidates jump straight to guessing, suggesting they'd rebuild the image, add more logging to the app, or just rerun the container a few times. That skips the actual diagnosis. The stronger answer always starts with the data you already have: the logs and the exit code, before touching anything else.
