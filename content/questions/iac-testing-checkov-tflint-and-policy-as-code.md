---
title: IaC Testing - Checkov Tflint and Policy-as-Code
description: How to test Terraform and IaC with Checkov, Tflint, and custom OPA policy-as-code checks in CI pipelines before deployment, for DevOps interviews.
date: 2026-10-22
keywords: iac, devops interview questions, iac testing interview questions, checkov terraform interview, tflint policy as code interview, infrastructure as code testing
category: iac
youtube: NXs_t0M-ioc
---

A Terraform apply that quietly grants admin access to every IAM user is the kind of incident that makes IaC testing a recurring interview topic. Interviewers want to know you have a repeatable pipeline that catches that before it ever reaches apply, not just a human reviewing a pull request.

## The answer interviewers want

Think of IaC testing as three layers that run in CI before anything touches real infrastructure.

- `checkov .` scans your Terraform for security issues: overly permissive IAM policies, public S3 buckets, unencrypted resources, and similar misconfigurations.
- `tflint` catches best practice violations: things like invalid instance types, deprecated syntax, or provider-specific anti-patterns that a security scanner isn't designed to flag.
- OPA (Open Policy Agent) policies run last, enforcing your own custom rules such as company-specific tagging standards, naming conventions, or restrictions that generic open source tools have no way of knowing about.

The order matters: run `checkov .`, then `tflint`, then your OPA policies, all as stages in your CI pipeline before the plan is ever applied. Generic scanners catch generic problems. Custom OPA policies catch the specific requirement your org cares about, things a generic tool simply can't anticipate. Together these three layers catch the kind of security disaster where a Terraform change silently grants admin access to everyone, long before it ever reaches production.

## Why interviewers ask this

This question is really about whether you treat IaC with the same rigor as application code. Interviewers are checking that you understand defense in depth: no single tool catches everything, and relying on manual review alone is how "admin for everyone" ends up deployed. They're also listening for whether you place these checks correctly in a CI pipeline rather than running them ad hoc on someone's laptop.

## Follow-ups to expect

- **What happens if a PR fails one layer but passes the others?** Treat each layer as its own required CI gate. A failure in any one of them should block the merge, since Checkov, Tflint, and OPA are each checking for a different category of problem.
- **Why not just use OPA for everything?** OPA is built for custom, organization-specific policy, not general security scanning. Checkov already ships with checks for known misconfigurations that you'd otherwise have to write and maintain yourself.
- **Where exactly do these checks run?** In the CI pipeline, as stages that execute against the Terraform plan before apply, not locally and not as a post-deploy audit after the damage is already done.

## The common wrong answer

Candidates often name a single tool, usually just a security scanner, and treat that as the whole answer. That misses the point: a generic scanner doesn't know your company's specific rules, and best-practice linting catches a different class of problems than security scanning does. The strongest answers describe layered checks wired into CI, each catching something the others would miss, not one tool run manually before a commit.
