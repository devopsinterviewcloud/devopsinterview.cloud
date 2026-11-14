---
title: Terraform Moved Blocks - Refactor Without Destroy
description: How to use Terraform moved blocks to refactor resource addresses and modules without destroying or recreating production infrastructure.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform moved blocks, terraform refactor without destroy, terraform state management interview, terraform interview questions
category: terraform
youtube: l0uAjk_kn18
---

You rename a resource or move it into a module, run terraform plan, and suddenly it wants to destroy and recreate something that's been running fine in production for two years. This is one of the fastest ways to spot a candidate who understands Terraform's state model versus one who just memorized commands, so interviewers reach for it constantly.

## The answer interviewers want

Moved blocks exist to tell Terraform's state file that a resource didn't disappear, it just changed address. Without one, Terraform compares the old state address to your new configuration, sees no match, and plans a destroy-then-create. With a `moved` block in place, Terraform treats it as the same resource under a new name.

The workflow is simple. You add a `moved` block specifying the `from` and `to` addresses, run `terraform plan` to confirm Terraform reports a move operation rather than a destroy/create, then run `terraform apply`. Terraform updates the state file to reflect the new address. Your actual infrastructure, the real AWS resources or whatever provider you're on, is never touched.

The part most people miss: moved blocks only work inside one state. You can rename a resource, move it into or out of a module, and since Terraform 1.8 move it to a different resource type if the provider supports that. You can't use them to move a resource into another state file or another AWS account. Splitting state takes a `removed` block with `destroy = false` in the old config and an `import` block in the new one.

## Why interviewers ask this

This question separates engineers who treat Terraform state as a black box from those who understand it's just a mapping between config addresses and real infrastructure. It also signals whether someone has actually lived through a refactor in a production state file, or only ever written Terraform for greenfield projects where nothing has history yet.

## Follow-ups to expect

**What happens if you skip the moved block and just rename the resource?** Terraform sees the old address in state and the new address in config as two unrelated things. It plans to destroy the old resource and create a new one, which for something like a database or load balancer is exactly the outage you're trying to avoid.

**Does applying a moved block change anything in the actual infrastructure?** No. It only updates the state file's record of which address maps to which real resource. The infrastructure itself stays untouched.

**Can moved blocks help with cross-account migrations?** No. A moved block only changes an address inside one state, and the real resource stays in its account. Moving it to another account is a service-specific job, like copying a snapshot, and then you `import` the new copy.

## The common wrong answer

Most candidates either say "you have to destroy and recreate it, that's just how Terraform works" or jump straight to manually hand-editing the state file as if that's the only option. Both answers miss that Terraform has a declarative, plan-reviewable mechanism built specifically for this, and both suggest someone who hasn't actually had to protect production resources during a refactor.
