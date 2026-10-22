---
title: Terraform vs OpenTofu - 2026 Migration Guide
description: Why OpenTofu forked from Terraform, how the BSL license change triggered it, and what the migration path actually looks like in 2026.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform vs opentofu, opentofu migration guide 2026, terraform interview questions, opentofu vs terraform license
category: terraform
youtube: yU9TnBx4x5k
---

Every DevOps interview loop in 2026 has at least one licensing question buried in it, and OpenTofu is the current favorite. Interviewers don't care if you've run `tofu init` once. They care whether you understand the license dispute that created the fork in the first place.

## The answer interviewers want

HashiCorp moved Terraform from the open MPL license to the BSL, the Business Source License, specifically to restrict competitors from building commercial products on top of Terraform's code. That move is the whole story. The Linux Foundation responded by forking the last MPL-licensed version of Terraform into OpenTofu, keeping it fully open source under community governance instead of a single vendor.

The two projects share the same state format, but they're diverging fast as separate codebases with separate roadmaps.

Migration is deliberately low-friction: swap the `terraform` binary for `tofu`, run `tofu init`, and it reads your existing state untouched, no conversion step required. In practice, test the switch in a non-prod environment first and check your provider lock file (`.terraform.lock.hcl`), since provider resolution can behave slightly differently between the two tools.

What a lot of candidates miss: OpenTofu shipped state encryption and dynamic provider blocks before Terraform did. That's the detail that separates a surface-level answer from one that shows you actually track the ecosystem. OpenTofu isn't playing catch-up to Terraform anymore. On some features, it's ahead.

## Why interviewers ask this

This question filters for engineers who understand licensing as an operational risk, not just a legal footnote. A BSL change can affect your tooling roadmap, vendor contracts, and CI pipelines, so interviewers want to know you'd notice before it becomes a problem. It also tests whether you follow infrastructure tooling news at all, or just use whatever your team installed two years ago.

## Follow-ups to expect

**"What would make you choose OpenTofu over Terraform for a new project, or vice versa?"** Point to concrete feature differences, like OpenTofu's earlier state encryption and dynamic provider blocks, plus licensing and governance preferences, rather than a vague "open source is better" answer.

**"What breaks if you migrate a large, multi-team Terraform setup to OpenTofu?"** Nothing should break at the state level since the format is shared, but provider lock files and any HashiCorp-specific registry dependencies are worth auditing first in non-prod.

**"How do you keep up with changes like this?"** A credible answer mentions following release notes or changelogs for your core tooling, not just reacting when something breaks in production.

## The common wrong answer

Most candidates describe OpenTofu as "basically Terraform but free" and stop there. That answer signals you know OpenTofu exists but not why it matters, missing the BSL trigger entirely and giving no sense of how the two tools are actually diverging in capability.
