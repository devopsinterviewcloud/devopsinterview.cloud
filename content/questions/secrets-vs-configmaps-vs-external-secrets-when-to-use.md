---
title: Secrets vs ConfigMaps vs External Secrets - When to Use
description: Learn when to use Kubernetes Secrets, ConfigMaps, and External Secrets, and why base64 encoding isn't encryption at rest.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes secrets vs configmaps, kubernetes interview questions, external secrets operator, k8s secrets interview
category: kubernetes
youtube: mh8hZuINOCE
---

A recruiter or hiring manager asks this because it's a fast way to separate people who've actually run Kubernetes in production from people who've only read the docs. The question sounds basic, but the follow-up about encryption at rest is where most candidates fall apart.

## The answer interviewers want

The three objects solve different problems and mixing them up is a real-world mistake, not just a trivia question.

`ConfigMap` is for non-sensitive configuration: app settings, feature flags, environment-specific values that don't need protection if someone reads them. Use it for things like a log level or a service URL.

`Secret` is for sensitive data: passwords, API keys, tokens. The catch is that Kubernetes `Secret` objects are only base64 encoded, not encrypted. Base64 is an encoding scheme, not a security control, so anyone with `kubectl` access or a copy of your etcd backup can decode it trivially. If you want Secrets actually encrypted at rest, you have to enable etcd encryption yourself. Kubernetes does not do this for you by default.

External Secrets is for rotating credentials that live in a dedicated secrets manager, like HashiCorp Vault. An External Secrets Operator pulls the real credential from Vault and syncs it into the cluster as a Kubernetes Secret, so your rotation logic and your long-term credential storage live outside etcd entirely. This is the right call when credentials expire or rotate on a schedule and you don't want to manage that by hand.

The one answer that ends interviews fast: putting a password in a ConfigMap. It signals that the candidate doesn't understand the basic sensitivity boundary Kubernetes draws between the two objects.

## Why interviewers ask this

They're checking whether you understand that Kubernetes Secrets are not secure by default, which is a common and dangerous misconception. They also want to see if you know where the responsibility boundary sits: Kubernetes gives you the primitive, but encryption at rest and rotation are things you have to set up yourself or delegate to a tool like Vault.

## Follow-ups to expect

**How do you actually encrypt Secrets at rest?** You enable etcd encryption at the cluster level; without it, Secrets sit in etcd as base64, which is reversible by anyone with access to the data store.

**Why use External Secrets instead of just storing credentials directly as Kubernetes Secrets?** Because credentials that rotate need a system of record outside the cluster, and External Secrets syncs from Vault so you're not manually updating Secret objects every time a credential changes.

**What's wrong with just using ConfigMaps for everything to keep it simple?** ConfigMaps have no sensitivity boundary at all, so any sensitive value stored there is exposed to anyone with read access to the namespace, no decoding required.

## The common wrong answer

Most candidates say "Secrets are encrypted, ConfigMaps aren't" and stop there, treating base64 encoding as if it were encryption. That answer misses the actual production risk: an unencrypted etcd store means Secrets are readable by anyone who gets to the data, which is exactly the gap etcd encryption is meant to close.
