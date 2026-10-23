---
title: Spot Instances for CI/CD - Save 90% on Build Costs
description: How to cut CI/CD build costs with spot instances, fallback strategies, and mixed instance pools, explained for DevOps interviews.
date: 2026-10-22
keywords: finops, devops interview questions, spot instances ci/cd, aws spot instances jenkins, ci/cd cost optimization
category: finops
youtube: 15qzbKhpIN0
---

CI minutes add up fast, especially once a team scales out parallel test suites across dozens of ephemeral runners. Interviewers bring this up because cost control is now a standard part of the platform engineer's job, not something finance handles alone.

## The answer interviewers want

Spot instances are EC2 machines that AWS sells at up to 90% off on-demand pricing when it has spare capacity sitting idle. CI workloads are a near-perfect match for this: builds are short-lived, stateless, and retryable, so losing one to a reclaim notice is an inconvenience, not a disaster.

The pattern is to configure your Jenkins agents or GitHub Actions self-hosted runners to launch on spot capacity by default, with a fallback to regular on-demand instances if spot capacity isn't available or gets interrupted mid-build. That fallback path is what keeps the pipeline reliable even when spot pools dry up in a given region or AZ.

The part worth emphasizing in an interview: don't just pin builds to one instance type in one availability zone. Use mixed instance types and spread across multiple availability zones. This reduces interruption risk significantly, by around 80% according to common guidance, because you're no longer dependent on a single spot pool's capacity swings. If `c5.xlarge` in `us-east-1a` gets reclaimed, your autoscaler can still pull `c5.2xlarge` or `m5.xlarge` in `us-east-1b` without falling all the way back to full-price compute.

## Why interviewers ask this

This question checks whether you think about cost as a first-class engineering constraint, not an afterthought. It also tests whether you understand the tradeoff between cheap compute and reliability, and whether you can design around interruptions instead of just hoping they don't happen.

## Follow-ups to expect

**What happens to a build when the spot instance gets reclaimed mid-run?** The fallback logic should retry the build on a regular on-demand instance so the pipeline doesn't just fail outright.

**Why mix instance types and AZs instead of picking the cheapest single option?** A single instance type in a single AZ is a single point of failure for spot capacity; diversifying across types and zones spreads that risk and cuts interruption frequency substantially.

**Would you run spot for every stage of the pipeline?** The source pattern is built around build workloads specifically, since they're short-lived and safely retryable, which is exactly the profile that tolerates spot interruptions well.

## The common wrong answer

Candidates often say "just use spot instances for everything" without mentioning a fallback path or instance diversification. That answer sounds cost-conscious but ignores the reliability side entirely, which is the half of the question interviewers actually care about.
