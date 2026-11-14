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

Here's the detail most people miss: picking `SecretStore` or `ClusterSecretStore` is a security decision, not just a tidiness one. A `SecretStore` is namespace-scoped, so ten teams means ten copies of the store config, but each can use its own Vault role and reach only that team's paths. A `ClusterSecretStore` is one cluster-wide config every namespace's `ExternalSecret` resources can reference: one place to update, but any namespace can read whatever its Vault credentials reach unless you restrict which namespaces may use it.

When you explain this in an interview, don't stop at "we use Vault." Walk through the sync layer: `SecretStore` or `ClusterSecretStore` for the connection, `ExternalSecret` for the path-to-key mapping, and ESO's polling loop as the mechanism that keeps Kubernetes Secrets current without anyone touching Git.

## Why interviewers ask this

This question separates people who've read about Vault from people who've actually wired it into a cluster. Saying "we use Vault" is a buzzword answer. Explaining the `SecretStore` to `ExternalSecret` to Kubernetes `Secret` pipeline shows you understand the reconciliation model, not just the vendor name. It also tests whether you think about operational overhead at scale, which is exactly what the `ClusterSecretStore` distinction reveals.

## Follow-ups to expect

**Why not just use the Vault Agent Injector instead?** The injector adds Vault Agent containers that write secrets to an in-memory volume per pod, so nothing lands in etcd, but each pod runs a sidecar and the app reads files. ESO creates native Secrets any workload can use, but they live in etcd, so encrypt etcd and lock down RBAC.

**What happens if Vault is unreachable when ESO polls?** Think through this in terms of the sync model: ESO keeps the last-synced Kubernetes Secret in place until it can successfully reconcile again, so a transient Vault outage shouldn't immediately break running pods.

**When would you pick ClusterSecretStore over SecretStore?** When many namespaces share the same Vault access and you'd otherwise copy the store into each one. Restrict which namespaces can use it, and keep `SecretStore` where a team needs its own Vault role.

## The common wrong answer

Most candidates either say "we store secrets in Vault" and stop there, with no explanation of how Kubernetes workloads actually get them, or they describe ESO but can't say why they'd pick `SecretStore` or `ClusterSecretStore`, which comes down to per-team isolation versus one shared config. Both answers signal theoretical knowledge without hands-on configuration experience.
