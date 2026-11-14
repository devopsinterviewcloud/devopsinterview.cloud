---
title: Docker Logs Missing - Fix Container Log Rotation
description: Docker logs missing in production? Learn why an unbounded json-file driver fills the disk, where else logs end up, and how max-size and max-file fix rotation.
date: 2026-10-22
keywords: docker, devops interview questions, docker logs missing, docker log rotation fix, container logs disappeared, docker logging driver
category: docker
youtube: N_AAkJ7HqmI
---

A container looks healthy, uptime is fine, but the moment you need `docker logs` to debug something, there's nothing there. This comes up in interviews because it's a real production incident, not a theoretical one, and it tests whether you understand Docker's logging defaults instead of just running containers on autopilot.

## The answer interviewers want

Start with two checks. First, make sure the app actually writes to stdout and stderr; if it logs to a file inside the container, `docker logs` has nothing to show. Then look at the log driver. Docker defaults to the `json-file` driver, and out of the box it has no rotation limits set, so the log file grows unbounded until it fills the disk, and then new lines, and plenty else on the host, start failing.

The fix is to set explicit rotation limits on the driver. Use the `max-size` and `max-file` options, for example `max-size=10m` and `max-file=3`. That keeps a bounded set of recent log files around (in this case, three files of roughly 10MB each) instead of letting Docker consume all available disk. Anything older than those three files is gone, so ship logs somewhere central if you need history.

The part people miss: check the systemd journal as well. When the container's logging driver fails, dockerd logs the error, including the failed line, to its own log, which on systemd hosts is the journal. So if `docker logs` comes up empty, `journalctl -u docker` is the next place to look, though that error logging is rate-limited and won't have every line.

## Why interviewers ask this

This question separates people who've only run `docker logs` locally from people who've operated Docker in production long enough to hit a full disk or a missing log at 3AM. It tests whether you know Docker's defaults aren't production-safe out of the box, and whether you know where logs can end up besides the obvious place.

## Follow-ups to expect

- **How would you apply this across many containers instead of one at a time?** Set the `max-size` and `max-file` options in the Docker daemon's default logging configuration so every new container inherits them, rather than configuring each container individually.
- **What's the risk of not setting these limits?** Without rotation limits, the `json-file` driver can grow without bound and fill the host's disk, which can affect every other container and service running on that node, not just the one producing the logs.
- **Why would logs show up in the systemd journal instead of `docker logs`?** Usually because the configured driver failed: dockerd records the error, including the failed line, in its own log, which lands in the journal on systemd hosts. That error logging is rate-limited, so don't count on getting every line back.

## The common wrong answer

Candidates often jump straight to "the logs got deleted" or blame the application, without checking the basics: whether the app logs to stdout at all, and whether an unconfigured `json-file` driver has filled the disk. They also rarely mention checking the systemd journal, which means in a real incident they'd keep staring at an empty `docker logs` output without knowing where else to look.
