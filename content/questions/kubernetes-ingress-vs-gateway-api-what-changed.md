---
title: Kubernetes Ingress vs Gateway API - What Changed
description: Why Gateway API is replacing Kubernetes Ingress controllers, what changed in the resource model, and how interviewers test this.
date: 2026-10-22
keywords: networking, devops interview questions, gateway api vs ingress, kubernetes gateway api interview, k8s gateway api explained
category: networking
youtube: olJultki6-4
---

Ingress has been the default way to expose HTTP services in Kubernetes for years, but it's showing its age. This question comes up in interviews because Gateway API is the project's direction going forward, and interviewers want to know if you've kept up or if you're still stuck describing a networking model that's being phased out.

## The answer interviewers want

Ingress was too basic for what production traffic routing actually needs. It's a single resource type trying to cover every use case, which means limited routing capabilities (mostly path and host based) and heavy reliance on controller-specific annotations to do anything beyond that. Those annotations are where the vendor lock-in creeps in: an `nginx.ingress.kubernetes.io/*` annotation doesn't mean anything to a different controller, so your manifests aren't portable.

Gateway API fixes this by splitting concerns into separate resources. A `Gateway` resource handles the infrastructure side: listeners, ports, TLS termination, the stuff a platform team owns. `HTTPRoute` (and other Route types) handle the application side: path matching, header-based routing, traffic splitting, the stuff an app team owns. This separation maps cleanly onto how most orgs actually split ownership between platform and product teams, which Ingress never did.

The other major change is standardization. Gateway API routing behavior is specified consistently across vendors, so an `HTTPRoute` you write for one implementation behaves the same way on another. That's the opposite of the annotation sprawl Ingress produced.

In practice, most teams aren't doing a flag day cutover. They run both during migration: new applications get onboarded onto Gateway API, while existing Ingress resources for legacy apps stay in place until there's a reason to touch them.

## Why interviewers ask this

This is a quick way to check if a candidate's Kubernetes networking knowledge is current or frozen a few years back. It also probes whether you understand resource design, not just syntax, since the Gateway/Route split reflects a deliberate ownership model that interviewers expect you to articulate, not just memorize.

## Follow-ups to expect

- **Who typically owns the Gateway resource versus the Route resources in your org?** Gateway usually sits with the platform or networking team since it covers shared infrastructure like listeners and TLS; Route resources are typically owned by application teams since they define app-specific routing rules.
- **How would you approach migrating a cluster from Ingress to Gateway API?** Run both in parallel, move new applications to Gateway API first, and migrate legacy apps off Ingress opportunistically rather than all at once.
- **What problem does the annotation-heavy Ingress model actually cause in multi-vendor environments?** Annotations are controller-specific, so routing configuration written for one Ingress controller doesn't transfer to another, which is exactly the vendor lock-in Gateway API's standardized spec is meant to remove.

## The common wrong answer

The common mistake is treating this as a syntax question and just saying "Gateway API is the new YAML for Ingress." That misses the actual point: the resource model itself changed to separate infrastructure concerns from application routing concerns, and the standardization is what solves the vendor lock-in problem, not a renamed resource type.
