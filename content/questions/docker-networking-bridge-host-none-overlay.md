---
title: Docker Networking - Bridge Host None Overlay
description: Docker networking modes explained: bridge, host, none, and overlay, when to use each, and what interviewers listen for in your answer.
date: 2026-10-22
keywords: docker, devops interview questions, docker networking modes, docker bridge vs host network, docker overlay network explained, docker interview questions
category: docker
youtube: 9hfSLPZY8QI
---

A question that sounds simple until you're asked why you'd pick one mode over another in production. Most engineers can name the four Docker networking modes but can't explain the tradeoffs, which is exactly what this question is designed to expose.

## The answer interviewers want

Docker gives you four networking modes, and each one trades isolation for performance differently.

**Bridge** is the default. It gives you network namespace isolation, each container gets its own virtual interface and IP, and Docker handles the NAT and port mapping for you. This is what you get if you don't specify `--network` at all, and it's the right default for most single-host setups.

**Host** mode skips the network namespace entirely. The container shares the host's network stack directly, so there's no NAT overhead and no port mapping layer in between. You get native network performance, but you lose the isolation bridge mode gives you, and you lose portability since the container is now tied to whatever ports and interfaces exist on that specific host. Use it sparingly, and only when you've actually measured a networking bottleneck that justifies the tradeoff.

**None** removes networking entirely. The container gets a loopback interface and nothing else. This is for workloads that genuinely don't need network access, or where you're attaching custom networking outside Docker's normal path.

**Overlay** connects containers across multiple Docker hosts, not just within one. It's essential for Swarm clusters, where containers on different physical or virtual machines need to talk to each other as if they were on the same network. Without overlay, multi-host container communication doesn't work out of the box.

## Why interviewers ask this

This question separates people who memorized a list from people who've actually had to debug a networking issue in production. Interviewers want to hear you reason about tradeoffs, isolation versus performance versus portability, rather than just recite definitions. It also signals whether you understand when host mode's performance gain is worth sacrificing portability for.

## Follow-ups to expect

**When would you actually use host mode in production?** When you've measured real latency or throughput overhead from bridge mode's NAT layer, typically for high-throughput proxies or network-intensive services, and you've accepted the portability cost.

**How does overlay networking relate to Swarm or Kubernetes?** Overlay is what makes multi-host container communication possible in Swarm; Kubernetes uses its own CNI-based networking model but solves a similar cross-host problem.

**What's the security implication of host mode?** It removes network namespace isolation, so a compromised container has direct access to the host's network interfaces, which is a meaningfully larger blast radius than bridge mode.

## The common wrong answer

Candidates usually list all four modes correctly but stop there, treating it as a vocabulary question. The weak answer never mentions that host mode breaks portability, or that overlay is specifically the one needed for multi-host clusters. Interviewers notice when someone can define the terms but can't say why you'd pick one over another on a real system.
