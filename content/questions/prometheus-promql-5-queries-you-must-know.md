---
title: Prometheus PromQL - 5 Queries You Must Know
description: How to answer PromQL interview questions: the five query patterns for counters, latency, aggregation, and silent failures.
date: 2026-10-22
keywords: observability, devops interview questions, promql queries you must know, promql interview questions, prometheus promql tutorial, prometheus interview questions
category: observability
youtube: ckqsGgY2_4A
---

PromQL questions in a DevOps or SRE interview rarely ask you to recite functions from the documentation. They ask you to write a query on a whiteboard or shared screen, and the interviewer is watching whether you reach for patterns you've actually used in production or start guessing at syntax.

## The answer interviewers want

The trap is thinking PromQL mastery means memorizing every function in the docs. It doesn't. In practice, almost every PromQL interview question maps to one of five patterns: counters, latency, aggregation, forecasting, and absence.

In production, the queries you actually write are:

- **Counters**: `rate(http_requests_total[5m])` to get a per-second request rate over a five-minute window.
- **Latency**: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` to pull your p99 off the bucket sums.
- **Aggregation**: `sum by (service) (...)` to roll metrics up for team-level dashboards.
- **Forecasting**: trend-projection queries that let you see where a metric is headed, not just where it is now.
- **Absence**: `absent()` to catch a scrape target that died silently.

The absence pattern is the one most candidates miss. A metric that stops reporting doesn't breach any threshold, so a normal alert on that metric never fires. `absent()` exists specifically to catch that silent failure mode. The interview isn't testing whether you know fifty functions. It's testing whether you know these five query shapes and when each one applies.

## Why interviewers ask this

This question separates people who've read the PromQL docs from people who've actually run dashboards and alerts in production. Anyone can look up a function signature. Knowing that a dead scrape target is invisible to normal alerting, and that `absent()` is the fix, only comes from having been burned by it or having built alerting rigorously enough to think about it in advance.

## Follow-ups to expect

**Why would a missing metric not trigger a normal alert?** Because threshold-based alerts evaluate the value of a time series, and if the series doesn't exist, there's nothing to evaluate against. The target can be down for hours with zero signal unless you're explicitly checking for absence.

**How do you compute p99 latency from a histogram?** Use `histogram_quantile(0.99, ...)` over the rate of your `_bucket` series summed by `le`, since quantiles are derived from the bucket boundaries, not raw samples.

**Why aggregate with `sum by (service)` instead of just `sum()`?** `sum()` alone collapses everything into one number and loses which service is responsible; `by (service)` keeps the label so the dashboard stays actionable per team.

## The common wrong answer

Most candidates try to answer this by listing PromQL functions alphabetically or reciting documentation, which makes them look like they crammed the night before. The stronger answer organizes the knowledge around the five real-world patterns and explains why each one matters operationally, especially the absence case, which is the one piece of the puzzle that isn't obvious until you've been paged for a dashboard that quietly went blank.
