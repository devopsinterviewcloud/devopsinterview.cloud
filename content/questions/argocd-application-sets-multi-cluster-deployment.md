---
title: ArgoCD Application Sets - Multi-Cluster Deployment
description: How ArgoCD ApplicationSets use cluster and matrix generators to deploy one app across many clusters without per-cluster manifests.
date: 2026-10-22
keywords: gitops, devops interview questions, argocd applicationsets, argocd multi cluster deployment, gitops interview questions advanced, argocd interview questions
category: gitops
---

Rolling out a single application to fifty clusters by hand means fifty near-identical manifests, fifty PRs when something changes, and fifty chances to drift. Interviewers bring this up because it's the fastest way to see if you've actually operated GitOps at scale or just used it on a single cluster.

## The answer interviewers want

The core problem with plain ArgoCD `Application` objects is that they're static: one object, one target. Multi-cluster GitOps needs something that generates those objects dynamically instead of you hand-writing them.

That's what `ApplicationSet` does. It generates `Application` resources using a combination of templates and generators, rather than you committing one manifest per cluster.

The cluster generator is the piece that solves the fifty-clusters problem directly. It discovers clusters that are already registered with ArgoCD and creates one `Application` per target cluster automatically. Register a new cluster, and the generator picks it up without a new manifest being written.

For anything more complex than "same app, every cluster," you reach for matrix generators. A matrix generator combines multiple generators together, so you can, for example, cross a list of clusters against a list of environments or app variants to produce the exact set of `Application` objects a more complex rollout pattern requires.

Put together, templates plus the cluster generator plus matrix generators let you scale GitOps properly: one source of truth generates N applications, instead of N manifests living in a repo waiting to drift apart.

## Why interviewers ask this

This question separates people who've read the ArgoCD docs from people who've run it against a real fleet. They want to hear that you reach for generators instead of templating manifests yourself with a script, because that's the signal that you understand ApplicationSet's actual job: turning cluster topology into Applications declaratively.

## Follow-ups to expect

**What happens when a cluster is deregistered?** The cluster generator is driven by what's currently registered with ArgoCD, so the set of generated Applications tracks that registration list; removing a cluster removes it from future reconciliation.

**How would you deploy different config per environment, not just per cluster?** That's exactly what matrix generators are for: combine a cluster generator with another generator (say, one listing environments or app variants) so the output is the cross product of both.

**Why not just template manifests in CI and commit them per cluster?** You could, but then you're back to maintaining fifty committed manifests and a pipeline to regenerate them, which is the exact toil ApplicationSets are meant to remove.

## The common wrong answer

The common wrong answer is describing a CI pipeline that loops over a cluster list and renders/commits a manifest per cluster with Helm or Kustomize. It technically works, but it reintroduces the per-cluster file sprawl and merge conflicts that ApplicationSets exist to eliminate, and it shows the candidate hasn't used the generator model at all.
