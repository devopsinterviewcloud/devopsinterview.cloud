---
title: GCP Deployment Manager vs Terraform - Honest Comparison
description: GCP Deployment Manager vs Terraform: Deployment Manager is end of support, so here's how to weigh Infrastructure Manager against self-run Terraform in an interview.
date: 2026-10-22
keywords: gcp, devops interview questions, gcp deployment manager vs terraform, terraform vs deployment manager interview, gcp infrastructure as code interview
category: gcp
---

A GCP shop has to pick an infrastructure-as-code tool, and the interviewer wants to know if you understand the tradeoff between native tooling and portability. This question comes up constantly in GCP-focused DevOps and platform interviews because it's a fast way to check whether you think about long-term maintenance costs, not just what works today.

## The answer interviewers want

Start with the fact that changes the whole comparison: Deployment Manager is at end of support. Google stopped supporting it on April 1, 2026, new users have been blocked since June 30, 2026, and existing deployments have to move before the service shuts down after June 30, 2027. Nobody should pick it for new work.

Google's recommended replacement is Infrastructure Manager, a managed service that runs Terraform for you and keeps state in Cloud Storage. The other option is running Terraform yourself, with your own state backend and pipeline. Either way the language is Terraform, which most teams had already chosen for its ecosystem: a larger community, more modules and learning resources, and the same workflow whether you're working in GCP, AWS, or Azure.

So the honest tradeoff now is managed versus self-run. Infrastructure Manager is the GCP-native choice, with state and execution handled for you. Self-managed Terraform, or HCP Terraform, gives you more control over versions, backends, and pipelines, and runs the same way if another cloud shows up. Don't oversell portability, though: the workflow carries over, but provider-specific resources still need rewriting if you move clouds.

## Why interviewers ask this

They're checking whether your knowledge is current and whether you can reason about tradeoffs like vendor lock-in, team portability of skills, and ecosystem maturity. A candidate who still recommends Deployment Manager for a GCP-only shop hasn't kept up. The ideal answer mentions the deprecation first, then explains how you'd choose between Infrastructure Manager and running Terraform yourself.

## Follow-ups to expect

**"We still have Deployment Manager deployments. What now?"** Convert the configs to Terraform with Google's DM Convert tool, import them into Infrastructure Manager or your own Terraform setup, then delete the old deployment with the abandon policy so the resources stay put. Some Deployment Manager features don't translate cleanly, so review what it generates.

**"What's the real cost of running Terraform yourself?"** State management, locking, provider versioning, CI wiring, and the learning curve of HCL. Infrastructure Manager takes the state and execution work off your plate, at the cost of less control over how runs happen.

**"How do you justify Terraform to a team that's GCP-only today?"** Google's own managed option runs Terraform, so even a GCP-only team ends up writing it. On top of that you get a bigger community, more existing modules and documentation, and a familiar workflow if the organization ever adds another cloud, migrates workloads, or acquires a team that uses something else.

## The common wrong answer

Candidates still argue Deployment Manager is better because it's native and needs zero setup, which ignores that it's end of support. Others say "always Terraform" with no reasoning, which sounds like cargo-culting a popular tool. The strong answer says Deployment Manager is out, explains that Infrastructure Manager is managed Terraform, and frames the real choice as a managed service versus self-run Terraform, based on how much control the team needs.
