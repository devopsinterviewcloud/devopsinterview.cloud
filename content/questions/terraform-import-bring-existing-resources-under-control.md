---
title: Terraform Import - Bring Existing Resources Under Control
description: How to use terraform import to adopt existing infrastructure into Terraform state safely, a common DevOps and SRE interview question.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform import, terraform import existing resources, terraform state management, infrastructure as code interview
category: terraform
youtube: z8pN9oTeQOc
---

You've got infrastructure that was clicked together in a console or scripted by hand years ago, and now someone wants it under Terraform. Recreating it means downtime and risk, so interviewers use this question to see if you understand how Terraform state actually works, not just how to write HCL.

## The answer interviewers want

Terraform import lets you adopt existing resources into state without destroying and recreating them. The order matters: you write the resource configuration first, matching what already exists, then you import the real resource into your state file so Terraform knows it's managing something that's already there.

In practice that looks like:

```
terraform import aws_instance.web i-1234567890abcdef0
```

After the import, run `terraform plan`. This shows you any drift between the configuration you wrote and the actual state of the resource in the cloud. If your config doesn't match reality exactly, the plan will want to "correct" the resource toward your config, which can mean unintended changes.

The part people skip: on Terraform 1.5 and later, use an `import` block instead of the CLI command. The import then shows up in `terraform plan` next to any diffs before anything is written to state, so you can fix the config first and get the change reviewed like any other PR. That gives you a safe way to rescue orphaned infrastructure, resources nobody wrote Terraform for, without betting the farm on getting the config right on the first try.

## Why interviewers ask this

This question separates people who've only ever run `terraform apply` on greenfield projects from people who've had to deal with real infrastructure that already exists and can't be touched carelessly. They're checking whether you understand that state is the source of truth Terraform reasons from, and whether you default to caution when production is on the line.

## Follow-ups to expect

**What happens if your config doesn't match the imported resource exactly?** `terraform plan` will show a diff, and if you apply without reconciling it, Terraform will try to change the real resource to match your config, which can mean unwanted modifications to something that's already working.

**Why use an `import` block instead of running `terraform import`?** The CLI command writes to state straight away, with no plan to review. An `import` block goes through plan and apply like any other change, so you see the diff first. And don't test an import in a separate workspace first: it still points at the same live resource, so an apply there changes production.

**How do you know the import succeeded correctly?** Run `terraform state show` to confirm you got the ID you meant, in the right account, then `terraform plan`. A clean plan means your config matches that object. Unexpected changes mean the config is off, or you imported the wrong thing.

## The common wrong answer

Candidates often jump straight to running `terraform import` against production state without writing matching configuration first, or they skip the plan step entirely and assume the import alone is enough. That approach either fails outright or silently introduces drift that surfaces later as an unexpected apply against live infrastructure.
