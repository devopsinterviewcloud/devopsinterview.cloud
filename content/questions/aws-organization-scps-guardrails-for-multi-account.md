---
title: AWS Organization SCPs - Guardrails for Multi-Account
description: How Service Control Policies (SCPs) stop costly EC2 instance types across AWS Organization accounts, and how to explain SCPs vs IAM in interviews.
date: 2026-10-22
keywords: aws, devops interview questions, aws organizations scp, aws service control policies, aws scp interview questions, aws organizations interview
category: aws
---

A dev spins up an m5.24xlarge in a sandbox account because nothing stopped them, and the bill lands on finance's desk before anyone notices. Interviewers use this scenario to see if you know the difference between IAM permissions and organization-wide guardrails.

## The answer interviewers want

The tool here is Service Control Policies (SCPs). Think of them as IAM, but scoped to entire AWS accounts instead of individual users or roles. You attach an SCP to an Organizational Unit (OU) in AWS Organizations, and it applies to every account inside that OU.

For this specific problem, you'd write a JSON policy that denies `RunInstances` for anything larger than `m5.large`. Attach it to the OU containing your dev/sandbox accounts, and every account in that OU inherits the restriction.

Two details matter a lot here. First, SCPs can't grant permissions, only restrict them. They set a ceiling on what's allowed; IAM policies still have to grant the actual access underneath. Second, SCPs apply even to the root user of an account. That's the detail that actually enforces the guardrail. Without it, someone could just use root to bypass IAM restrictions. With an SCP in place, root gets blocked too, so that expensive instance launch fails no matter who's trying it.

## Why interviewers ask this

This question checks whether you understand preventive controls versus detective controls. Budget alerts and cost anomaly detection tell you about a problem after it happens; SCPs stop it from happening at all. They also want to see that you think in terms of account hierarchies and OUs, not just per-account IAM policies, since that's how cost and security guardrails actually scale across dozens or hundreds of AWS accounts.

## Follow-ups to expect

**How is an SCP different from an IAM policy?** IAM grants and denies permissions to users and roles within an account. SCPs never grant anything; they just define the maximum permissions available to an account, including its root user.

**What happens if you attach the SCP to the organization root instead of a specific OU?** It applies to every account in the entire organization, including production, which is usually not what you want. Scoping it to a dev or sandbox OU keeps the restriction isolated from accounts that legitimately need bigger instances.

**How do you handle a legitimate exception, like a team that needs an m5.xlarge?** Move that account into a different OU with a looser SCP, or write the policy with a condition that scopes the restriction by tag or account ID rather than a blanket deny.

## The common wrong answer

Most candidates jump straight to IAM policies or cost alerts. IAM policies only cover the accounts and roles you've configured, so a careless root user or a misconfigured role can still slip through. Cost alerts tell you after the spend already happened. The other common mistake is assuming SCPs grant access like IAM does; they don't, they only narrow what's already permitted.
