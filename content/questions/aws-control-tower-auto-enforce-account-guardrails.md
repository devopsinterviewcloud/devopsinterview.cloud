---
title: AWS Control Tower: Auto-Enforce Account Guardrails
description: How AWS Control Tower auto-enforces account guardrails using preventive SCPs and detective rules so new accounts stay compliant by default.
date: 2026-10-22
keywords: aws, devops interview questions, aws control tower guardrails, control tower account guardrails interview, aws scp vs config rules, aws interview questions advanced
category: aws
youtube: wi5RWGQ1rxg
---

A new AWS account with zero guardrails is a live risk the moment it exists. Someone spins it up, forgets the baseline controls, and now you've got an unmonitored account sitting in your org. Interviewers ask this to see if you understand how Control Tower closes that gap automatically, not just what the service does on a slide.

## The answer interviewers want

Control Tower enforces compliance through two types of guardrails. Preventive guardrails are Service Control Policies (SCPs) that block disallowed actions outright, the account literally cannot perform them. Detective guardrails are rules that catch drift after the fact, flagging resources or configurations that fall out of compliance.

You don't attach these manually. New accounts get enrolled through Account Factory, and once an account lands in an Organizational Unit (OU), the guardrails attached to that OU apply automatically. There's no manual IAM policy work involved, the governance is inherited by structure, not by someone remembering to configure it.

The detail most people miss: mandatory guardrails cannot be disabled, not even by the root user of the account. That's not a soft default you can override under pressure, it's a hard guarantee baked into the account's position in the OU hierarchy. So if a risky account tries to do something a preventive guardrail blocks, it gets stopped at the API call, at creation time, before any damage happens. That's the actual promise of "automatic compliance": prevention that can't be turned off, plus detection that catches whatever slips past.

## Why interviewers ask this

They want to know you understand the difference between a policy that's documented and a policy that's enforced. A lot of engineers can describe SCPs in the abstract but can't explain why Control Tower's guardrails are structurally harder to bypass than a hand-rolled IAM policy. This question also checks whether you think about governance at the OU/account-factory level instead of patching compliance into individual accounts after the fact.

## Follow-ups to expect

**Could you explain SCPs versus Config rules cold?** SCPs are preventive and act at the IAM/API layer, blocking actions before they execute. Config rules (the mechanism behind detective guardrails) are evaluative, they check existing resource state and flag violations after the fact.

**What happens if an account needs an exception to a guardrail?** Mandatory guardrails are non-negotiable by design, they can't be disabled even by root, so exceptions have to be handled by moving the account to a different OU with a different guardrail set, not by disabling the control.

**How do new accounts get the right guardrails without manual setup?** They're enrolled through Account Factory and placed into an OU, and the guardrails attached to that OU apply automatically with no manual IAM configuration needed.

## The common wrong answer

Most candidates describe Control Tower as "a dashboard for managing multiple accounts" or say you "set up SCPs for each account," which misses the actual mechanism. The wrong answer treats guardrails as something an admin configures per account instead of something inherited automatically from OU placement, and it skips the key guarantee entirely: that mandatory guardrails can't be disabled, even by root.
