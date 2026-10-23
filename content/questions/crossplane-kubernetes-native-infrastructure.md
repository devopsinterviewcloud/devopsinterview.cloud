---
title: Crossplane - Kubernetes-Native Infrastructure
description: How Crossplane differs from Terraform under the hood: continuous reconciliation, CRDs, Compositions, and XRDs explained for interviews.
date: 2026-10-22
keywords: platform eng, devops interview questions, crossplane kubernetes, crossplane vs terraform, kubernetes native infrastructure, platform engineering interview questions
category: platform_eng
youtube: hf4nLfl9bH0
---

Interviewers love asking candidates to compare Crossplane and Terraform because it's easy to say "Crossplane is Kubernetes-native Terraform" without understanding what that actually means. This question shows up constantly in platform engineering interviews because the real answer is about reconciliation model, not tooling preference.

## The answer interviewers want

The core difference is execution model. Terraform runs once, applies a plan, and then drifts. If someone changes a resource out of band, Terraform doesn't know until the next `terraform plan` or `apply` catches the diff.

Crossplane takes a different approach: it turns cloud resources into Kubernetes CRDs, and controllers reconcile them continuously, forever. There's no "run once and hope" step. The control loop is always watching the actual state against the desired state and correcting drift in real time, the same way a Kubernetes Deployment controller keeps your pod count correct.

In production, the workflow looks like this: install a provider, such as `provider-aws`, define a `Composition` and an `XRD` (Composite Resource Definition), then let developers apply a simple `Claim` using `kubectl`. The `Composition` is where the real leverage is. It hides cloud complexity behind an abstraction: a developer claims a database, and the platform team controls the guardrails underneath, things like instance size limits, encryption, networking, and tagging policy. The developer never sees the underlying `RDSInstance` or VPC wiring, they just file a `Claim`.

That's the point worth stating directly in an interview: Helm-wrapped Terraform isn't Kubernetes-native infrastructure. It's still a one-shot apply model, just templated differently. Crossplane's reconciliation loop is what makes it Kubernetes-native, because the control plane itself continuously owns the resource lifecycle.

## Why interviewers ask this

This question separates people who've used Crossplane as a buzzword from people who've actually operated it. It tests whether you understand reconciliation loops as a concept, not just as a Crossplane feature, and whether you can explain why that model matters for drift, self-healing, and platform team ownership boundaries.

## Follow-ups to expect

- **What happens if someone manually changes a cloud resource that Crossplane manages?** The controller detects the drift on its next reconcile pass and corrects it back to the desired state defined in the Composition, unlike Terraform which only notices on the next run.
- **Why would a platform team choose Compositions over raw provider resources?** Compositions let the platform team encode guardrails, like limits, encryption, and networking rules, once, so developers only interact with a simplified Claim instead of raw cloud config.
- **Is Helm-wrapped Terraform good enough for a Kubernetes platform?** No. It still runs as a one-shot apply with drift between runs. The thing that makes infrastructure Kubernetes-native is the continuous reconciliation loop, which Helm-wrapped Terraform doesn't have.

## The common wrong answer

Most candidates say "Crossplane lets you manage infrastructure with Kubernetes YAML" and stop there, treating it as a syntax difference from Terraform. That misses the actual distinction: it's not about YAML versus HCL, it's about a one-shot apply model versus a continuously reconciling control loop that owns the resource forever.
