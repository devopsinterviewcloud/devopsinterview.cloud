---
title: tcpdump in 60 Seconds - Capture Any Packet
description: How to capture and filter live traffic with tcpdump on Linux, the core commands, and why interviewers probe for -nn and basic filters.
date: 2026-10-22
keywords: linux, devops interview questions, tcpdump tutorial, tcpdump commands linux, tcpdump interview questions, linux networking interview
category: linux
youtube: Hga7nSq0egI
---

Most engineers have run plenty of `curl` commands and never once reached for tcpdump. But when an API is timing out or a service can't reach its database, packet capture is often the only way to prove where traffic is actually going. That's why interviewers bring it up: it's a quick check on whether you can debug below the application layer.

## The answer interviewers want

tcpdump reads packets off the wire in real time. Think of it as `grep` for network traffic - you're filtering a live stream instead of a static file.

Three commands cover most production debugging:

Capture everything on an interface:

```
tcpdump -i eth0
```

Filter by port, to isolate traffic for a specific service:

```
tcpdump -i eth0 port 80
```

Filter by host, to see everything going to or from one IP:

```
tcpdump -i eth0 host 10.0.0.5
```

That covers the vast majority of what you'll need day to day. Seniors almost always add `-nn` to these:

```
tcpdump -nn -i eth0 host 10.0.0.5
```

`-nn` skips DNS and port-name resolution, so you see raw IPs and port numbers immediately instead of waiting on slow reverse lookups - which matters a lot when the network itself is the thing that's degraded.

With these three filters, you can trace an API failure down to whether packets are leaving the box, reaching the destination, or never showing up at all.

## Why interviewers ask this

This is a fast way to separate people who've only worked at the application layer from people who've actually debugged a live production incident. A candidate who can describe capturing, filtering, and reading raw packet output has clearly been in the position of not trusting the app logs anymore. It also signals whether someone understands why DNS resolution during a capture is a problem, not just a flag to memorize.

## Follow-ups to expect

**How would you capture only the first few packets instead of letting it run forever?** You'd want a way to cap the capture so it doesn't flood your terminal or disk, especially on a busy interface.

**Why does `-nn` matter specifically during an incident?** Because DNS lookups add latency and can themselves be the thing that's broken - resolving names while you're trying to diagnose a network issue can slow down or even hang your capture.

**How would you combine a port filter and a host filter together?** You'd chain the two expressions so you isolate traffic for one service going to or from one specific host, cutting out noise from everything else on the interface.

## The common wrong answer

Candidates who've never run tcpdump tend to describe it in the abstract - "you'd check the network layer" - without naming a single flag or filter. Others know the tool exists but only mention capturing everything on an interface, which drowns you in noise and misses the point: the skill being tested is filtering down to the exact traffic that matters, fast, with `-nn` so you're not waiting on resolution while production is down.
