---
title: GCP Committed Use Discounts - How They Actually Work
description: How GCP Committed Use Discounts differ from sustained use discounts, when to commit, and why buying CUDs too early is a common mistake.
date: 2026-10-22
updated: 2026-11-20
keywords: finops, devops interview questions, gcp committed use discounts, google cloud committed use discounts finops, gcp cost optimization interview questions, finops interview questions
category: finops
youtube: K6KoXiXwoKU
---

GCP cost questions show up constantly in platform and SRE interviews because cloud spend is now a line item engineering teams are held accountable for. Committed Use Discounts are one of the few GCP cost levers that actually require engineering judgment, not just a finance decision, which is exactly why interviewers like this question.

## The answer interviewers want

Committed Use Discounts, or CUDs, are contracts. You commit to Google that you'll use a certain amount of compute or other resources for a 1-3 year term, and in exchange Google gives you a discount of up to 55% off on-demand pricing for most machine types, or up to 70% for memory-optimized ones.

The key thing to understand is how CUDs differ from sustained use discounts. Sustained use discounts are automatic. If your workload runs on an eligible series (N1, N2, N2D, C2, M1, M2, not E2 or newer ones like C3) for over a quarter of the month, GCP applies the discount on its own, no contract, no commitment, no risk. CUDs are the opposite: they require you to predict your usage in advance and lock yourself into it. If your workload isn't predictable, a CUD can cost you more than it saves, because you're paying for committed capacity whether you use it or not.

The practical sequencing that experienced teams follow: start with sustained use discounts, since they cost nothing and require no commitment. Only move to CUDs once a workload has proven itself steady over time, meaning you've watched its usage pattern long enough to trust that the 1-3 year commitment won't become dead weight. Plenty of teams get this backwards. They buy CUDs too early, often right after a new workload launches, before they actually know if its resource usage will stay stable.

## The three discount types side by side

| | Sustained use discounts | Resource-based CUDs | Spend-based (flexible) CUDs |
|---|---|---|---|
| What you commit to | Nothing | A set amount of vCPU, memory, GPUs or local SSD in one region | A minimum spend per hour |
| Term | None, worked out each month | 1 or 3 years | 1 or 3 years (some memory-optimized series only get a discount on 3 years) |
| Applies to | Eligible series only (N1, N2, N2D, C2, M1, M2) | One commitment type, usually one machine series, in one region | Usage across many machine series and regions |
| Discount | Up to 30% on N1 and 20% on N2 and N2D, for a full month's use | Up to 55% for most machine types and 70% for some memory-optimized ones; GPUs and other resources have their own rates | Usually smaller than resource-based; check current rates for your series |
| Can you cancel? | Nothing to cancel | No | No |

## Working out how much to commit

Say a service's allocated vCPUs (what you're billed for, not CPU utilization) over the last 90 days never drop below 64, average 110 and peak at 200 during business hours. Commit to roughly the floor, 64, not the average. If that floor holds, capacity at or below it runs every hour of the term and the commitment always gets used. Past usage is no promise, so adjust for anything already planned, like a migration or a service being retired, before you sign. Everything above it stays on demand, where eligible series still pick up sustained use discounts, or moves to Spot VMs if it can handle being interrupted.

The break-even rule is worth knowing by heart: a commitment beats on-demand pricing as long as you use more than (1 - discount) of it. At a 55% discount you break even at 45% utilization. At a 30% discount you'd need 70%. Compare against the on-demand price after sustained use discounts, though, since that's what you'd really pay without the commitment, and it raises the bar.

Google's commitment recommendations in the console are built from your recent usage, which makes them a reasonable starting point. Check them against the 90-day floor yourself before you sign, especially after a launch or a migration, when recent usage says little about next year.

## Why interviewers ask this

This question tests whether a candidate understands cloud cost optimization as a risk tradeoff, not just a discount to grab. Interviewers want to see that you distinguish between automatic, risk-free savings and contractual commitments that only pay off with accurate forecasting. It also signals whether you've actually managed a cloud budget or are just repeating vendor marketing about discount percentages.

## Follow-ups to expect

**How would you decide when a workload is "proven steady" enough for a CUD?** You'd want to see consistent usage over a meaningful observation window before committing, rather than committing based on a launch-week forecast.

**What happens if you commit to a CUD and then the workload usage drops?** You still pay for the committed capacity regardless of actual use, which is why premature commitment is the main failure mode teams run into.

**Do CUDs and sustained use discounts stack?** Not on the same usage. Usage covered by a commitment gets the commitment price, and only usage above it can earn sustained use discounts.

**How do GCP commitments compare with AWS?** Resource-based CUDs are closest to EC2 Reserved Instances, and spend-based flexible CUDs are closest to Compute Savings Plans. [AWS Reserved Instances vs Savings Plans](/questions/aws-reserved-instances-vs-savings-plans-which-to-choose) covers the AWS side.

**Would you recommend CUDs for all workloads eventually?** No, only for the steady-state ones. Spiky or unproven workloads should stay on on-demand pricing, picking up sustained use discounts where the machine series qualifies, since there's no commitment risk there.

## The common wrong answer

Candidates often describe CUDs as simply "the way to save money on GCP" and recommend buying them aggressively and early, treating the discount percentage as the only variable that matters. This misses the actual tradeoff: a CUD is a forecasting bet, and committing before a workload's usage pattern is proven is how teams end up overpaying for capacity they never use.
