---
title: Terraform State Backend - S3 vs HCP Terraform
description: S3 vs HCP Terraform (formerly Terraform Cloud) for remote state: native S3 locking, the circular bootstrap problem, and the tradeoff interviewers probe.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform state backend, terraform s3 backend vs terraform cloud, terraform remote state interview question
category: terraform
youtube: 7VD-mFLjz1M
---

A remote state backend question sounds like trivia, but it's really a check on whether you understand what breaks when two people run `terraform apply` at the same time, and who owns the infrastructure that owns your infrastructure. This one comes up constantly because most candidates have only ever used one backend and assume it's the obviously correct choice.

## The answer interviewers want

S3 is often treated as the safe, boring default for Terraform state. It isn't automatically the right answer, and the interviewer wants to see that you know why.

With S3, state locking is opt-in. It used to mean bolting on a DynamoDB table, but since Terraform 1.11 you can set `use_lockfile = true` and Terraform locks with a `.tflock` file in the same bucket. DynamoDB locking is now deprecated. Terraform Cloud (now called HCP Terraform) has locking built in. On top of that, Terraform Cloud gives you run history and policy enforcement out of the box, neither of which S3 provides natively.

The detail most candidates miss: if you use an S3 backend, you're typically managing that S3 bucket with Terraform itself. That's circular. You need state to manage the infrastructure that holds your state. You end up with a bootstrapping problem, usually solved with a separate manual step or a different workflow just to stand up the backend before you can use it normally.

Terraform Cloud removes that circularity entirely. The backend is a managed service you don't provision with your own Terraform code, so there's no chicken-and-egg problem. So the honest answer isn't "S3 is the safe choice." It's that S3 leaves the backend's setup to you (versioning, encryption, access policy, turning locking on) and has a structural bootstrapping issue that Terraform Cloud simply doesn't have.

## Why interviewers ask this

They're checking whether you've actually run Terraform in a team setting, not just read the docs. State locking failures and the backend bootstrap problem are things you only really learn by hitting them, so a clear answer signals hands-on experience rather than memorized facts.

## Follow-ups to expect

- **How do you solve the bootstrap problem with S3?** You typically provision the S3 bucket outside your main Terraform configuration, often manually or via a separate one-off setup step, specifically to avoid the circular dependency.
- **What happens if state locking fails or is missing?** Without locking, two concurrent applies can corrupt or overwrite state, which is exactly the failure mode the S3 lock file (or Terraform Cloud's built-in locking) is meant to prevent.
- **What do you lose by picking Terraform Cloud instead of S3?** Control and cost predictability. Your state lives in a vendor's service, paid tiers bill per managed resource, and remote runs can't reach private networks without self-hosted agents. With S3, it all stays in your own AWS account.

## The common wrong answer

Most candidates default to "S3, because that's what everyone uses and it's cheap and simple." That answer misses that S3 doesn't lock state until you turn on `use_lockfile`, that the bucket's versioning and access controls are yours to get right, and that managing your state backend with the same tool whose state it holds creates a bootstrapping problem Terraform Cloud avoids by design.
