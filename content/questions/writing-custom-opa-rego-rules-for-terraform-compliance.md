---
title: Writing Custom OPA Rego Rules for Terraform Compliance
description: Why OPA Rego policies for Terraform must evaluate plan JSON, not HCL, and how to explain this clearly in a DevOps interview.
date: 2026-10-22
keywords: iac, devops interview questions, OPA Rego rules for Terraform, terraform compliance interview questions, opa rego terraform policy
category: iac
youtube: 7htJsjCfXmM
---

Terraform policy-as-code questions sound simple until the interviewer asks what your Rego rules are actually reading. This is a common filter question for platform and SRE roles because so many candidates write OPA policies that look correct but never catch a real violation.

## The answer interviewers want

Most OPA rules written against Terraform fail because they scan the HCL source instead of the plan output. HCL is what someone wrote. The plan is what Terraform is actually going to do, and that's where drift, defaults, and computed values actually show up.

Deny rules should scan `resource_changes` in the plan JSON, not the `.tf` files. The workflow is: run `terraform plan -out tfplan`, then `terraform show -json tfplan` to convert it to JSON, then pipe that output into `conftest` or evaluate it directly with `opa eval` against your Rego policy.

The part most people miss: dynamic blocks and modules hide bad configuration in HCL. A dynamic block can generate a security group rule that never appears as a literal value in the source file. A module can set a default that silently overrides what the caller intended. None of that is visible if you're grepping or parsing raw HCL. The plan JSON expands all of it, every resource, every computed attribute, every value Terraform is about to apply. If your OPA rules only read HCL, they are structurally incapable of catching the violations that actually matter. You're checking syntax, not intent.

So the rule of thumb: write Rego against `resource_changes`, treat the plan JSON as the single source of truth, and only fall back to static HCL scanning for things that genuinely never change at plan time, like naming conventions.

## Why interviewers ask this

This question separates people who've copied a Rego example from a blog post from people who've actually run policy enforcement in a pipeline. It tests whether you understand the difference between declared configuration and resolved configuration, and whether you know where Terraform's abstractions (modules, dynamic blocks, variables) actually get flattened out.

## Follow-ups to expect

**Why does scanning HCL directly miss things that plan JSON catches?** Because dynamic blocks and module defaults aren't resolved in the source file. They only become concrete values once Terraform evaluates the plan.

**How do you actually feed the plan into OPA?** Generate it with `terraform plan -out tfplan`, convert it with `terraform show -json tfplan`, then run that JSON through `conftest` or `opa eval` against your policy.

**What should your deny rules target inside the plan JSON?** The `resource_changes` array, since that's where every resource's actual post-plan attributes appear, regardless of how they were originally written in HCL.

## The common wrong answer

Candidates usually describe writing Rego policies that parse `.tf` files directly, or that check variable definitions for hardcoded bad values. It sounds reasonable but it only catches the laziest violations. It misses anything introduced through a module default, a dynamic block, or a computed value, which is exactly where real misconfigurations tend to hide.
