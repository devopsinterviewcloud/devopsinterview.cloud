---
title: SOC2 for DevOps - What You Actually Need
description: Learn which SOC2 trust principles DevOps teams own and the controls auditors actually check for: RBAC, immutable infra, GitOps.
date: 2026-10-22
keywords: compliance, devops interview questions, soc2 compliance devops, devops soc2 requirements, soc2 audit preparation, devops compliance interview
category: compliance
youtube: 9m6Yr9bj6WM
---

A SOC2 audit is coming up, and someone on the platform team gets asked to explain what controls actually apply to them. This question shows up in DevOps and SRE interviews because compliance work increasingly lands on infrastructure teams, not just security, and most candidates have never thought through which SOC2 principles are actually theirs to own.

## The answer interviewers want

SOC2 is built around five trust principles, but DevOps doesn't own all five. The three that land squarely on infrastructure and platform teams are security, availability, and processing integrity.

In practice, that breaks down into three concrete areas of work:

- **RBAC for all systems.** Every tool in the stack, not just production, needs role-based access control. Auditors want to see that access is scoped and provable, not just "everyone on the team has admin."
- **Immutable infrastructure changes.** Changes to infrastructure shouldn't be made by hand on a live system. They should go through a defined, repeatable process that leaves a record of what changed and when.
- **Continuous monitoring with alerting.** Availability and processing integrity both depend on knowing when something breaks, not finding out from a customer.

The part most people miss: auditors love GitOps setups specifically because every infrastructure change already has an audit trail built in. If your changes flow through pull requests and `git` history instead of manual `kubectl apply` commands run from someone's laptop, you've effectively pre-built your audit evidence. That's not a side benefit of GitOps, it's one of the main reasons it maps so cleanly onto SOC2 requirements.

## Why interviewers ask this

This question separates people who've only heard the word "compliance" from people who've actually sat through an audit. Interviewers want to know you understand that SOC2 isn't a security team problem dropped on DevOps at the last minute, it's a set of controls that should already be baked into how the team ships changes. They're also checking whether you can translate a compliance principle into a concrete engineering practice, not just recite a trust principle name.

## Follow-ups to expect

**"How would you prove RBAC is actually enforced, not just configured?"** You'd point to access reviews and logs showing permission changes and usage over time, not just a policy document stating what roles exist.

**"Why does GitOps help specifically with processing integrity?"** Because changes go through a defined pipeline with review and history, there's a consistent, traceable record that the system processed changes the way it was supposed to.

**"What happens if a team is still doing manual infrastructure changes?"** That's usually the first thing an auditor flags, since manual changes break the audit trail and make it hard to prove when and how something was modified.

## The common wrong answer

Candidates often answer this by naming all five SOC2 trust principles and explaining each one generically, which signals they've read a compliance overview but never implemented controls themselves. The weaker answer also treats SOC2 as a one-time audit checklist rather than something reflected in daily engineering practice, missing the point that most DevOps teams fail their first audit precisely because these controls weren't built in from the start.
