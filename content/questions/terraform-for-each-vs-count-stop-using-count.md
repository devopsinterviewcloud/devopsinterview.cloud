---
title: Terraform for_each vs count - Stop Using count
description: Why Terraform count silently destroys and recreates resources, how for_each fixes it, and the state surgery migration needs.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform for_each vs count, terraform for_each interview question, terraform count destroy resources, terraform interview questions
category: terraform
youtube: EVaqFS-dZ2g
---

You delete one item from a list, run `terraform apply`, and watch Terraform destroy and recreate half your infrastructure for no reason you can see in the diff. This comes up constantly in interviews because it separates people who've only read the docs from people who've actually been burned by it.

## The answer interviewers want

`count` indexes resources by position in a list. If you have three instances and delete the first one, Terraform doesn't just remove that instance. It shifts every index after it down by one, which means Terraform sees instance `[1]` as now mapping to what used to be instance `[2]`, and so on. Terraform then destroys and recreates every resource after the deleted index to match the new positions, even though nothing about those resources actually changed.

`for_each` fixes this by keying resources by name instead of position. Use it with `toset()` on a list of strings, or with a map. When you remove one entry, Terraform only touches that one resource because the key for every other resource stays exactly the same. Nothing shifts, nothing gets recreated.

The part most people miss: migrating existing, live infrastructure from `count` to `for_each` is not a drop-in change. You can't just edit the code and run `apply`. Terraform's state file still has those resources addressed by index (`aws_instance.web[0]`, `aws_instance.web[1]`), and switching the resource block to `for_each` changes the addressing scheme entirely. Without intervention, Terraform will think every resource needs to be destroyed and recreated under its new key. You need to do state surgery first, either with `moved` blocks in your configuration or by running `terraform state mv` manually for each resource, to remap the existing state entries to their new `for_each` keys before you apply.

## Why interviewers ask this

This question tests whether you understand Terraform's resource addressing model at a level deeper than syntax. Anyone can look up that `for_each` exists. The interviewer wants to know if you understand why `count` breaks under list mutation, and whether you've actually had to migrate production state without causing an outage. That second part is where most candidates fall apart.

## Follow-ups to expect

**When would you still use count instead of for_each?** When you're creating a fixed, identical set of resources where you genuinely don't care about individual identity, such as a known number of interchangeable workers that will never be selectively removed from the middle of the list.

**What happens if you skip the state surgery and just apply the for_each change?** Terraform treats the resources as having entirely new addresses, so it plans to destroy every resource under its old index-based address and create new ones under the name-based keys, which for live infrastructure means an outage.

**How do moved blocks compare to terraform state mv?** `moved` blocks live in your configuration and document the migration as code, which is safer for team review, while `state mv` is a manual one-off command better suited to quick fixes or a single resource.

## The common wrong answer

Most candidates say "use for_each because it's more flexible" and stop there, treating it as a style preference rather than a correctness issue. They rarely mention the index-shifting mechanism that causes the destructive behavior in the first place, and almost nobody brings up the state migration problem unless pushed, which is exactly the detail that separates someone who's read about Terraform from someone who's had to fix it at 3AM.
