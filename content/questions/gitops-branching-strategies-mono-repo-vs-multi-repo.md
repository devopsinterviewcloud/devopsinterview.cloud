---
title: GitOps Branching Strategies - Mono-Repo vs Multi-Repo
description: Mono-repo vs multi-repo GitOps: how to answer this interview question using team structure and Conway's Law.
date: 2026-10-22
keywords: gitops, devops interview questions, gitops interview questions, gitops mono repo vs multi repo, gitops repository strategy interview
category: gitops
youtube: uCGgAr62rYs
---

GitOps architecture questions sound like a tooling preference debate, but interviewers use them to check whether you think about organizational structure before infrastructure structure. This question shows up constantly in platform and SRE interviews because the "right" answer depends on context, not on which option sounds more modern.

## The answer interviewers want

There isn't a universally correct choice between mono-repo and multi-repo for GitOps. Each fits a different organizational shape.

Mono-repo works when teams are small and trust is high. Everything lives in one place, cross-team changes are easier to make and review, and your tooling stays simpler because you're not coordinating state across multiple repos.

Multi-repo shines with larger teams or strict security boundaries. Each team owns its own repo, blast radius is smaller when something breaks, and access control is more granular since you're not granting broad permissions across unrelated services.

The part most candidates miss: your org structure determines your GitOps structure. Conway's Law applies to infrastructure the same way it applies to software systems. If your teams are organized as independent, loosely coupled units, a multi-repo setup will mirror that and feel natural. If your teams work tightly together with shared ownership, mono-repo will reduce friction instead of adding it. Pick based on how your organization actually operates, not based on which pattern sounds more sophisticated in a blog post.

## Why interviewers ask this

They want to see if you can connect infrastructure decisions to organizational reality instead of reciting a trend. Anyone can list pros and cons of mono-repo versus multi-repo; fewer candidates can explain why the "right" answer changes depending on team size, trust level, and security requirements. This question also screens for Conway's Law awareness, which signals systems thinking beyond just YAML and pipelines.

## Follow-ups to expect

**How would you migrate from multi-repo to mono-repo, or vice versa, without downtime?** Focus on the fact that this is really an organizational change wrapped in a tooling change, so sequencing access control and ownership boundaries matters as much as the repo mechanics.

**What happens to blast radius if you pick mono-repo for a large, loosely coupled org?** A bad change or bad merge can affect teams that had nothing to do with it, which is exactly the tradeoff the source highlights for larger or security-sensitive organizations.

**How does this decision affect access control?** Multi-repo gives you granular, per-team permissions naturally; mono-repo requires you to build that granularity on top of a single repo, which adds tooling complexity.

## The common wrong answer

Most candidates answer this as a pure technical preference, confidently defending mono-repo or multi-repo as the better pattern in isolation. That misses the actual point: the correct structure is derived from your team's size, trust level, and security needs, not from which pattern is trending. Candidates who skip the Conway's Law connection usually get follow-up questions that expose the gap.
