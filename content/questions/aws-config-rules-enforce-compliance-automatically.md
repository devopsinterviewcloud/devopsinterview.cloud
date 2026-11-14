---
title: AWS Config Rules - Enforce Compliance Automatically
description: How AWS Config Rules enforce compliance automatically, with managed and custom Lambda rules plus auto-remediation, explained for interviews.
date: 2026-10-22
keywords: compliance, devops interview questions, aws config rules, aws config interview questions, aws compliance automation
category: compliance
youtube: kWrXz3seTHI
---

Ask any engineer who has inherited an AWS account with no guardrails: compliance is broken by default. New S3 buckets block public access by default now, but anyone with permission can turn that off, and EBS default encryption is an opt-in Region setting. Nothing flags those gaps unless you build the checks. This question comes up because interviewers want to know if you can automate that enforcement instead of relying on quarterly audits and spreadsheets.

## The answer interviewers want

AWS Config Rules continuously evaluate your resources against compliance policies. Instead of someone manually checking whether every S3 bucket is encrypted or every security group is locked down, Config watches your resource configurations in near real time and flags anything that drifts out of compliance.

You have two ways to define what "compliant" means:

- **Managed rules**: AWS ships a library of pre-built rules for common policies, things like `s3-bucket-public-read-prohibited` or `encrypted-volumes`. You deploy these with minimal setup and get coverage for standard best practices fast.
- **Custom rules**: When a managed rule doesn't fit your policy, you write a custom rule, either a Lambda function or a Guard policy. Config runs your evaluation logic when a matching resource changes or on a schedule, and it returns a compliant or non-compliant verdict.

The part that actually closes the loop is remediation. By default, Config just tells you something is wrong, which leaves you back in manual-fix territory. Enabling remediation actions lets Config fix violations instead of just alerting. You attach an SSM Automation document to a rule as its remediation action and turn on automatic remediation, and when a resource goes non-compliant, AWS runs that document to bring it back into line. No one has to notice the alert and act on it; the fix happens on its own.

## Why interviewers ask this

They're checking whether you think about compliance as a continuous, automated control rather than a one-time checklist or a monthly audit. They also want to see if you understand the difference between detection and remediation, since a lot of candidates stop at "Config will tell you if something's wrong" and never mention closing the loop.

## Follow-ups to expect

**How do you handle a rule that needs logic AWS doesn't provide out of the box?** Write a custom Lambda-based Config rule: Config invokes your function on resource changes and your code returns the compliance result.

**What happens if remediation itself fails or isn't appropriate for a given violation?** Config records each remediation execution, so alert on failed runs and cap the retries instead of letting it loop. If an automatic fix could disrupt a workload, keep that rule on manual remediation or document an exception. Auto-remediation is for fixes that are safe without a human checking first.

**Why not just alert and let humans fix it?** Alerting alone reintroduces the manual compliance nightmare Config is meant to eliminate; auto-remediation is what actually enforces the policy instead of just reporting on it.

## The common wrong answer

Most candidates describe Config as a monitoring or reporting tool: it checks resources and tells you what's non-compliant, full stop. That answer misses the enforcement half entirely. Without mentioning managed versus custom Lambda-based rules, and without calling out remediation actions that automatically fix violations, you've described a dashboard, not an automated compliance system.
