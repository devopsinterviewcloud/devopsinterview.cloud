---
title: Docker Bridge vs Host vs None - 3 Network Modes
description: Docker bridge, host, and none network modes explained: isolation, NAT, port mapping, and the host-mode -p flag gotcha interviewers probe.
date: 2026-10-22
keywords: docker, devops interview questions, docker network modes bridge vs host vs none, docker bridge vs host network, docker networking interview questions, docker network mode explained
category: docker
youtube: Nnlzk_uLXo4
---

A container that looks dead but is actually fine, or a `-p` flag that silently does nothing, almost always traces back to which Docker network mode is in play. Interviewers use this question to check whether you actually understand container networking or just memorize `docker run` flags.

## The answer interviewers want

Docker gives you three core network modes, and each one changes how a container talks to the world.

**Bridge** is the default. Each container gets its own private IP on a virtual bridge network, and traffic leaves the host through NAT. This is what you get if you don't specify `--network` at all, and it's the right choice for normal apps where you want isolation between containers plus the ability to publish ports with `-p`.

**Host** mode drops that isolation entirely. The container uses the host's network namespace directly, no virtual interface, no NAT. You'd reach for this when you need raw network performance and can't afford the NAT overhead, for example high-throughput services where every microsecond of packet processing matters.

**None** mode gives the container only a loopback interface. No external network access at all. This is for security-locked workloads, batch jobs or sandboxed processes that should have zero ability to reach the network.

Here's the gotcha that trips people up in production: in host mode, `-p` port flags do nothing. There's no NAT layer to map a container port to a host port, because the container is already using the host's network stack directly. If you run a container with `--network host -p 8080:80`, that `-p` is silently ignored. Someone expecting port mapping to work gets a container that looks unreachable, when really it's just host mode doing exactly what it's supposed to do.

## Why interviewers ask this

This question separates people who've only run `docker run -p` in tutorials from people who've debugged real networking issues. It tests whether you understand NAT and isolation trade-offs, not just mode names, and whether you can explain why a config choice silently breaks an assumption someone else made.

## Follow-ups to expect

- **Why would you ever choose host mode over bridge?** When you need to eliminate NAT overhead for raw network performance, accepting the loss of isolation as the trade-off.
- **What happens if you deploy a host-mode container expecting `-p` to work?** Nothing gets mapped, the flag is ignored, and the container appears unreachable even though it's running fine and bound to a host port directly.
- **When would none mode make sense?** For workloads that should never touch the network, like isolated batch processing or security-sensitive jobs where any network access is a liability.

## The common wrong answer

Most candidates describe bridge mode correctly since it's the default everyone's used, but then guess vaguely at host and none, saying something like "host mode is faster" without explaining why, or missing the NAT mechanism entirely. The real tell is whether they know the `-p` flag gotcha in host mode. Candidates who've never hit it in practice usually don't mention it, and that's the detail that separates a memorized answer from real debugging experience.
