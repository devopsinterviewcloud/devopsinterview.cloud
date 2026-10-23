---
title: DNS for DevOps - A, CNAME + TTL in 60 Seconds
description: A DevOps interview question on DNS basics: the difference between A records, CNAME, and TTL, and why TTL doesn't mean instant updates during cutovers.
date: 2026-10-22
keywords: networking, devops interview questions, DNS for DevOps, A record vs CNAME interview question, DNS TTL explained interview
category: networking
youtube: YAnysONJJas
---

A reader asks something that sounds basic but trips up a lot of engineers during a live migration: what actually happens when you lower a TTL before a cutover? This question shows up in DevOps and SRE interviews because DNS is one of those fundamentals everyone assumes they know until a production outage proves otherwise.

## The answer interviewers want

An `A` record points a name straight to an IP address. A `CNAME` record points a name to another name, which then resolves further. TTL (time to live) sets how long resolvers are allowed to cache that answer before they're supposed to ask again.

Production convention: use `A` records for root/apex domains, and `CNAME` for subdomains sitting behind a CDN or load balancer, since those targets can change IPs without you having to touch DNS.

The part that catches people out during cutovers: TTL is a suggestion, not a guarantee. Plenty of ISP resolvers and corporate DNS caches hold onto answers longer than the TTL says. So dropping your TTL to something low right before a migration doesn't mean the change propagates instantly everywhere. The safe move is to drop the TTL hours before the cutover, not minutes, and build in buffer time measured in hours rather than assuming a clean, immediate switch.

## Why interviewers ask this

They're checking whether you understand DNS as a caching system with uncooperative caches outside your control, not just a lookup table. This separates engineers who've actually managed a production cutover from people reciting record types from memory. It also signals whether you think ahead about rollback windows and blast radius before touching DNS in front of real traffic.

## Follow-ups to expect

**If TTL doesn't guarantee fast propagation, how do you actually plan a safe cutover?** Lower the TTL well in advance, hours before the change, and treat the old TTL value as the minimum time you need to wait for stale caches to clear, even after you've switched the record.

**Why use CNAME instead of just pointing everything with A records?** CNAME lets the thing behind the subdomain, like a CDN endpoint, change its underlying IPs freely without you having to update DNS records yourself.

**Can you set a CNAME on a root/apex domain?** The source doesn't go into that distinction directly, but the stated convention is A records for root domains and CNAME for subdomains, which is the safer default to state in an interview.

## The common wrong answer

Most candidates describe A and CNAME correctly but then claim that setting TTL to something like 60 seconds guarantees near-instant propagation during a migration. That's the exact trap that burns real migrations: some resolvers ignore or outlive your TTL, so the honest answer is to plan buffers in hours, not minutes, and lower TTL well ahead of time rather than treating it as an instant switch.
