---
title: OPA Gatekeeper - Block Bad K8s Configs in 3 Rules
description: How OPA Gatekeeper blocks privileged pods, missing resource limits, and latest tags at admission, explained for DevOps and platform interviews.
date: 2026-10-22
keywords: devsecops, devops interview questions, opa gatekeeper kubernetes, gatekeeper policy as code interview, opa gatekeeper tutorial, kubernetes admission control
category: devsecops
youtube: J6NgBGS1kCY
---

A privileged pod gets approved in code review, deploys to prod, and only surfaces two weeks later during an audit. Nobody caught it because no gate actually sat between the manifest and the cluster. Interviewers bring this up to see if you understand admission control as a hard stop, not a linting suggestion.

## The answer interviewers want

OPA Gatekeeper sits in the Kubernetes admission chain. Before the API server ever persists an object, Gatekeeper checks it against your policy. If the request fails the policy, it never lands, there's no object to clean up later and no audit finding two weeks downstream.

Three rules cover most of the incidents that actually show up in production:

- Block privileged containers
- Require resource limits (CPU and memory requests/limits set)
- Deny `latest` image tags

Each rule is written as a `ConstraintTemplate` in Rego, the policy language Gatekeeper uses to express the actual logic (what counts as a violation). You then apply a `Constraint`, which is the object that binds that template to specific resources, namespaces, or kinds in your cluster.

The part most people skip: roll out new constraints in dry-run first. Gatekeeper supports an audit-only enforcement mode that evaluates every matching resource and logs violations without blocking any deploys. That lets you see what would have been rejected, fix the noisy offenders, and then flip enforcement on without breaking day-one deploys across teams that didn't know the policy existed. Once enforcement is on, that privileged pod never makes it past admission. Three rules, one gate, and the failure mode from the code-review-to-audit gap goes away entirely.

## Why interviewers ask this

They want to know if you treat policy as something enforced by the platform, not something hoped for in a pull request template. The dry-run detail specifically separates people who've rolled this out in a real org from people reciting Gatekeeper's README, because every team that skips audit-only first ends up breaking someone's deploy on day one and getting Gatekeeper disabled out of spite.

## Follow-ups to expect

**How do you handle legitimate exceptions, like a debug pod that genuinely needs privileged mode?** Scope the Constraint with `match` to exclude specific namespaces or label-selected resources, so exceptions are explicit and visible instead of the whole policy getting disabled.

**What's the difference between a ConstraintTemplate and a Constraint?** The template defines the Rego logic and the schema for parameters; the Constraint is the applied instance that says which resources that logic actually runs against.

**Why not just do this in CI instead of at admission?** CI checks can be bypassed by anyone with cluster access applying manifests directly; admission control is the one point every object has to pass through regardless of how it got there.

## The common wrong answer

Candidates often describe policy enforcement entirely as a CI/CD pipeline step, scanning manifests before merge. That catches careless mistakes but not a `kubectl apply` run by someone with direct cluster access, which is exactly how the privileged pod in the opening scenario got through. Admission control, not pipeline scanning, is what actually closes that gap.
