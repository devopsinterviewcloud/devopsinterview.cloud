---
title: GitHub Actions Self-Hosted Runners - Setup Guide
description: How to set up GitHub Actions self-hosted runners, why ephemeral runners matter for security, and what interviewers actually probe for.
date: 2026-10-22
keywords: cicd, devops interview questions, github actions self hosted runners, github actions self hosted runners setup, github actions runners tutorial, cicd interview questions
category: cicd
youtube: MhP1sw3M1Hs
---

A team watching their GitHub Actions bill climb into the thousands eventually asks whether self-hosted runners make sense. This question comes up in interviews because it forces you to reason about cost and security at the same time, not just recite a setup command.

## The answer interviewers want

Self-hosted runners are machines you control that execute your workflows. Think of them as your own dedicated build servers instead of renting GitHub's hosted ones.

In practice, the setup is straightforward: you download the runner binary, use your repo's registration token to register it, then run the `config.sh` (or `config.cmd` on Windows) script. Once configured, the runner polls GitHub for jobs rather than GitHub pushing work to it.

The part candidates often miss: always use ephemeral runners for security. An ephemeral runner spins up, executes exactly one job, then gets torn down. Each job gets a fresh environment, so there's no leftover state, cached credentials, or build artifacts from a previous job that a later job (or a compromised workflow) could read. A long-lived, reusable self-hosted runner is a much bigger attack surface, especially if it ever runs workflows triggered from a public repo's pull requests.

## Why interviewers ask this

They're checking two things at once: do you understand the operational tradeoff of self-hosted runners (you save money on compute but take on patching, scaling, and isolation yourself), and do you default to the secure pattern without being prompted. Anyone can say "install the runner and point it at your repo." Fewer people volunteer that persistent runners are a security liability.

## Follow-ups to expect

**Why is a persistent self-hosted runner risky?** Because state carries over between jobs. Secrets, cached files, or malicious code dropped by one job can affect the next job that lands on the same machine, which is a bigger concern for public repos or untrusted PR workflows.

**Who should register the runner, and what does the registration token control?** The registration token ties the runner to a specific repo or org, so it should be treated like a credential and not left exposed in scripts or logs.

**When does self-hosted actually save money versus hosted runners?** It depends on how much build minutes you're burning on GitHub's hosted runners versus the cost and effort of running and maintaining your own fleet. The win is real, but it isn't free, someone has to keep the machines patched and scaled to the job queue.

## The common wrong answer

Most candidates describe the registration and `config.sh` steps correctly but stop there, treating self-hosted runners as a pure cost win with no downside. They skip the ephemeral piece entirely, which is the detail that actually separates a working setup from a secure one.
