---
title: Docker Secrets vs Env Vars - Stop Leaking Credentials
description: Docker Secrets vs environment variables for credential management: why env vars leak and how Docker Secrets protects them at rest.
date: 2026-10-22
keywords: docker, devops interview questions, docker secrets vs environment variables, docker secrets security interview questions, docker credential management best practices, docker security interview questions
category: docker
---

A classic container security question: why not just pass credentials as environment variables, and what does Docker Secrets actually do differently. It comes up because it's an easy way to check if a candidate understands where secrets actually live on a running system, not just how to inject them.

## The answer interviewers want

Environment variables are not a secure way to hand credentials to a container. They show up in process listings, they show up in `docker inspect` output on the host, and they have a habit of ending up in application logs when something crashes and dumps its environment. Anyone with access to the container or the host can read them in plain text with basic tools.

Docker Secrets takes a different approach. Secrets are encrypted at rest and stored in Swarm's Raft log, which means they're replicated and encrypted as part of the cluster state rather than sitting in a config file or an env var. When a service actually needs a secret, Docker mounts it as a file under `/run/secrets/` inside the container, and that file lives in memory only, not on disk. So the credential never gets written to the container's filesystem and never shows up in `docker inspect` or process output.

The practical advice worth repeating in an interview: use `docker-compose` secrets even on a single-node development machine, not just in a Swarm production cluster. It won't give you the full Raft-backed encryption benefit on a single node, but it builds the habit of treating secrets as mounted files instead of env vars, so the transition to production doesn't require rewriting how the application reads its credentials.

## Why interviewers ask this

This question separates people who've only ever run `docker run -e DB_PASSWORD=...` from people who understand what's actually exposed on a host once a container starts. It's also a quick way to see if someone thinks about secrets management as a habit baked into local dev, or as something bolted on right before a production deploy.

## Follow-ups to expect

**How would you check if a container is leaking secrets through its environment?** Inspect the container with `docker inspect` and check `docker top` or `/proc/<pid>/environ` on the host, since both commands can expose env vars directly.

**Does Docker Secrets work outside of Swarm mode?** The source describes Secrets as a Swarm feature, with the Raft log storage; on single-node Compose setups you get the file-mounting workflow but not the clustered encrypted storage.

**Why mount secrets as files instead of injecting them directly?** Files in a memory-backed mount avoid the process-list and inspect-output exposure that environment variables have, and they don't get written to disk.

## The common wrong answer

Most candidates say "use a vault or secrets manager" and stop there, without explaining what's actually wrong with environment variables in the first place, or how Docker Secrets differs mechanically from just another way to pass the same string into the container. That skips the part interviewers actually want: what's exposed, where, and why the storage and mounting mechanism matters.
