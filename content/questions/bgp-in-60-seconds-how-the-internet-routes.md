---
title: BGP in 60 Seconds - How the Internet Routes
description: How BGP actually routes internet traffic, why it ignores latency, and how hijacks like the Pakistan Telecom incident happen.
date: 2026-10-22
keywords: networking, devops interview questions, BGP explained, how does BGP work, border gateway protocol interview questions, networking interview questions
category: networking
youtube: AYnw6C8jAFw
---

Candidates walk into networking rounds assuming routing is about speed. It isn't, and interviewers use BGP questions to find out if you understand that the internet runs on trust and policy, not performance. This comes up constantly in SRE and platform interviews because outages caused by route leaks and hijacks are common enough that someone on your team will eventually have to explain one.

## The answer interviewers want

The internet does not pick the fastest path for your traffic. Not even close. BGP, the Border Gateway Protocol, doesn't care about latency at all. It routes based on policy: who you peer with, who you pay, and who you trust.

Every AS (Autonomous System) announces the routes it claims to own. Other networks accept those announcements largely on faith. One bad announcement, like the Pakistan Telecom hijack, and traffic for half the internet can vanish or get rerouted somewhere it was never meant to go.

Here's the part most people gloss over: BGP shipped with zero built-in security. There was no origin validation baked into the original protocol. RPKI (Resource Public Key Infrastructure) exists now to validate route origins, but adoption is uneven. Most networks still don't bother configuring it. That gap is why BGP breaks the internet as often as it routes it.

## Why interviewers ask this

This question screens for whether you understand that internet routing is a trust-based system, not an optimization engine. It also tests whether you can explain how a misconfiguration at one AS cascades into an outage for networks that had nothing to do with the mistake. Interviewers want to see you connect protocol design (policy-based, no built-in auth) to real-world failure modes, not just recite that "BGP stands for Border Gateway Protocol."

## Follow-ups to expect

- **What is a route hijack, in plain terms?** An AS announces that it owns IP space it doesn't actually control, and because BGP accepts announcements on trust, other networks start sending that traffic to the wrong place.
- **What does RPKI actually fix, and what doesn't it fix?** RPKI lets a network cryptographically validate that an AS is authorized to announce a given prefix, which helps catch bogus origin announcements. It doesn't fix path validation or attacks where the origin is legitimate but the path is manipulated, and it only works where networks actually deploy it.
- **Why would a company choose a worse-performing route on purpose?** Because BGP path selection is driven by peering agreements and cost, not latency, so a cheaper or contractually preferred path can win over a faster one.

## The common wrong answer

Most candidates describe BGP as if it's a shortest-path or lowest-latency routing protocol, confusing it with something like OSPF inside a single network. They'll say "BGP finds the best route to a destination" without qualifying that "best" means cheapest or most policy-compliant, not fastest. They also tend to treat the Pakistan Telecom-style hijack as a historical curiosity instead of a structural risk that exists because BGP trusts announcements by default and most networks still skip RPKI validation.
