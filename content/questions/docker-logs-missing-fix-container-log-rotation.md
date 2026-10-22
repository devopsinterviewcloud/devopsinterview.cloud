---
title: Docker Logs Missing - Fix Container Log Rotation
description: Docker logs disappearing in production? Learn why the default json-file driver loses logs and how max-size and max-file fix rotation.
date: 2026-10-22
keywords: docker, devops interview questions, docker logs missing, docker log rotation fix, container logs disappeared, docker logging driver
category: docker
youtube: N_AAkJ7HqmI
---

A container looks healthy, uptime is fine, but the moment you need `docker logs` to debug something, there's nothing there. This comes up in interviews because it's a real production incident, not a theoretical one, and it tests whether you understand Docker's logging defaults instead of just running containers on autopilot.

## The answer interviewers want

The root cause is almost always the log driver configuration. Docker defaults to the `json-file` driver, and out of the box it has no rotation limits set. That means one of two things happens: either the log file grows unbounded and fills the disk, or whatever log rotation is in place rotates files away before anyone gets a chance to read them.

The fix is to set explicit rotation limits on the driver. Use the `max-size` and `max-file` options, for example `max-size=10m` and `max-file=3`. That keeps a bounded set of recent log files around (in this case, three files of roughly 10MB each) instead of letting Docker either consume all available disk or silently lose history.

The part people miss: Docker doesn't only log through its own driver. Check the systemd journal as well. When the container's logging driver fails or misbehaves, Docker can end up logging to the systemd journal instead, so if `docker logs` comes up empty, `journalctl` is the next place to look before assuming the data is gone for good.

## Why interviewers ask this

This question separates people who've only run `docker logs` locally from people who've operated Docker in production long enough to hit a full disk or a missing log at 3AM. It tests whether you know Docker's defaults aren't production-safe out of the box, and whether you know where logs can end up besides the obvious place.

## Follow-ups to expect

- **How would you apply this across many containers instead of one at a time?** Set the `max-size` and `max-file` options in the Docker daemon's default logging configuration so every new container inherits them, rather than configuring each container individually.
- **What's the risk of not setting these limits?** Without rotation limits, the `json-file` driver can grow without bound and fill the host's disk, which can affect every other container and service running on that node, not just the one producing the logs.
- **Why would logs show up in the systemd journal instead of `docker logs`?** When the configured container log driver fails, Docker can fall back to or otherwise log through the systemd journal, so the logs aren't lost, they're just not where you expect them.

## The common wrong answer

Candidates often jump straight to "the logs got deleted" or blame the application, without naming the actual mechanism: an unconfigured `json-file` driver either filling the disk or being rotated away. They also rarely mention checking the systemd journal, which means in a real incident they'd keep staring at an empty `docker logs` output without knowing where else to look.
