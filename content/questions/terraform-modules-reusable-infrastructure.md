---
title: Terraform Modules - Reusable Infrastructure
description: How to make Terraform reusable across dev, staging, and prod using modules, source paths, and Git tag versioning.
date: 2026-10-22
keywords: terraform, devops interview questions, terraform modules, terraform modules tutorial, terraform modules interview questions, infrastructure as code modules
category: terraform
youtube: 8tfs9sAmmGk
---

If you've got the same VPC or EC2 block copy-pasted into three different Terraform directories, one for each environment, you already know the pain. Someone fixes a bug in staging and forgets prod exists. This question shows up constantly because it's a fast way to tell if a candidate has actually maintained Terraform at scale or just run `terraform apply` a few times on a personal project.

## The answer interviewers want

Terraform modules work like functions in a programming language. You define the infrastructure logic once, then call that module with different input parameters for each environment: dev, staging, and prod.

In practice, you put shared configuration, say a VPC setup, into a `modules` directory. Then in each environment's config you reference it like this:

```
module "vpc" {
  source = "./modules/vpc"
  ...
}
```

Each environment passes in its own variables (CIDR ranges, instance sizes, tags) while reusing the exact same underlying module code. That's the whole point: one definition, many callers.

The part most people skip: version your modules with Git tags. Don't point production at a module's latest commit on `main`. If someone merges a change to the VPC module for a dev experiment, you do not want that silently flowing into prod the next time someone runs `terraform apply`. Pin production to a specific tagged version, like `source = "git::https://example.com/modules/vpc.git?ref=v1.2.0"`, and bump that tag deliberately when you're ready to roll the change forward.

## Why interviewers ask this

This is a quick filter for whether you understand Terraform as a language with real software engineering practices, not just a YAML-adjacent tool you copy from Stack Overflow. They want to hear "reuse" and "versioning" together, because reuse without version pinning is how one bad commit takes down every environment at once.

## Follow-ups to expect

**What happens if you don't pin module versions?** Every environment pulling from `main` means an untested change to a dev-only module can land in production the next time anyone runs `apply`, with no review step specific to that environment.

**How do you pass different values into the same module?** Through input variables defined in the module and set per-environment, so the module code stays identical while CIDR blocks, sizes, and tags differ between dev, staging, and prod.

**Where do you physically keep your modules?** In a dedicated `modules` directory (or a separate versioned repo), referenced from each environment's config via the `source` argument rather than duplicated inline.

## The common wrong answer

Candidates often say "use modules" and stop there, as if just having a `modules` folder solves reusability. They skip the versioning piece entirely, which is the part that actually prevents incidents. Saying "I'd use modules" without mentioning that production should pin to a tagged release, not `latest` or `main`, tells the interviewer you've read about modules but haven't been burned by an unpinned one breaking prod.
