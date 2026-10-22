---
title: Feature Stores - 3 Reasons Your ML Pipeline Needs One
description: Why use a feature store in an ML pipeline? Training-serving skew, duplicate feature work, and lineage gaps, plus Feast vs Tecton tradeoffs.
date: 2026-10-22
keywords: mlops, devops interview questions, feature store mlops, feature store interview question, mlops interview questions for experienced, ml pipeline interview questions
category: mlops
youtube: 4h5ghrSNgFM
---

A model that was accurate in validation quietly degrades in production with no code changes anywhere. That's usually a feature problem, not a model problem, and it's why interviewers probe feature stores instead of letting you coast on the word "reusability."

## The answer interviewers want

Most candidates answer "reusability" and stop. That's not wrong, it's just shallow. There are three concrete reasons a feature store earns its place in an ML pipeline:

**Training-serving skew.** Your training pipeline computes a feature one way, usually in batch, and your serving code computes the same logical feature differently, usually in a low-latency online path. The two implementations drift apart. There's no error, no exception, no failed deploy. The model just gets quietly worse because it's seeing features at inference time that don't match what it learned from.

**Duplicate work.** Without a shared feature layer, every team on every project recomputes the same underlying signals, like user activity windows or aggregated spend. That's wasted engineering time and a second source of divergence between teams' definitions of the "same" feature.

**No lineage.** When a model's performance shifts, nobody can say which exact feature version it was trained on. You can't debug what you can't trace back.

On tooling: `Feast` is free and open source, but you own the operational burden of running it. `Tecton` costs money but handles the hard infrastructure problems for you. The right pick depends on your team's size and operational capacity, not on which one is trending.

## Why interviewers ask this

This question filters for engineers who've actually debugged a production model, not just trained one in a notebook. Anyone can recite "reusability." Interviewers want to hear that you understand feature stores solve a correctness problem (skew), an efficiency problem (duplication), and an auditability problem (lineage), and that you can reason about build-vs-buy tradeoffs instead of defaulting to whatever tool is popular.

## Follow-ups to expect

**How would you detect training-serving skew before it hits production?** Compare feature distributions and computation logic between the offline and online paths directly, since the failure is silent and won't show up as an error.

**When would you choose Feast over Tecton, or vice versa?** Choose based on team size and operational capacity: Feast if you can own the infrastructure yourself, Tecton if you'd rather pay to offload the hard operational parts.

**What's the business cost of no lineage?** You lose the ability to tie a performance regression back to a specific feature version, which turns debugging into guesswork.

## The common wrong answer

The typical miss is stopping at "reusability" and treating the feature store as a convenience layer. That framing misses that the real risks are a silent accuracy killer (skew) and an accountability gap (lineage), both of which matter far more than saving a few lines of duplicated code.
