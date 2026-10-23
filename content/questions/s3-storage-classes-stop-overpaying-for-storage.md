---
title: S3 Storage Classes - Stop Overpaying for Storage
description: How to answer the S3 cost optimization interview question: storage classes, lifecycle rules, and Intelligent Tiering explained.
date: 2026-10-22
keywords: finops, devops interview questions, s3 storage classes, s3 storage classes cost optimization, aws s3 cost reduction, s3 lifecycle policies
category: finops
youtube: N-PzMJSxtM0
---

S3 bills creep up quietly because nobody revisits storage class decisions after the initial setup. Interviewers bring this question up because it's a cheap way to check whether you actually think about cost, or whether you just throw everything into Standard and move on.

## The answer interviewers want

Three storage classes matter for this conversation. **Standard** for data you're actively reading and writing. **IA** (Infrequent Access) for data you touch maybe once a month. **Glacier** for archives you rarely, if ever, need to pull back.

The mechanism that makes this useful in practice is lifecycle rules. You set rules to auto-transition objects between classes based on age: move objects from Standard to IA after 30 days, and from IA to Glacier after 90 days. This way you're not manually auditing buckets or writing cron jobs to reclassify objects. S3 does it on a schedule you define once.

The other piece is **Intelligent Tiering**. Instead of you guessing at access patterns and setting fixed day thresholds, Intelligent Tiering monitors actual access and moves objects between tiers automatically based on real usage. The key detail worth stating out loud in an interview: it costs nothing extra if the objects don't move. You're not paying a tax for monitoring that doesn't result in any transition.

Put together, the answer is: pick the right class for the access pattern, automate the transitions with lifecycle rules, and use Intelligent Tiering when you don't know the access pattern in advance or when it varies.

## Why interviewers ask this

This question is a proxy for whether you treat cloud infrastructure as a cost center you actively manage or as a black box you just provision and forget. Anyone can say "use S3"; fewer candidates can explain the lifecycle mechanics that actually move the cost needle. It also signals whether you understand the trade-off between automation effort and manual tuning.

## Follow-ups to expect

**When would you choose lifecycle rules over Intelligent Tiering, or vice versa?** Lifecycle rules make sense when you already know the access pattern, like logs that are hot for 30 days then rarely touched. Intelligent Tiering fits when access patterns are unpredictable or inconsistent across objects.

**What's the risk of over-aggressive lifecycle transitions?** If you move data to Glacier too early and then need it back, retrieval can be slow and costly, so the 30/90-day thresholds should match your actual access reality, not a guess.

**How would you audit an existing bucket to find savings?** Start by checking which objects are sitting in Standard but haven't been accessed in months, then apply lifecycle rules or switch the bucket to Intelligent Tiering to let it self-correct going forward.

## The common wrong answer

Most candidates either say "just use Glacier, it's cheaper" without acknowledging retrieval costs and latency, or they describe Intelligent Tiering as a magic cost-cutter without mentioning that it only helps when access patterns genuinely vary. Both answers skip the lifecycle rule mechanics entirely, which is usually the part that shows you've actually configured this in a real account.
