---
title: tcpdump vs Wireshark - Capture Network Traffic
description: Learn when to use tcpdump versus Wireshark for network debugging, and how senior engineers pair the two tools in production.
date: 2026-10-22
keywords: linux, devops interview questions, tcpdump vs wireshark, network troubleshooting tools, packet capture linux, tcpdump interview questions
category: linux
youtube: HHA_KcF1XMs
---

A service is dropping connections intermittently and the logs don't say why. Someone needs to look at the actual packets, and the interviewer wants to know you'd pick the right tool for where you're standing, not just reach for whichever one you learned first.

## The answer interviewers want

`tcpdump` is your production workhorse. It's lightweight, runs from the CLI, and has minimal overhead, which matters because you're often running it on a live host that's already under load. You use it to grab packets where the problem is actually happening, typically writing the capture to a file for later review.

Wireshark is built for deep analysis. It has a rich GUI, decodes protocols for you, and gives you a visual timeline of the traffic, which makes patterns and anomalies much easier to spot than scrolling through raw output.

The pattern experienced teams use: capture on production with `tcpdump`, then move that capture file somewhere safe and analyze it offline in Wireshark. You get the low overhead of a CLI tool where it counts, and the analytical power of a GUI tool where it counts.

## Why interviewers ask this

This question separates people who've only ever opened Wireshark on their laptop from people who've actually debugged a production network issue under time pressure. The interviewer is checking whether you understand the cost of running a heavy GUI tool on a prod box, and whether you know the standard workflow of capturing in one place and analyzing in another.

## Follow-ups to expect

**Why not just run Wireshark directly on the production server?** Because it's a heavier, GUI-based tool, and adding that kind of overhead to a host that's already struggling or handling live traffic is risky. `tcpdump` is the lighter option for grabbing the data in place.

**What do you do with the capture once you have it?** You pull it off the production host and open it in Wireshark offline, where you get protocol decoding and a visual timeline to actually dig into what happened.

**Would you ever skip Wireshark entirely?** For a quick, simple check you might just read `tcpdump` output directly on the box. Wireshark earns its place when you need deeper protocol-level analysis that's hard to do by eye in raw CLI output.

## The common wrong answer

Candidates often treat this as an either/or choice, picking whichever tool they personally prefer and defending it as universally better. That misses the point. The strong answer is that these tools serve different stages of the same workflow: capture lean on the production system, then analyze deeply somewhere else.
