---
title: Azure Policy - Enforce Compliance at Scale
description: How to use Azure Policy, initiatives, and management group scope to enforce compliance across subscriptions without manual checks.
date: 2026-10-22
keywords: azure, devops interview questions, azure policy interview questions, azure policy compliance explained, azure policy for experienced engineers, azure governance interview questions
category: azure
youtube: 7cvodOv62yU
---

A reader asks how you keep hundreds of Azure subscriptions compliant without chasing every team down for tagging and config fixes. It's a common interview question because it separates people who know Azure Policy exists from people who've actually assigned one and dealt with the gaps it leaves behind.

## The answer interviewers want

Juniors tag resources manually. Seniors enforce it automatically, and the tool for that in Azure is Azure Policy.

You assign a policy and pick an effect:

- `Deny` blocks non-compliant resources at creation time.
- `Audit` just flags them, it doesn't stop anything.
- `DeployIfNotExists` auto-remediates by deploying the missing configuration.

Instead of assigning policies one by one, you group related policies into an **Initiative** - the CIS benchmark is a built-in example of this. You assign the initiative once at the Management Group scope, and it cascades down to every subscription underneath that group. That's how you cover hundreds of subscriptions without touching each one individually.

The part most people miss: assigning a policy does not retroactively fix resources that already exist. Policy with `DeployIfNotExists` or `Deny` only governs what happens going forward. If you don't trigger a remediation task manually, you end up with a dashboard that looks clean while actually hiding months of drift on everything created before the policy was assigned.

## Why interviewers ask this

This question tests whether you understand governance as an ongoing control loop, not a one-time setup. Anyone can say "we use Azure Policy." The signal interviewers are after is whether you know the difference between effects, understand scope inheritance through management groups, and - critically - know that remediation is a separate manual (or automated) step. That last part is where most candidates fall apart, and it's exactly the kind of gap that causes real audit failures.

## Follow-ups to expect

**When would you use `Audit` instead of `Deny`?** Audit is useful when you need visibility first, like rolling out a new standard without breaking existing pipelines or blocking teams outright before they've had a chance to adapt.

**How do you handle resources created before the policy existed?** You trigger a remediation task against the policy assignment so `DeployIfNotExists` effects get applied retroactively; without that step those resources stay non-compliant indefinitely.

**Why assign at the Management Group level instead of per-subscription?** Because the assignment cascades to every subscription underneath, so you get consistent enforcement without having to repeat the assignment hundreds of times.

## The common wrong answer

Most candidates describe Azure Policy correctly at a surface level - define a rule, assign it, done - but assume that assigning the policy instantly fixes everything in the environment. They don't mention remediation tasks at all. That gap is the tell: it means they've read about Policy but never actually had to explain, in a postmortem, why a dashboard said "compliant" while a dozen storage accounts were still publicly exposed.
