---
title: Pulumi vs Terraform vs CDK - IaC Tool Comparison
description: How to compare Terraform, Pulumi, and CDK in DevOps interviews, with a real lesson on why boring HCL beats clever code at 2AM.
date: 2026-10-22
keywords: iac, devops interview questions, pulumi vs terraform vs cdk, iac tool comparison interview, terraform vs pulumi 2026
category: iac
youtube: KyVxvCPrjrU
---

A team I know picked Pulumi over Terraform because TypeScript felt familiar, then rewrote the whole setup six months later. This question shows up in almost every IaC-heavy DevOps interview because anyone can recite the Wikipedia differences between these tools, but interviewers want to hear you've actually lived with the tradeoffs.

## The answer interviewers want

Start with what each tool actually wins on. Terraform wins on ecosystem: modules everywhere, every provider supported, and a state model that's been battle-tested for years. Pulumi is effectively Terraform but written in real code - TypeScript, Python, Go - which is attractive if your team already thinks in those languages. CDK is AWS-only, but if your developers already know it, that familiarity counts for something.

Then bring in the real-world lesson. A team chose Pulumi because TypeScript felt familiar on paper. Six months in, nobody wanted to own the state backend or debug the `pulumi preview` diffs when something didn't match expectations. Terraform's HCL looks boring, and that's the point - boring is predictable, and predictable is what you want when something breaks.

Close with the actual decision rule: the best IaC tool is the one your on-call engineer can understand at 2AM, half-awake, under pressure. Fancy abstractions and clever code fail in production in ways that are hard to debug quickly. Readable beats clever. Don't pick an IaC tool because it's trendy - pick it for the person who gets paged.

## Why interviewers ask this

They're checking whether you understand IaC tools as operational commitments, not just developer-experience choices. Anyone can list features; they want to see you've weighed ecosystem maturity, debuggability, and on-call reality against each other, and that you can admit a tool choice that didn't work out.

## Follow-ups to expect

**"What specifically went wrong with the Pulumi state backend?"** The core issue was ownership: nobody on the team wanted to be responsible for managing or troubleshooting it, which meant problems sat unresolved longer than they should have.

**"Would you ever recommend CDK?"** Yes, if the org is AWS-only and the dev team already knows it well. The tradeoff is you're locked into one cloud's abstraction layer.

**"How do you evaluate a tool's debuggability before adopting it?"** Think about what happens when a preview or plan doesn't match reality at 2AM, and whether an on-call engineer unfamiliar with the codebase can reason through the diff quickly.

## The common wrong answer

Most candidates give a neutral, textbook comparison: Terraform has more providers, Pulumi lets you use real programming languages, CDK is AWS-native. That's not wrong, but it dodges the actual question. Interviewers want to hear an opinion shaped by consequences, like a tool that looked elegant in a demo but became unmanageable in production, not a feature checklist with no judgment attached.
