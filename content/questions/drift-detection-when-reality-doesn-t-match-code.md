---
title: Drift Detection - When Reality Doesn't Match Code
description: How to detect Terraform drift: terraform plan, Checkov, Driftctl, and CI automation to catch manual changes before deployments break.
date: 2026-10-22
keywords: iac, devops interview questions, drift detection terraform, terraform drift detection tools, infrastructure as code drift, terraform plan drift check
category: iac
---

Someone made a manual change in the console, or an auto-scaling event altered something, and now your Terraform state no longer describes what's actually running. This comes up in interviews because it tests whether you understand that "applying code once" isn't the same as "managing infrastructure."

## The answer interviewers want

Drift detection is the practice of comparing your desired state, what's defined in your Terraform code, against your actual infrastructure, what's really running in the cloud. When those two diverge, you've got drift, and left unnoticed it causes failed applies, inconsistent environments, and surprises during incidents.

The simplest way to catch drift is running `terraform plan` regularly. A plan with no changes means reality matches code. A plan with unexpected changes means something happened outside of Terraform.

Beyond that, there are dedicated tools built for this. Checkov and Driftctl are two options worth knowing. They're built to scan your actual cloud resources and flag differences from your IaC definitions, rather than relying on someone remembering to run a plan.

The real answer interviewers want isn't just "I know what drift is," it's "I automate catching it." Set up automated drift detection in your CI pipeline. Running `terraform plan` (or a tool like Driftctl) on a schedule, and failing a build or alerting a team when drift shows up, catches manual changes before they break a deployment. That's the difference between finding out about drift during a 3AM page and finding out about it in a Slack notification during business hours.

## Why interviewers ask this

This question separates people who've only run `terraform apply` a few times from people who've actually operated Terraform-managed infrastructure over time. It probes whether you understand that state can silently rot, and whether you have a habit or a process for catching that, not just a one-time fix.

## Follow-ups to expect

**What causes drift in the first place?** Manual console changes, emergency hotfixes applied outside the pipeline, and auto-scaling or other automated processes that modify resources Terraform also manages are the usual sources.

**What do you do once you've detected drift?** You'd review the plan output to understand what changed and why, then decide whether to update the code to match reality or run an apply to force reality back to match the code, depending on which one is actually correct.

**Where would you wire this into a pipeline?** A scheduled CI job running `terraform plan` or a drift-detection tool like Driftctl, with alerting on any detected changes, so drift surfaces before the next deployment rather than during it.

## The common wrong answer

The common mistake is treating `terraform apply` as a one-time event: you ran it, infrastructure is "done," and you move on. Candidates who answer this way describe drift reactively, something they'd investigate only after a deployment fails, instead of describing a standing process that checks for it continuously. Interviewers notice the absence of automation and scheduling in the answer immediately.
