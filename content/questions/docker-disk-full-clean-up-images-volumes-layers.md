---
title: Docker Disk Full - Clean Up Images Volumes Layers
description: How to free disk space on a Docker host safely using system df, system prune, image prune -a, and volume prune without breaking production.
date: 2026-10-22
keywords: docker, devops interview questions, docker disk full, docker clean up images, docker system prune, docker volume cleanup
category: docker
youtube: AZlAyxxS6e4
---

A Docker host running out of disk space is one of those incidents that looks trivial until you're the one on call at 3AM trying to decide what's safe to delete. Interviewers ask this because disk cleanup is easy to get catastrophically wrong on a production host, and they want to know you won't just start deleting things blind.

## The answer interviewers want

First, don't delete anything yet. Run `docker system df` to see what's actually eating space: images, containers, volumes, and build cache, broken down by category. This tells you where the problem actually is before you touch anything.

Once you know what's consuming space, start with `docker system prune`. This safely removes unused containers, unused networks, and dangling images (image layers that are no longer tagged and aren't referenced by anything). It's the low-risk option because it only touches things Docker considers orphaned.

If you still need more space, `docker image prune -a` removes all unused images, not just dangling ones. This is more aggressive because it will delete images that aren't dangling but also aren't currently used by a running container, so anything you need pulled fresh later has to be re-pulled from the registry.

For volumes, `docker volume prune` removes unused volumes. This is the one to be most careful with on a production host, since volumes often hold persistent data, and an unused volume today might be a database that was just stopped for maintenance rather than something truly disposable.

The pattern interviewers want to hear: check first with `system df`, clean conservatively with `system prune`, then escalate to `image prune -a` and `volume prune` only as needed, understanding what each one actually removes.

## Why interviewers ask this

This question separates people who've memorized a cleanup command from people who understand what Docker's disk usage actually consists of. It also tests operational judgment under pressure: do you check before you delete, and do you know which prune commands are safe versus which ones can take down something still in use.

## Follow-ups to expect

**How would you prevent this from happening again instead of just reacting to it?** You'd want some form of scheduled cleanup or monitoring on disk usage so you catch it before it's an emergency, rather than relying on someone noticing the host is full.

**What's the risk of running `docker volume prune` on a production host?** It can delete volumes attached to containers that are stopped but not actually disposable, like a database volume for a service that's temporarily down, so you lose data that looked unused but wasn't.

**What's the difference between a dangling image and an unused image?** A dangling image is an untagged layer left behind after a rebuild with no references at all, while an unused image is a full image that simply isn't backing any running container right now; `system prune` only touches the former, `image prune -a` touches both.

## The common wrong answer

Most candidates jump straight to naming `docker system prune -a --volumes` as if it's a single universal fix, without mentioning `system df` first or distinguishing what each flag actually deletes. That answer sounds confident but signals someone who'd run a broad cleanup command on a live host and sort out what broke afterward.
