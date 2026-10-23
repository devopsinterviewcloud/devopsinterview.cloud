---
title: 5xx Errors After Deploy - Rollback Decision Tree
description: How to answer the 5xx-after-deploy rollback interview question: the three checks seniors run before rollback vs fix-forward.
date: 2026-10-22
keywords: scenario, devops interview questions, 5xx errors after deployment, rollback decision devops interview, deployment rollback strategy
category: scenario
youtube: Y0juLSRFbbs
---

A deploy goes out, 5xx errors spike, and the on-call channel lights up. This is a staple scenario question because it looks simple but exposes whether a candidate has an actual decision process or just a panic reflex.

## The answer interviewers want

Juniors see a 5xx spike and immediately roll back. Seniors ask three questions first:

1. Is the error rate climbing or flat?
2. Is it isolated to one endpoint, or spreading across the service?
3. Did a schema change (a database migration) ship as part of this deploy?

From there, the decision tree is straightforward:

- **Error rate climbing and you can't find the cause within about two minutes:** roll back. You don't have time to debug live while the blast radius grows.
- **Error rate flat and isolated to a single endpoint:** fix forward. It's contained, so you can patch it without the disruption of a rollback.

The part most people miss: check whether a database migration shipped with that deploy *before* you roll back. Rolling back the application code while the schema has already changed can leave you in a worse state than the original bug, because the running (old) code may not match the new schema. Rollback assumes you can cleanly undo the deploy. If a migration is in play, that assumption breaks.

The goal is to walk into a post-deploy 5xx spike with a decision tree, not a reflex.

## Why interviewers ask this

They're checking whether you default to "rollback everything" without diagnosing first, since that habit causes its own outages when migrations are involved. They also want to see if you can triage under pressure using a couple of fast, concrete signals (trend and blast radius) instead of freezing or guessing.

## Follow-ups to expect

**"What if the error rate is climbing and a migration shipped in the same deploy?"**
You can't just roll back the app and call it done. You need to figure out if the migration is backward compatible with the old code; if it isn't, rolling back the code alone can make things worse, and you may need to fix forward or roll back the schema too.

**"How do you quickly tell if it's isolated to one endpoint?"**
Per-route error dashboards or logs filtered by endpoint are the fast path. If only one route is throwing 5xx and the rest of the service is healthy, that's your isolated signal.

**"Why two minutes as the cutoff for rollback?"**
It's a heuristic, not a hard rule. It exists to stop you from debugging indefinitely while a climbing error rate keeps hurting users. If you can't root-cause fast, limit the damage first.

## The common wrong answer

Most candidates give a one-size-fits-all answer: either "always roll back to be safe" or "always fix forward to avoid disruption." Both skip the diagnostic step entirely, and the rollback-always answer especially falls apart the moment a schema migration is involved, which is exactly the trap this question is designed to expose.
