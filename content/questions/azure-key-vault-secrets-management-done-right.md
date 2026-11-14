---
title: Azure Key Vault - Secrets Management Done Right
description: Learn how to secure Azure app secrets with Key Vault, managed identities, and RBAC for least-privilege access - a common DevOps interview question.
date: 2026-10-22
keywords: azure, devops interview questions, azure key vault interview questions, azure key vault secrets management, azure devops interview questions, cloud engineer interview azure
category: azure
youtube: V9htW8ZyjW8
---

A classic Azure interview scenario: your app needs a database connection string or an API key, and the obvious shortcut is to hardcode it or drop it in a config file. Interviewers ask this because secrets sprawl is one of the most common root causes of real production incidents, and they want to know whether you reach for the right managed service by default.

## The answer interviewers want

Azure Key Vault is the centralized secrets store for the platform. Treat it like a bank vault for passwords, connection strings, and certificates rather than a place you occasionally remember to use. The pattern you should describe is: your application authenticates to Key Vault using a managed identity, so there's no credential, connection string, or key stored anywhere in your code or config files. The app's identity itself is the credential, and Azure handles the token exchange behind the scenes.

The detail that trips people up is access control. Use Azure RBAC for Key Vault permissions: it's what Microsoft recommends, and it's the default for new vaults. Give the app's managed identity a data-plane role like `Key Vault Secrets User`, scoped to the vault or a single secret. Role assignments can take a few minutes to propagate, so a pipeline that grants a role and reads a secret straight away can fail. Grant access earlier in the pipeline or retry with backoff. Access policies still work, but they're the legacy model, and anyone who can manage the vault can use them to grant themselves its secrets.

## Why interviewers ask this

This question is a quick filter for whether a candidate defaults to "secure by design" or "secure as an afterthought." It also tests whether you understand Azure's identity model well enough to avoid storing credentials at all, since managed identities are the whole point of the exercise, not just a nice-to-have.

## Follow-ups to expect

**Doesn't RBAC propagation delay break pipelines?** It can, if a pipeline grants a role and reads a secret in the same step. Assign roles before the deploy step or retry with backoff. The delay isn't a reason to fall back to access policies, which let vault contributors grant themselves secret access.

**How does a managed identity actually get permission to read a secret?** You assign the identity a role such as `Key Vault Secrets User` on the vault, and from then on the app can request secrets at runtime without any stored credential.

**What else belongs in Key Vault besides connection strings?** Certificates and passwords belong there too. The idea is one centralized store for anything sensitive, not just database secrets.

## The common wrong answer

Most candidates get the first half right and stop there: they say "use Key Vault" and move on, without mentioning managed identities, which means they're still describing an app that needs some credential to get into the vault in the first place. Others still reach for access policies because older tutorials show them, without knowing why Microsoft now recommends RBAC: access policies let anyone who manages the vault grant themselves its secrets. Knowing that, and how you handle role propagation in a pipeline, is what separates someone who has configured Key Vault from someone who has only read about it.
