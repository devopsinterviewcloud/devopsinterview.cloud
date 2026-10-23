---
title: External Secrets Operator - Sync Vault to Kubernetes
description: How External Secrets Operator syncs Vault secrets into Kubernetes without Git, plus ClusterSecretStore vs SecretStore scoping.
date: 2026-10-22
keywords: devsecops, devops interview questions, external secrets operator kubernetes, external secrets operator vault, kubernetes secrets management interview, hashicorp vault kubernetes integration
category: devsecops
youtube: GtbV2CDBd0I
---

Every team eventually gets asked this: your Kubernetes secrets are probably sitting in Git right now, base64-encoded and not actually secret. Interviewers want to know if you have a real answer beyond "we use Vault" - specifically, how the secret actually gets from Vault into a running pod.

## The answer interviewers want

External Secrets Operator (ESO) solves this exact problem. You define a `SecretStore` resource pointing at your Vault instance, then an `ExternalSecret` resource that maps specific Vault paths to keys in a Kubernetes `Secret`. ESO polls Vault on an interval and keeps the Kubernetes Secret in sync automatically. Nothing gets committed to Git because the actual secret value never lives in your repo, only the mapping configuration does.

Here's the detail most people miss: use `ClusterSecretStore`, not `SecretStore`. A `SecretStore` is namespace-scoped, which means if ten teams each need Vault access, you're duplicating that same store config into ten namespaces. A `ClusterSecretStore` is a single, cluster-wide configuration that every namespace's `ExternalSecret` resources can reference. One config instead of N copies, and one place to update if your Vault connection details change.

When you explain this in an interview, don't stop at "we use Vault." Walk through the sync layer: `ClusterSecretStore` for the connection, `ExternalSecret` for the path-to-key mapping, and ESO's polling loop as the mechanism that keeps Kubernetes Secrets current without anyone touching Git.

## Why interviewers ask this

This question separates people who've read about Vault from people who've actually wired it into a cluster. Saying "we use Vault" is a buzzword answer. Explaining the `SecretStore` to `ExternalSecret` to Kubernetes `Secret` pipeline shows you understand the reconciliation model, not just the vendor name. It also tests whether you think about operational overhead at scale, which is exactly what the `ClusterSecretStore` distinction reveals.

## Follow-ups to expect

**Why not just use the Vault Agent Injector instead?** The source doesn't cover this tradeoff directly, but be ready to compare: ESO syncs values into native Kubernetes Secrets that any workload can consume, which is a different operational model than sidecar injection.

**What happens if Vault is unreachable when ESO polls?** Think through this in terms of the sync model: ESO keeps the last-synced Kubernetes Secret in place until it can successfully reconcile again, so a transient Vault outage shouldn't immediately break running pods.

**Why use ClusterSecretStore over SecretStore specifically?** Because `SecretStore` is namespace-scoped and would need to be duplicated in every team's namespace, while `ClusterSecretStore` is defined once and referenced cluster-wide.

## The common wrong answer

Most candidates either say "we store secrets in Vault" and stop there, with no explanation of how Kubernetes workloads actually get them, or they describe ESO but default to namespace-scoped `SecretStore` everywhere without realizing that doesn't scale past a single-team cluster. Both answers signal theoretical knowledge without hands-on configuration experience.
