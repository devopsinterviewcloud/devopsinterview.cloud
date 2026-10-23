---
title: Feature Flags - Deploy Without Releasing
description: How feature flags decouple deployment from release, used as DevOps interview prep for risk management and kill switch design questions.
date: 2026-10-22
keywords: cicd, devops interview questions, feature flags interview questions, feature flags vs feature toggles, deploy without releasing devops, cicd interview questions
category: cicd
youtube: 6fHI-qBGq5s
---

You push code Friday evening and your boss asks why users still can't see the new feature. That's not a bug, that's the point. Interviewers ask about this because it tests whether you understand the difference between deploying code and releasing a feature, which is one of the core risk-management ideas in modern CI/CD.

## The answer interviewers want

Feature flags work like light switches for your code. The feature exists in production, fully deployed, but stays hidden until someone flips the switch. In practice this means wrapping new functionality in conditional logic that checks a flag service at runtime, something like:

```python
if flag_service.is_enabled("new-checkout-flow", user):
    run_new_checkout()
else:
    run_old_checkout()
```

You can build this with a managed service like `LaunchDarkly` or `Flagsmith`, or keep it simple with a database table that your app checks. Either way, the deploy and the release become two separate events. Shipping the code is low risk because nothing changes for users until you decide to turn it on.

What a lot of candidates miss is that flags aren't just for gating new features. They also work as kill switches. If a newly released feature starts causing errors or a dependency goes down, you flip the flag off and the system falls back to the old path instantly, no rollback, no redeploy, no waiting on a pipeline.

## Why interviewers ask this

They're checking whether you think about deploys as low-risk, reversible events instead of all-or-nothing releases. It also reveals whether you understand incident response beyond "revert the commit and redeploy," which is often too slow when something is actively breaking in production.

## Follow-ups to expect

**How is this different from just using a feature branch until it's ready?** Branches delay the deploy itself, which means long-lived branches and painful merges. Flags let you merge and deploy continuously while still controlling exposure, which keeps the deploy pipeline simple and frequent.

**What would you use a kill switch for beyond new features?** Anything you'd want to disable instantly without a deploy: a flaky third-party integration, an expensive query path, a new caching layer. The flag check needs to be cheap and the flag service needs to be reliable, since it's now part of your incident response path.

**What's the tradeoff of using a simple database table versus a dedicated flag service?** A database table is easy to stand up and fine for low flag volume, but you lose things like targeting rules, gradual rollout percentages, and a dashboard non-engineers can use. A service like LaunchDarkly or Flagsmith costs more but gives you that tooling out of the box.

## The common wrong answer

Most candidates describe feature flags purely as an A/B testing or gradual-rollout tool and stop there. They miss the kill switch angle entirely, which is usually the part interviewers care about most, since it's the difference between "we deployed carefully" and "we can recover in seconds when deployment goes wrong."
