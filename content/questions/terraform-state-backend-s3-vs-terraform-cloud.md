---
title: Terraform State Backend - S3 vs Terraform Cloud
description: S3 vs Terraform Cloud for remote state: why DynamoDB locking and the circular bootstrap problem change the tradeoff interviewers probe.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform state backend, terraform s3 backend vs terraform cloud, terraform remote state interview question
category: terraform
youtube: 7VD-mFLjz1M
---

A remote state backend question sounds like trivia, but it's really a check on whether you understand what breaks when two people run `terraform apply` at the same time, and who owns the infrastructure that owns your infrastructure. This one comes up constantly because most candidates have only ever used one backend and assume it's the obviously correct choice.

## The answer interviewers want

S3 is often treated as the safe, boring default for Terraform state. It isn't automatically the right answer, and the interviewer wants to see that you know why.

With S3, state locking doesn't come for free. You have to bolt on a DynamoDB table to get locking, which means more infrastructure to provision, maintain, and secure. Terraform Cloud has locking built in. On top of that, Terraform Cloud gives you run history and policy enforcement out of the box, neither of which S3 provides natively.

The detail most candidates miss: if you use an S3 backend, you're typically managing that S3 bucket (and the DynamoDB table) with Terraform itself. That's circular. You need state to manage the infrastructure that holds your state. You end up with a bootstrapping problem, usually solved with a separate manual step or a different workflow just to stand up the backend before you can use it normally.

Terraform Cloud removes that circularity entirely. The backend is a managed service you don't provision with your own Terraform code, so there's no chicken-and-egg problem. So the honest answer isn't "S3 is the safe choice." It's that S3 comes with operational overhead (DynamoDB for locking) and a structural bootstrapping issue that Terraform Cloud simply doesn't have.

## Why interviewers ask this

They're checking whether you've actually run Terraform in a team setting, not just read the docs. State locking failures and the backend bootstrap problem are things you only really learn by hitting them, so a clear answer signals hands-on experience rather than memorized facts.

## Follow-ups to expect

- **How do you solve the bootstrap problem with S3?** You typically provision the S3 bucket and DynamoDB table outside your main Terraform configuration, often manually or via a separate one-off setup step, specifically to avoid the circular dependency.
- **What happens if state locking fails or is missing?** Without locking, two concurrent applies can corrupt or overwrite state, which is exactly the failure mode DynamoDB locking (or Terraform Cloud's built-in locking) is meant to prevent.
- **What do you lose by picking Terraform Cloud instead of S3?** The source doesn't go into specific downsides, but the implicit tradeoff is giving up a self-managed, DIY backend for a managed service with built-in run history and policy enforcement.

## The common wrong answer

Most candidates default to "S3, because that's what everyone uses and it's cheap and simple." That answer misses that S3 alone doesn't lock state, that DynamoDB is an extra piece of infrastructure to maintain, and that managing your state backend with the same tool whose state it holds creates a bootstrapping problem Terraform Cloud avoids by design.
