---
title: Azure Key Vault - Secrets Management Done Right
description: Learn how to secure Azure app secrets with Key Vault, managed identities, and access policies instead of RBAC - a common DevOps interview question.
date: 2026-10-22
keywords: azure, devops interview questions, azure key vault interview questions, azure key vault secrets management, azure devops interview questions, cloud engineer interview azure
category: azure
youtube: V9htW8ZyjW8
---

A classic Azure interview scenario: your app needs a database connection string or an API key, and the obvious shortcut is to hardcode it or drop it in a config file. Interviewers ask this because secrets sprawl is one of the most common root causes of real production incidents, and they want to know whether you reach for the right managed service by default.

## The answer interviewers want

Azure Key Vault is the centralized secrets store for the platform. Treat it like a bank vault for passwords, connection strings, and certificates rather than a place you occasionally remember to use. The pattern you should describe is: your application authenticates to Key Vault using a managed identity, so there's no credential, connection string, or key stored anywhere in your code or config files. The app's identity itself is the credential, and Azure handles the token exchange behind the scenes.

The detail that trips people up is access control. Use access policies, not RBAC, for Key Vault permissions. RBAC role assignments on Azure resources have propagation delays, and if your deployment pipeline grants a role and immediately tries to read a secret, that delay can cause the deployment to fail. Access policies applied directly on the vault take effect without that lag, which matters when you're provisioning and deploying in the same pipeline run.

## Why interviewers ask this

This question is a quick filter for whether a candidate defaults to "secure by design" or "secure as an afterthought." It also tests whether you understand Azure's identity model well enough to avoid storing credentials at all, since managed identities are the whole point of the exercise, not just a nice-to-have.

## Follow-ups to expect

**Why not just use RBAC everywhere for consistency with other Azure resources?** Because Key Vault RBAC propagation delays can break deployment pipelines that provision access and immediately try to use it, so access policies are the safer default for Key Vault specifically.

**How does a managed identity actually get permission to read a secret?** You assign the identity an access policy on the vault, and from then on the app can request secrets at runtime without any stored credential.

**What else belongs in Key Vault besides connection strings?** Certificates and passwords belong there too. The idea is one centralized store for anything sensitive, not just database secrets.

## The common wrong answer

Most candidates get the first half right and stop there: they say "use Key Vault" and move on, without mentioning managed identities, which means they're still describing an app that needs some credential to get into the vault in the first place. Others go further and insist on RBAC for everything because it's the newer, more granular model, without acknowledging that the propagation delay can actually break a deployment in practice. Naming that tradeoff is what separates someone who has configured Key Vault from someone who has only read about it.
