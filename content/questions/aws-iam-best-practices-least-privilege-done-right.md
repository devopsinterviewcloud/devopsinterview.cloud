---
title: AWS IAM Best Practices - Least Privilege Done Right
description: How to answer the AWS IAM least privilege interview question: zero-start policies, Access Analyzer, CloudTrail, and permission boundaries.
date: 2026-10-22
keywords: aws, devops interview questions, aws iam best practices, aws iam least privilege interview, aws iam security interview questions
category: aws
youtube: ZVxmIXuNUfE
---

Almost every AWS shop has at least one IAM policy with a wildcard resource and a wildcard action sitting somewhere in production. Interviewers know this, which is why "how do you implement least privilege in IAM" is a near-universal screening question for anyone claiming AWS experience.

## The answer interviewers want

Start from zero. Don't begin with a broad managed policy and try to trim it down, begin with no permissions attached and add only what a role or user needs for its specific task. This is the opposite of how most people actually build IAM policies under deadline pressure, which is exactly why interviewers probe it.

Two AWS tools do the heavy lifting here. Use **IAM Access Analyzer** to find permissions that exist on a policy but are never actually used, so you can identify what to strip out. Use **CloudTrail** to look at actual API usage patterns over time, since that tells you what a role genuinely calls versus what it was granted "just in case." Together they turn least privilege from a one-time policy review into an ongoing, evidence-based process: grant narrowly, observe real usage, then tighten further.

The other piece is **permission boundaries**. A permission boundary caps the maximum permissions an identity can ever have, even if someone later attaches a broader policy to it or an attacker manages to escalate privileges through a misconfigured trust relationship. It's a backstop that limits blast radius even when the primary controls fail.

## Why interviewers ask this

This question separates people who've only read the IAM docs from people who've actually run AWS accounts at scale. Anyone can say "grant least privilege." The interviewer wants to hear that you treat it as a process with tooling and feedback loops, not a one-time policy-writing exercise, and that you understand defense in depth, meaning you don't rely on getting the initial policy perfectly right.

## Follow-ups to expect

**How do you handle legitimate exceptions, like a break-glass admin role?** Permission boundaries still apply here. You scope the boundary tightly and pair it with monitoring and short-lived credentials rather than leaving a standing broad-access role unattended.

**What's the difference between a permission boundary and an SCP?** The source material doesn't go into organizational-level controls, but it's worth knowing a boundary caps a single identity's permissions while broader org-wide guardrails operate at the account level. Don't guess at specifics you can't back up in an interview.

**How often should you re-run Access Analyzer and CloudTrail reviews?** Treat it as continuous, not a quarterly audit checkbox. Usage patterns change as services evolve, so unused permissions accumulate quietly if nobody's watching.

## The common wrong answer

Most candidates answer with the textbook definition, "grant only the permissions needed to do the job," and stop there. That's not wrong, but it's incomplete: it skips the actual mechanics of how you find and remove excess permissions over time, and it skips the backstop of permission boundaries entirely. Interviewers notice when someone can define least privilege but can't describe the tooling or process that actually enforces it in a live AWS account.
