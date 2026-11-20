---
title: Docker Networking - Bridge Host None Overlay
description: Docker networking modes explained: bridge, host, none, and overlay, when to use each, and what interviewers listen for in your answer.
date: 2026-10-22
updated: 2026-11-20
keywords: docker, devops interview questions, docker networking modes, docker bridge vs host network, docker overlay network explained, docker interview questions
category: docker
youtube: 9hfSLPZY8QI
---

A question that sounds simple until you're asked why you'd pick one mode over another in production. Most engineers can name the four Docker networking modes but can't explain the tradeoffs, which is exactly what this question is designed to expose.

## The answer interviewers want

Docker has more drivers than these (macvlan and ipvlan, for example), but these four are the core ones, and each trades isolation for performance differently.

**Bridge** is the default. It gives you network namespace isolation, each container gets its own virtual interface and IP, and Docker handles the NAT and port mapping for you. This is what you get if you don't specify `--network` at all, and it's the right default for most single-host setups.

**Host** mode skips the network namespace entirely. The container shares the host's network stack directly, so there's no NAT overhead and no port mapping layer in between. You get native network performance, but you lose the isolation bridge mode gives you, and you lose portability since the container is now tied to whatever ports and interfaces exist on that specific host. Use it sparingly, and only when you've actually measured a networking bottleneck that justifies the tradeoff.

**None** removes networking entirely. The container gets a loopback interface and nothing else. This is for workloads that genuinely don't need network access, or where you're attaching custom networking outside Docker's normal path.

**Overlay** connects containers across multiple Docker hosts, not just within one. It's what Swarm uses so containers on different physical or virtual machines can talk to each other as if they were on the same network. Without it, containers on different hosts can only reach each other through published ports on the host IPs, or networking you set up yourself.

## Side by side

| | bridge | host | none | overlay |
|---|---|---|---|---|
| Network namespace | Its own | The host's | Its own, loopback only | Its own, on a network that spans hosts |
| Container IP | From the bridge subnet (172.17.0.0/16 on the default bridge) | The host's addresses | None | From the overlay subnet |
| Reached from outside by | Ports published with `-p` | The host's ports directly (`-p` is ignored) | Nothing | Ports published through the Swarm routing mesh, or directly on each node with `mode=host` |
| DNS by container name | Only on user-defined bridge networks | Not applicable | Not applicable | Yes, by service name |
| Typical use | Most single-host apps | Measured network bottlenecks, host monitoring agents | Jobs that must not touch the network | Swarm services across hosts |

## The default bridge trap

The row people miss is DNS. Containers on the default `bridge` network can't find each other by name, while containers on a network you create can. Docker Compose creates one for each project, which is why names work there and then fail when someone runs the same containers by hand:

```bash
docker network create app-net
docker run -d --name db --network app-net -e POSTGRES_PASSWORD=example postgres:16

# a few seconds later
docker run --rm --network app-net postgres:16 pg_isready -h db
# db:5432 - accepting connections

docker run --rm postgres:16 pg_isready -h db
# db:5432 - no response   (default bridge: the name doesn't resolve)
```

One more production gotcha: a published port like `-p 8080:80` listens on every interface, and Docker's own firewall rules can bypass UFW, so the port can be reachable from outside even when UFW says it's closed. Bind to localhost with `-p 127.0.0.1:8080:80` when only a local reverse proxy needs it. With Docker's default iptables backend, put your own filtering rules in the `DOCKER-USER` chain.

[Docker bridge vs host vs none](/questions/docker-bridge-vs-host-vs-none-3-network-modes) goes deeper on the single-host modes, and [container can't reach the host](/questions/docker-networking-issues-container-can-t-reach-host) covers the most common debugging case.

## Why interviewers ask this

This question separates people who memorized a list from people who've actually had to debug a networking issue in production. Interviewers want to hear you reason about tradeoffs, isolation versus performance versus portability, rather than just recite definitions. It also signals whether you understand when host mode's performance gain is worth sacrificing portability for.

## Follow-ups to expect

**When would you actually use host mode in production?** When you've measured real latency or throughput overhead from bridge mode's NAT layer, typically for high-throughput proxies or network-intensive services, and you've accepted the portability cost.

**How does overlay networking relate to Swarm or Kubernetes?** Overlay is what gives Swarm services one shared network across hosts; Kubernetes uses its own CNI-based networking model but solves a similar cross-host problem.

**What's the security implication of host mode?** It removes network namespace isolation, so a compromised container has direct access to the host's network interfaces, which is a meaningfully larger blast radius than bridge mode.

## The common wrong answer

Candidates usually list all four modes correctly but stop there, treating it as a vocabulary question. The weak answer never mentions that host mode breaks portability, or that overlay is the one that gives containers a shared network across hosts. Interviewers notice when someone can define the terms but can't say why you'd pick one over another on a real system.
