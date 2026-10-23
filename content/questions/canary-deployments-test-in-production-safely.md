---
title: Canary Deployments - Test in Production Safely
description: How to explain canary deployments in a DevOps interview: traffic splitting, monitoring, and why rollback testing matters most.
date: 2026-10-22
keywords: cicd, devops interview questions, canary deployment, canary deployment interview questions, canary deployment kubernetes, blue green vs canary deployment
category: cicd
youtube: Zd4OQrGVYNk
---

A load balancer or service mesh splits traffic between an old stable version and a new risky one, letting you catch problems before they hit every user. Interviewers ask about this because it's one of the fastest ways to tell who has actually run a progressive rollout and who has only read about one.

## The answer interviewers want

A canary deployment splits live traffic between the current stable version and a new version, so you can test changes against real production load without exposing every user to the risk at once. A typical pattern starts small: route something like 5% of traffic to the new code and watch it closely before increasing that percentage.

To do this in practice you need two pieces working together. First, a traffic-splitting layer like Istio (for service mesh setups) or an ALB (for simpler load-balancer-based routing) that can direct a defined percentage of requests to the new version. Second, monitoring dashboards that track error rates and response times in near real time, since the whole point of a canary is to catch regressions before they reach full rollout.

The part candidates usually skip: always test your rollback mechanism before you need it. Plenty of teams build the canary pipeline, wire up the traffic split and the dashboards, and never once practice pulling the emergency brake. If the rollback path has never been exercised, you don't actually have a safety net, you have a hope. Verifying rollback first is what turns a canary deployment into something you can trust at 3am without a panic call.

## Why interviewers ask this

This question separates people who can describe a diagram from people who have operated one under pressure. Anyone can say "split traffic and monitor it" - the signal interviewers are after is whether a candidate treats rollback as a first-class, pre-tested part of the process rather than an afterthought they'll figure out during an incident.

## Follow-ups to expect

**What metrics would you watch during a canary rollout, and why those?** Error rates and response times are the baseline, because they're the fastest indicators that the new version is behaving worse than the stable one under real traffic.

**What would make you decide to roll back versus push forward?** If the canary's error rate or latency degrades against the baseline version, that's the trigger to roll back rather than continue increasing traffic.

**How would you test a rollback mechanism before relying on it in production?** Treat rollback as something you rehearse deliberately before a real deployment, not something you assume will work because the forward path works.

## The common wrong answer

Most candidates describe the traffic-splitting mechanics in detail - percentages, load balancers, maybe even specific tools - and stop there, as if a working forward path is the whole answer. They rarely mention verifying the rollback mechanism, which is exactly the gap that turns a routine canary into a 3am incident when the untested emergency brake doesn't actually stop the bleeding.
