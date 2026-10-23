---
title: Terragrunt - DRY Terraform at Scale
description: How do you manage Terraform across multiple environments without duplication? Learn why Terragrunt and config inheritance come up in DevOps interviews.
date: 2026-10-22
keywords: terraform, devops interview questions, terragrunt tutorial, terragrunt vs terraform, terraform dry code, terragrunt interview questions
category: terraform
youtube: 295o65Eq23E
---

You inherit a Terraform repo where every environment folder is a near-identical copy of the last one: same resources, same variables, same backend block, pasted three or four times with minor tweaks. Interviewers bring this up because managing state and config drift across dev, staging, and prod is one of the most common real-world Terraform headaches, and they want to know if you've actually hit it.

## The answer interviewers want

The root problem is copy-pasted Terraform code across environments. Every time you add a variable or change a backend setting, you have to update it in three or four places, and eventually one of them drifts.

Terragrunt solves this by wrapping `terraform` to keep your code DRY. Think of it as a configuration layer sitting on top of Terraform that handles the repetitive parts for you: backend configuration, variables, and dependencies between modules, all managed automatically instead of by hand in every folder.

The pattern is one module, used by multiple environments. You write the actual infrastructure logic once as a Terraform module, then point each environment at it through a `terragrunt.hcl` file instead of duplicating the module itself.

The core mechanism that makes this work is inheritance. Child configs inherit from parent configs, so you define common settings, like your backend config or shared variables, once at the parent level, and each child environment only overrides what's actually different for it, like instance sizes or environment names. The result is no more copy-paste infrastructure: one source of truth for the module, a small, readable diff per environment.

## Why interviewers ask this

This question separates people who've only run `terraform apply` in a single environment from people who've maintained Terraform at organizational scale. They're checking whether you understand why duplicated IaC becomes a liability, how to reduce it, and whether you can reason about tooling choices rather than just memorizing Terraform syntax.

## Follow-ups to expect

**What problem does Terragrunt actually solve that plain Terraform doesn't?** Plain Terraform has no built-in way to avoid repeating backend config, variables, and module calls across environments, so you end up copying the same blocks everywhere. Terragrunt adds an inheritance layer so that config is defined once and only overridden where needed.

**How do environments differ if they share the same module?** Each environment's `terragrunt.hcl` inherits the shared parent settings and only overrides the values specific to it, like variable inputs, keeping the underlying module identical across dev, staging, and prod.

**What happens if you skip Terragrunt and just use Terraform workspaces or copy-pasted folders?** You end up maintaining duplicated backend and variable definitions by hand, which is exactly the drift and repetition problem Terragrunt's inheritance model is meant to eliminate.

## The common wrong answer

Candidates often answer this by describing Terraform workspaces or just "being disciplined about copy-pasting carefully," without addressing the actual duplication problem. That misses the point: the interviewer wants to hear about a structural solution, like inheritance between parent and child configs, not a manual process for keeping copies in sync.
