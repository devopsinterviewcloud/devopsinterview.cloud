---
title: Keepalive vs Timeout - Tune TCP for Production
description: Explains how mismatched keepalive and load balancer idle timeout settings cause silent connection drops and phantom 502s.
date: 2026-10-22
keywords: networking, devops interview questions, tcp keepalive vs timeout, tcp tuning production, networking interview questions
category: networking
youtube: PaVEQFWJGa0
---

A connection that looks healthy in your app logs but quietly dies somewhere between the load balancer and the backend is one of the most common "ghost" bugs in production networking. Interviewers ask about TCP keepalive versus idle timeout because the gap between the two is exactly where those ghosts live, and it separates people who've only read about TCP from people who've debugged it at 2AM.

## The answer interviewers want

Keepalive and idle timeout sound related but they're opposite actors. Keepalive is your application (or the OS on its behalf) sending a heartbeat probe to keep a connection alive during quiet periods. Idle timeout is your load balancer deciding the opposite: silence for N seconds, and it closes the connection.

The failure mode is simple arithmetic gone wrong. If your keepalive fires every 90 seconds but the load balancer's idle timeout is 60 seconds, the LB cuts the connection before your app ever sends its next heartbeat. The connection dies silently, and the next request on that socket fails.

The fix depends on the LB. An NLB, firewall or NAT gateway counts TCP keepalive probes as activity, so set `net.ipv4.tcp_keepalive_time` below its idle timeout (`tcp_keepalive_intvl` is the gap between retry probes, and the socket must enable `SO_KEEPALIVE`). An AWS ALB only resets its 60 second default on real data, so long connections through it need app-level heartbeats.

The part most candidates miss is that the load balancer isn't the only layer with its own idle timeout. Your app server has one too (nginx, Gunicorn, all of them), and behind an ALB it has to outlast the LB's, or the backend closes a connection the LB is about to reuse. Get that order wrong across the LB, the app server and anything in between, and you get intermittent, hard-to-reproduce 502s that eat an entire Friday night.

## Why interviewers ask this

This question checks whether you think about connections as a chain of independent timers rather than a single setting. It's really a proxy for how you'd debug "random" connection drops in production: do you reach for the LB config and app server config first, or do you start guessing at application code.

## Follow-ups to expect

- **What's the first thing you'd check when you see intermittent 502s on a load balancer?** Check the LB's logs to see whether the 502s come from the targets, then compare the backend's HTTP keep-alive timeout with the LB's idle timeout, since a backend that closes idle connections first is the classic cause.
- **How many places in a typical stack can have their own idle timeout?** At least three: the load balancer, the application server (nginx, Gunicorn, etc.), and anything stateful in between like a firewall or NAT gateway. They don't need to match, they need the right order.
- **What's a safe rule of thumb for setting keepalive relative to the LB's timeout?** Keep heartbeats comfortably below the LB's idle timeout rather than just barely under it, but set the backend's HTTP keep-alive timeout above it. And check whether your LB counts TCP probes at all; an ALB doesn't.

## The common wrong answer

Most candidates either say keepalive and idle timeout are basically the same mechanism, or they describe keepalive correctly but stop at the OS level, as if tuning `net.ipv4.tcp_keepalive_time` alone fixes everything. They miss that the load balancer and the app server each enforce their own independent idle timeout, and that these drops come from how those timers relate to each other, not from a single misconfigured sysctl.
