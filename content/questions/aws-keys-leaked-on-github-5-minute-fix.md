---
title: AWS Keys Leaked on GitHub - 5 Minute Fix
description: A DevOps interview question on leaked AWS keys on GitHub: what to revoke first, why deleting the commit doesn't help, and how to prevent it.
date: 2026-10-22
keywords: devsecops, devops interview questions, AWS keys leaked on GitHub, aws access key exposed github fix, rotate aws credentials after leak, devsecops interview questions
category: devsecops
youtube: f4yCDqEKkCc
---

A public repo with live AWS keys in it is one of the most common security incidents in cloud teams, and interviewers use it to see if you know the right order of operations under pressure. It's a quick question with a clear right answer, so getting the sequence wrong is a red flag.

## The answer interviewers want

The first move is to revoke the keys in IAM immediately. Deleting the commit from the repo does not help - GitHub is scraped by bots looking for exposed credentials, and that scraping happens in under a minute. By the time you've rewritten history, the keys are already compromised. Revoking access in IAM is the only action that actually stops the bleeding.

Once the keys are dead, clean up the root cause. Replace any hardcoded keys with environment variables or AWS Secrets Manager. Credentials should never live in code, full stop.

The part candidates often miss is prevention: add `git-secrets` or GitGuardian as a pre-commit hook. That catches the key before it ever leaves your machine, not after it's already public. So the priority order is: revoke first, because that's the only step that matters in the moment, and everything else - cleanup, rotation, prevention - is work that happens after the fire is out.

## Why interviewers ask this

They want to know you understand that secret exposure is a race against automated scraping, not a cleanup task you can do at your own pace. It also tests whether you think in terms of root-cause prevention (pre-commit hooks) instead of just reacting after the fact. A candidate who says "delete the commit" first is showing they don't understand how fast public repos get indexed.

## Follow-ups to expect

**If you can't find every place the key was used, what's your next step?** Rotate the credential and audit CloudTrail or IAM access logs for any activity during the exposure window, since revoking stops future use but doesn't tell you what already happened.

**Why doesn't rewriting git history to remove the key solve the problem?** Because the key was already scraped and cached by bots within a minute of the push, so a history rewrite only cleans your repo, not the exposure.

**How do you stop this from happening again across a whole team, not just one repo?** Roll out a pre-commit secret scanner like `git-secrets` or GitGuardian org-wide, and pair it with a policy that credentials only come from Secrets Manager or environment variables, never literals in code.

## The common wrong answer

Most candidates jump straight to "delete the commit" or "force push a clean history" as their first answer. It sounds proactive, but it misses that the leak already happened the moment the push completed. Any answer that doesn't put IAM revocation first is treating a live credential compromise as a cosmetic git problem instead of an active security incident.
