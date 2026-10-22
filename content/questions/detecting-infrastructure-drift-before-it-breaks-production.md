---
title: Detecting Infrastructure Drift Before It Breaks Production
description: How to detect Terraform state drift before it breaks production: scheduled terraform plan checks, driftctl, and alerting strategy.
date: 2026-10-22
keywords: iac, devops interview questions, infrastructure drift, terraform drift detection, detect infrastructure drift terraform, iac interview questions
category: iac
youtube: g93Q2qx1jvU
---

One engineer clicks around in the console to fix something fast, and six hours later prod is down in a way nobody can explain. This is a staple IaC interview question because it tests whether you understand that infrastructure state can lie to you quietly, long before a deploy ever happens.

## The answer interviewers want

Drift means your live infrastructure no longer matches what's in your Terraform state. Someone clicks around in the console, a script runs outside your pipeline, an auto-scaling event changes something, and reality diverges from what your code says should exist.

The fix is continuous detection, not just careful deploys. Run `terraform plan` on a schedule, even when nobody's pushing changes, and treat any non-empty diff as a signal worth investigating. Tools like `driftctl` or Terraform Cloud's built-in drift detection can automate this instead of relying on someone remembering to check. Alert on any diff, don't wait for someone to notice behavior is off.

The key insight is timing: drift happens between deploys, not during them. Your CI/CD pipeline only checks state at the moment of apply. The gap between deploys is where drift accumulates silently, which is exactly why a point-in-time check isn't enough and you need something running continuously.

## Why interviewers ask this

This question separates people who understand Terraform as a one-time provisioning tool from people who understand it as an ongoing source of truth that needs active maintenance. Interviewers want to see that you think about infrastructure state as something that degrades over time without active defense, not something you set up once and forget. They're also checking if you connect drift to real incident causes, not just reciting terminology.

## Follow-ups to expect

**How often should the scheduled `terraform plan` run?** The source doesn't specify a fixed interval, but the logic is that it needs to run often enough to catch drift before it compounds into an outage, which argues for frequent, automated runs rather than occasional manual ones.

**What do you do once you detect drift?** Treat it as an incident worth investigating, not just a diff to auto-apply away, since the manual change that caused it might have been an emergency fix that encodes real information about what's happening in prod.

**How do you stop people from clicking in the console in the first place?** That's a prevention question separate from detection, but the practical answer tied to this approach is that locking down console access matters less if you're already catching drift continuously, since you'll see the result even when you can't see the action.

## The common wrong answer

Most candidates answer this by describing their CI/CD pipeline: code review, `terraform plan` in CI, `terraform apply` on merge. That's deploy-time safety, and it's necessary, but it says nothing about the days or weeks between deploys when drift actually accumulates. Interviewers notice when someone conflates "we validate changes before they ship" with "we detect when production has already changed without us." Those are different problems, and only one of them catches the kind of drift that causes a six-hour outage.
