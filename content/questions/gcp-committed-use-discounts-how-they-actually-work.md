---
title: GCP Committed Use Discounts - How They Actually Work
description: How GCP Committed Use Discounts differ from sustained use discounts, when to commit, and why most teams buy CUDs too early.
date: 2026-10-22
keywords: finops, devops interview questions, gcp committed use discounts, google cloud committed use discounts finops, gcp cost optimization interview questions, finops interview questions
category: finops
youtube: K6KoXiXwoKU
---

GCP cost questions show up constantly in platform and SRE interviews because cloud spend is now a line item engineering teams are held accountable for. Committed Use Discounts are one of the few GCP cost levers that actually require engineering judgment, not just a finance decision, which is exactly why interviewers like this question.

## The answer interviewers want

Committed Use Discounts, or CUDs, are contracts. You commit to Google that you'll use a certain amount of compute or other resources for a 1-3 year term, and in exchange Google gives you a discount of up to 57% off on-demand pricing.

The key thing to understand is how CUDs differ from sustained use discounts. Sustained use discounts are automatic. If your workload runs consistently throughout a billing month, GCP applies the discount on its own, no contract, no commitment, no risk. CUDs are the opposite: they require you to predict your usage in advance and lock yourself into it. If your workload isn't predictable, a CUD can cost you more than it saves, because you're paying for committed capacity whether you use it or not.

The practical sequencing that experienced teams follow: start with sustained use discounts, since they cost nothing and require no commitment. Only move to CUDs once a workload has proven itself steady over time, meaning you've watched its usage pattern long enough to trust that the 1-3 year commitment won't become dead weight. Most teams get this backwards. They buy CUDs too early, often right after a new workload launches, before they actually know if its resource usage will stay stable.

## Why interviewers ask this

This question tests whether a candidate understands cloud cost optimization as a risk tradeoff, not just a discount to grab. Interviewers want to see that you distinguish between automatic, risk-free savings and contractual commitments that only pay off with accurate forecasting. It also signals whether you've actually managed a cloud budget or are just repeating vendor marketing about discount percentages.

## Follow-ups to expect

**How would you decide when a workload is "proven steady" enough for a CUD?** You'd want to see consistent usage over a meaningful observation window before committing, rather than committing based on a launch-week forecast.

**What happens if you commit to a CUD and then the workload usage drops?** You still pay for the committed capacity regardless of actual use, which is why premature commitment is the main failure mode teams run into.

**Would you recommend CUDs for all workloads eventually?** No, only for the steady-state ones. Spiky or unproven workloads should stay on sustained use discounts since there's no commitment risk there.

## The common wrong answer

Candidates often describe CUDs as simply "the way to save money on GCP" and recommend buying them aggressively and early, treating the discount percentage as the only variable that matters. This misses the actual tradeoff: a CUD is a forecasting bet, and committing before a workload's usage pattern is proven is how teams end up overpaying for capacity they never use.
