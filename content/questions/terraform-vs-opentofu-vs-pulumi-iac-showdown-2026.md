---
title: Terraform vs OpenTofu vs Pulumi - IaC Showdown 2026
description: Terraform vs OpenTofu vs Pulumi for DevOps interviews: licensing differences, HCL vs real code, and when to pick each tool in 2026.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform vs opentofu vs pulumi, terraform vs pulumi 2026, opentofu vs terraform interview question, iac tools comparison 2026
category: terraform
youtube: zsWXCDqMM7k
---

Every IaC conversation in 2026 eventually hits this fork in the road: Terraform, OpenTofu, or Pulumi. Interviewers ask it because the licensing split and the HCL-vs-code debate both have real operational consequences, and they want to know if you understand the tradeoffs or just have a favorite.

## The answer interviewers want

Terraform is mature and still the default most teams know, but it's now BSL-licensed, which closes the door on commercial forks. OpenTofu is the community fork that came out of that license change. It's MPL-2 licensed and today it's nearly identical to Terraform in practice.

Pulumi takes a different approach entirely: instead of HCL, you write actual code in languages like Python or TypeScript. That's powerful. You get real loops, real conditionals, real functions, and your existing language tooling. But it comes with a steeper learning curve, and the thing most people miss is that this power has a cost. Debugging a broken `for` loop in Python infrastructure code at 2AM is genuinely miserable, in a way that HCL's limitations usually aren't. HCL is deliberately constrained, and those constraints act as guardrails - it's harder to write infrastructure code that's clever in a bad way.

So Pulumi isn't better than Terraform or OpenTofu. It's different. The right call depends on your team's complexity: how much actual programming logic your infrastructure needs, who's maintaining it, and what happens when something breaks at 2AM.

## Why interviewers ask this

This question screens for whether you evaluate tools on tradeoffs or on hype. Anyone can name three IaC tools; fewer people can explain the licensing history behind the Terraform/OpenTofu split or articulate why a constrained language like HCL can be a feature, not a limitation. It also tests whether you think about on-call reality, not just feature lists.

## Follow-ups to expect

**Why did OpenTofu get forked from Terraform in the first place?** Terraform moved to a BSL license that closes off commercial forks, and OpenTofu is the community response that kept an open MPL-2 license while staying nearly identical functionally.

**When would you actually reach for Pulumi over Terraform or OpenTofu?** When your infrastructure logic is genuinely complex enough to need real programming constructs, and your team already has strong skills in that language, so the debugging burden is manageable rather than miserable.

**Is HCL's simplicity a weakness?** Not inherently. Its limitations function as guardrails that keep infrastructure code predictable, which matters more than expressiveness when someone else is reading it under pressure.

## The common wrong answer

Most candidates pick a side and defend it like a tribal allegiance, insisting Pulumi is strictly more powerful or that HCL is outdated. That misses the actual question, which is about fit. The strong answer names the licensing difference between Terraform and OpenTofu accurately, and treats Pulumi's code-based model as a real tradeoff with a 2AM cost, not a free upgrade.
