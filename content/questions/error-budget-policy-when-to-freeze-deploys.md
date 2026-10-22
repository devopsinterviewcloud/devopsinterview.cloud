---
title: Error Budget Policy - When to Freeze Deploys
description: Learn when to freeze deploys based on error budget burn, with threshold examples and how SRE teams structure freeze policies.
date: 2026-10-22
keywords: sre, devops interview questions, sre interview questions, error budget policy interview, when to freeze deploys sre, site reliability engineering interview
category: sre
youtube: W8OxuUQbnH0
---

A service is burning through its error budget faster than expected, and the question is whether deploys should keep shipping. This comes up in SRE interviews because it tests whether you treat error budgets as a real operating mechanism or just a dashboard number nobody acts on.

## The answer interviewers want

Most teams freeze deployments at 50% error budget burn within a rolling window. For critical services, the threshold is tighter, often 25%, because the blast radius of a bad deploy is higher and the tolerance for added risk is lower.

A practical way to implement this as a graduated policy rather than a single on/off switch:

- At 25% burn: automated alerts fire, so the team is aware before things get worse.
- At 50% burn: deploys require manual approval instead of flowing automatically.
- At 75% burn: a hard freeze kicks in, blocking deploys outright.

Smart teams also distinguish *what* is being deployed, not just how much budget is left. Feature deploys, which add new risk and new surface area, are the ones that should actually be frozen. Bug fixes and reliability improvements can bypass the freeze, since they're reducing risk rather than adding it. A freeze that blocks the exact fix you need to stop burning budget defeats the purpose of having the policy.

## Why interviewers ask this

This question separates people who can recite "error budgets" as a buzzword from people who've actually operated one. Interviewers want to see that you understand error budgets as a feedback loop that changes team behavior, not just a reliability metric sitting in a Grafana panel. They're also probing whether you can design policy with nuance, like the feature-vs-fix distinction, instead of a blunt stop-everything rule.

## Follow-ups to expect

- **What counts as the rolling window?** The source doesn't specify an exact length, but the key point is that it's a rolling window, not a fixed calendar period, so a burst of errors ages out over time as the service stabilizes.
- **Who approves deploys during the 50% manual approval stage?** This is meant to add a human check, typically someone with context on the incident or the service, rather than blocking deploys entirely or letting them flow automatically.
- **How do you decide which deploys count as "bug fixes" that bypass a freeze?** The distinction is about risk direction: changes that reduce risk and are tied to resolving the current reliability issue should bypass, while anything adding new feature surface should wait.

## The common wrong answer

The most common mistake is treating the error budget as binary: either it's fine and everyone deploys, or it's gone and everything stops. Candidates who answer this way miss the graduated structure, alerting early, requiring approval in the middle, and only hard-freezing at a high threshold, and they almost never mention that not all deploys carry the same risk. Freezing bug fixes along with feature work is the kind of policy gap that turns an error budget incident into a longer outage.
