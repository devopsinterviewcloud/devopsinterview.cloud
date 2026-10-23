---
title: AWS Reserved Instances vs Savings Plans - Which to Choose?
description: RIs vs Savings Plans for AWS cost optimization: when to use each, how to combine them, and what interviewers listen for.
date: 2026-10-22
keywords: finops, devops interview questions, aws reserved instances vs savings plans, aws cost optimization interview questions, aws savings plans explained, reserved instances vs compute savings plans
category: finops
---

Cost optimization questions show up in almost every DevOps and SRE interview now, because cloud bills are a line item executives actually read. This one separates people who've skimmed an AWS pricing page from people who've actually managed a commitment portfolio.

## The answer interviewers want

Reserved Instances (RIs) and Savings Plans both trade commitment for discount, but they trade different things away.

RIs lock you to a specific instance type and region. You're committing to the infrastructure shape, not just the spend. That's fine if the workload is genuinely stable, but it's a liability if you're still iterating on instance families or might shift regions.

Savings Plans are flexible across compute services. A Compute Savings Plan covers `EC2`, `Lambda`, and `Fargate` under one usage commitment, measured in dollars per hour rather than instance type. You're committing to spend, not shape.

So the decision isn't "which one is better," it's "what are you actually trying to lock in."

- Use **Reserved Instances** for predictable, stable workloads that won't change in instance type or region for the life of the term.
- Use **Compute Savings Plans** when you need flexibility across `EC2`, `Lambda`, and `Fargate`, or when the workload shape might shift.

The part most candidates miss: these aren't mutually exclusive. A mature cost strategy combines both. Start with a Compute Savings Plan to cover your baseline usage, since that gives you a flexible floor of discount without betting on a specific instance type. Then layer Reserved Instances on top for the workloads you're certain won't change, your steady-state databases, your fixed-size worker fleets. That combination captures the discount on predictable spend while keeping room to move on everything else.

## Why interviewers ask this

This question filters for people who understand commitment as a risk management problem, not a pricing lookup. Anyone can recite "RIs are cheaper for stable workloads." Interviewers are checking whether you understand what you're actually giving up in exchange for the discount, and whether you've thought about layering strategies instead of picking one and walking away.

## Follow-ups to expect

**"What happens if a workload covered by an RI gets decommissioned?"** You're still paying for the commitment since it's tied to instance type and region, not actual usage, which is exactly why RIs should only go on workloads you're confident won't change.

**"Why not just use Savings Plans for everything?"** You could, but RIs can get you better discounts on workloads you're fully confident in, so an all-Savings-Plans approach leaves money on the table for your most stable infrastructure.

**"How would you structure this for a team that's still scaling and unsure of its final architecture?"** Lean heavily on Compute Savings Plans for the baseline, since the flexibility across `EC2`, `Lambda`, and `Fargate` matters more than squeezing out the last bit of discount while the architecture is still moving.

## The common wrong answer

Most candidates pick a side and defend it like it's a religious debate, either "RIs are better because the discount is deeper" or "Savings Plans are better because they're flexible." Both miss the actual skill being tested, which is matching the commitment type to the certainty of the workload, and combining them deliberately instead of treating it as an either-or choice.
