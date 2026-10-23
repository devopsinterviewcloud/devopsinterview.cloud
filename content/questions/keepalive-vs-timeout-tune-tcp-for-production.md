---
title: Keepalive vs Timeout - Tune TCP for Production
description: Explains how mismatched TCP keepalive and load balancer idle timeout settings cause silent connection drops and phantom 502s.
date: 2026-10-22
keywords: networking, devops interview questions, tcp keepalive vs timeout, tcp tuning production, networking interview questions
category: networking
youtube: PaVEQFWJGa0
---

A connection that looks healthy in your app logs but quietly dies somewhere between the load balancer and the backend is one of the most common "ghost" bugs in production networking. Interviewers ask about TCP keepalive versus idle timeout because the gap between the two is exactly where those ghosts live, and it separates people who've only read about TCP from people who've debugged it at 2AM.

## The answer interviewers want

Keepalive and idle timeout sound related but they're opposite actors. Keepalive is your application (or the OS on its behalf) sending a heartbeat probe to keep a connection alive during quiet periods. Idle timeout is your load balancer deciding the opposite: silence for N seconds, and it closes the connection.

The failure mode is simple arithmetic gone wrong. If your keepalive fires every 90 seconds but the load balancer's idle timeout is 60 seconds, the LB cuts the connection before your app ever sends its next heartbeat. The connection dies silently, and the next request on that socket fails.

The fix: set your keepalive interval below your LB's idle timeout, not above it. AWS ALB defaults to a 60 second idle timeout, so a safe keepalive setting is 45 seconds or lower. On Linux, this is tuned through `net.ipv4.tcp_keepalive_time` and `tcp_keepalive_intvl`.

The part most candidates miss is that the load balancer isn't the only layer with its own idle timeout. Your app server has one too - nginx, Gunicorn, all of them. Stack three mismatched timeouts across the OS, the LB, and the app server, and you get intermittent, hard-to-reproduce 502s that eat an entire Friday night.

## Why interviewers ask this

This question checks whether you think about connections as a chain of independent timers rather than a single setting. It's really a proxy for how you'd debug "random" connection drops in production: do you reach for the LB config and app server config first, or do you start guessing at application code.

## Follow-ups to expect

- **What's the first thing you'd check when you see intermittent 502s on a load balancer?** Compare the keepalive interval against the LB's idle timeout before looking anywhere else, since that mismatch is the classic root cause.
- **How many places in a typical stack can have their own idle timeout?** At least three: the OS/TCP stack, the load balancer, and the application server (nginx, Gunicorn, etc.), and they all need to agree.
- **What's a safe rule of thumb for setting keepalive relative to the LB's timeout?** Set it comfortably below the LB's idle timeout rather than just barely under it, so timing jitter doesn't push you over the edge.

## The common wrong answer

Most candidates either say keepalive and idle timeout are basically the same mechanism, or they describe keepalive correctly but stop at the OS level, as if tuning `net.ipv4.tcp_keepalive_time` alone fixes everything. They miss that the load balancer and the app server each enforce their own independent idle timeout, and that production outages usually come from three mismatched values stacked on top of each other, not from a single misconfigured sysctl.
