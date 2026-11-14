---
title: FinOps Maturity Model - Crawl Walk Run
description: FinOps maturity model explained: Crawl, Walk, and Run stages, why many orgs stall in Walk, and how to answer this in a DevOps interview.
date: 2026-10-22
keywords: finops, devops interview questions, finops maturity model, finops interview questions, cloud cost optimization interview, finops crawl walk run
category: finops
youtube: y8R-TTaiQFU
---

A cloud bill that doubles every quarter is one of the most common opening lines in a FinOps interview. The interviewer isn't just checking if you know the jargon. They want to know if you understand why cost control usually fails as an organizational problem, not a tooling problem.

## The answer interviewers want

The FinOps maturity model has three stages: Crawl, Walk, and Run. You rate each capability separately (allocation, forecasting, anomaly management and so on), not the whole org at once.

**Crawl** is reactive. There's very little reporting or tooling, basic processes are defined but not every team follows them. Teams find out about a cost spike because someone noticed the invoice, not because anything caught it early.

**Walk** is where process gets built. The capability is understood and followed across the org, and automation or process covers most of what it needs. Budgets and alerts warn teams before a number gets out of hand, and real ownership of spend starts to form.

**Run** is where every team follows the capability, the hard edge cases get worked, and automation is the preferred approach. For optimization that can mean automated rightsizing, but the stage is defined by adoption and automation, not by a particular tool.

The detail that actually matters in an interview: Walk is a fine place to stop for some capabilities, but a lot of organizations stall there on the ones that need more. They have the dashboards, they have budgets and alerts configured, but nothing moves when the alerts fire. The reason isn't technical. They skip the cultural change. Alerts firing into a channel nobody acts on isn't FinOps maturity, it's just a louder version of Crawl. Getting to Run requires engineering teams to actually own their cost numbers the way they own uptime or latency, and that's an organizational shift, not a dashboard you buy.

## Why interviewers ask this

This question separates people who've memorized a framework from people who've seen it fail in practice. Anyone can recite Crawl, Walk, Run. The interviewer is really listening for whether you understand that tooling alone doesn't move an org between stages, and whether you can name the actual blocker: culture and ownership, not missing dashboards.

## Follow-ups to expect

**"Why do so many orgs stall in Walk instead of reaching Run?"** Because they treat FinOps as a reporting function instead of an engineering responsibility. The budgets and alerts exist, but no one's job depends on acting on them.

**"What's the difference between a Walk-stage alert and a Run-stage response?"** In Walk, detection is automated and the alert gets routed to the team that owns the spend. In Run, automation can suggest or apply the fix, urgent alerts flow into ticketing, and each resolution is recorded to tune future alerts.

**"How would you move a team from Walk to Run?"** Start by making cost a shared metric engineering teams are accountable for, not just something finance reports on, then layer automation on top of that ownership.

## The common wrong answer

Candidates often answer this by listing tools, naming a cost dashboard product for Crawl, a budgeting tool for Walk, and an ML rightsizing platform for Run, as if buying the right software automatically advances maturity. That misses the point entirely. The model is about process and ownership maturing over time; the tools are just what each stage happens to use, not what causes the progression.
