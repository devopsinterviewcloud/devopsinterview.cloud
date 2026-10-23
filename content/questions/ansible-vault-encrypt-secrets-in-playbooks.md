---
title: Ansible Vault - Encrypt Secrets in Playbooks
description: How to answer the Ansible Vault interview question: encrypting secrets with AES256, vault password files in CI/CD, and avoiding plain text in repos.
date: 2026-10-22
keywords: config mgmt, devops interview questions, ansible vault tutorial, ansible vault secrets management, ansible encrypt passwords, ansible vault interview questions
category: config_mgmt
youtube: gPpp4enkUFM
---

A database password sitting in plain text inside a playbook is the kind of thing that gets found in a repo scan, or worse, in a breach report. Interviewers ask how you handle secrets in Ansible because it's a quick way to see if you've actually run playbooks in a team environment or just followed tutorials on a laptop.

## The answer interviewers want

Ansible Vault encrypts your variables using AES256. Think of it like a password-protected zip file for your secrets: anyone can see the file exists, but they can't read the contents without the key.

To create a new encrypted file, use `ansible-vault create`. To encrypt a single variable inline, use `ansible-vault encrypt-string`. When running a playbook that references encrypted content, you pass `--ask-vault-pass` so Ansible can decrypt at runtime.

That covers the basics, but here's the part that separates a working knowledge from production experience: in CI/CD pipelines, you don't use interactive prompts. A pipeline can't type a password when asked. Instead, use a vault password file, something the CI system reads from a secure location (a secrets manager, a protected environment variable, a mounted file) and points Ansible at directly.

The other detail worth stating out loud: encrypt the entire vars file, not individual strings scattered across playbooks. `ansible-vault encrypt-string` is useful for quick one-offs, but relying on it everywhere means secrets are mixed with non-secret config, which makes auditing and key rotation harder. Keeping all sensitive values in one encrypted file gives you a clean boundary between what's secret and what isn't.

End state: no plain text passwords in your repos, and a decryption flow that works the same whether a human or a pipeline is running the playbook.

## Why interviewers ask this

They're checking whether you've thought past "it works on my machine." Anyone can type `--ask-vault-pass` locally; the real signal is whether you know that doesn't work in automation, and whether you understand the tradeoff between encrypting individual strings versus whole files.

## Follow-ups to expect

**How do you handle vault password rotation?** You'd need to re-encrypt the vault files with the new password and update whatever secure store holds the password file that CI/CD reads from. The source doesn't go into tooling specifics here, so keep the answer at that level unless you have direct experience to add.

**Why not just use environment variables for secrets?** Environment variables aren't encrypted at rest and often end up logged or visible in process listings; Ansible Vault keeps the secret encrypted in the repo itself until decryption at runtime.

**What's the downside of encrypting the whole vars file instead of individual strings?** Diffs become harder to review since you can't see which specific value changed, but you get a simpler security boundary and fewer places secrets can leak from.

## The common wrong answer

Candidates often say "I use Ansible Vault" and stop there, without explaining how it actually runs in CI/CD. The giveaway is when someone describes typing a vault password interactively as if that's the whole workflow. That answer only works for a solo developer running playbooks by hand; it falls apart the moment a pipeline needs to run unattended, which is exactly the scenario interviewers are probing for.
