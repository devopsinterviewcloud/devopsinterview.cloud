---
title: FinOps in CI/CD - Cost Gates Before Deploy
description: How cost gates in CI/CD catch expensive infrastructure changes before deploy, using tools like Infracost and per-environment thresholds.
date: 2026-10-22
keywords: finops, devops interview questions, finops cost gates, finops ci cd pipeline, devops cost control interview, finops interview questions
category: finops
youtube: U6ZaiRONv98
---

A deployment that quietly adds $3,000 a month in infrastructure cost is the kind of surprise that gets a FinOps review called on your pipeline. Interviewers ask this to see if you treat cost as something you can gate in CI/CD, not just something finance discovers after the bill arrives.

## The answer interviewers want

Cost gates are automated checks that estimate infrastructure costs before a deployment goes out, and block the change if it exceeds a budget threshold. The idea is to catch cost regressions the same way you'd catch a failing test, before merge, not after the invoice shows up.

A tool like `infracost` integrates directly with your CI pipeline, for example as a GitHub Actions step. It parses your Terraform plan, estimates the cost delta, and posts a cost diff as a comment on the pull request. You can also configure it to fail the build outright if the estimated cost increase goes above a set limit, the same way you'd fail a build on a broken test or a linting error.

Thresholds should not be uniform across environments. Dev and staging can have a loose or nonexistent threshold, since you want engineers to experiment freely there. Production is different: any change estimated to add more than roughly $500 to the bill should require explicit human approval before it merges, regardless of how confident the author is. The gate isn't there to block spending, it's there to force a conversation before the spending happens.

## Why interviewers ask this

They want to know if you think about cost as an engineering concern with the same rigor as security or reliability, rather than something that gets handled reactively in a monthly billing review. They're also checking whether you understand that gates need to be tiered by environment, since a system that blocks every dev change on cost grounds will just get bypassed or ignored.

## Follow-ups to expect

**What do you do when a cost gate blocks a legitimate change?** Route it to a manual approval step with the cost diff attached, so a lead or finance-adjacent owner can sign off with full context instead of the merge just failing silently.

**How would you set the threshold for production?** Start conservative, something like the $500 example, and tune it based on your actual deployment cadence and typical change size so it catches real anomalies without becoming noise.

**What happens if Infracost can't estimate a resource type?** That's a gap worth flagging explicitly in the PR comment rather than silently passing, since an unestimated resource is exactly where a surprise bill tends to hide.

## The common wrong answer

Candidates often describe cost monitoring instead of cost gating: dashboards, billing alerts, monthly reports. That's reactive. It tells you a deployment was expensive after the money is already spent. The answer interviewers are listening for is a preventive check that runs in the pipeline itself, before the change merges, with thresholds that differ by environment instead of one blanket rule everywhere.
