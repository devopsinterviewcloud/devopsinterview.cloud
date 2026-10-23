---
title: Terraform Workspaces - Multi-Environment Management
description: How Terraform workspaces manage dev, staging, and prod from one codebase, and why shared backends still worry interviewers.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform workspaces, terraform multi environment management, terraform workspaces vs folders, terraform state isolation
category: terraform
youtube: 9zoeMmxEHew
---

Every team eventually asks how to stop maintaining three near-identical copies of the same Terraform code for dev, staging, and prod. It's a staple interview question because it tests whether you understand Terraform's state model, not just its syntax.

## The answer interviewers want

Terraform workspaces let you reuse identical code while keeping separate state files per environment. Each workspace maintains its own infrastructure state, so applying changes in `dev` doesn't touch what's tracked for `prod`.

You create a workspace with `terraform workspace new dev` and switch between them with `terraform workspace select prod`. Inside your configuration, you reference the `terraform.workspace` variable to drive environment-specific values, things like instance sizes, counts, or tags, without branching your code.

Here's the part that trips people up in interviews: workspaces all share the same backend. If your backend is an S3 bucket with a DynamoDB lock table, every workspace's state lives in that same backend, just under different state file paths. That's not the same as full isolation. Because of this, many teams still prefer separate state files in entirely different S3 buckets per environment, especially for prod, where they want a harder boundary: separate credentials, separate blast radius, and no chance that a misconfigured backend setting affects every environment at once.

So the strong answer is: workspaces are great for keeping code DRY and spinning up ephemeral or lower-stakes environments quickly, but for prod isolation, a lot of experienced teams layer in or switch to separate backends entirely.

## Why interviewers ask this

They're checking whether you understand that "same code" and "isolated infrastructure" are two different problems. A lot of candidates can recite the workspace commands but don't realize the backend is shared, which is exactly the kind of gap that causes a bad day in production.

## Follow-ups to expect

**What's the actual risk of workspaces sharing a backend?** If the backend config, credentials, or lock table are misconfigured or compromised, that exposure isn't scoped to one environment, it potentially touches every workspace's state.

**When would you choose separate state files over workspaces?** For prod, or anywhere you want a hard boundary: different S3 buckets, different credentials, different blast radius if something goes wrong.

**How do you avoid accidentally applying to the wrong environment?** Being deliberate about checking `terraform workspace show` before running `apply`, and in practice, many teams reduce this risk entirely by using separate backends for sensitive environments instead of relying on workspace switching.

## The common wrong answer

Candidates often describe workspaces as giving full environment isolation, listing the commands correctly but stopping there. That misses the shared-backend caveat entirely, which is usually the detail the interviewer is actually listening for.
