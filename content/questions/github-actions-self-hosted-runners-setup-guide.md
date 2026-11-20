---
title: GitHub Actions Self-Hosted Runners - Setup Guide
description: How to set up GitHub Actions self-hosted runners, why ephemeral runners matter for security, and what interviewers actually probe for.
date: 2026-10-22
updated: 2026-11-20
keywords: cicd, devops interview questions, github actions self hosted runners, github actions self hosted runners setup, github actions runners tutorial, cicd interview questions
category: cicd
youtube: MhP1sw3M1Hs
---

A team watching their GitHub Actions bill climb into the thousands eventually asks whether self-hosted runners make sense. This question comes up in interviews because it forces you to reason about cost and security at the same time, not just recite a setup command.

## The answer interviewers want

Self-hosted runners are machines you control that execute your workflows. Think of them as your own dedicated build servers instead of renting GitHub's hosted ones.

In practice, the setup is straightforward: you download the runner, run the `config.sh` (or `config.cmd` on Windows) script with your repo's URL and registration token to register it, then start it with `run.sh` or install it as a service. Once configured, the runner polls GitHub for jobs rather than GitHub pushing work to it.

The part candidates often miss: always use ephemeral runners for security. An ephemeral runner takes exactly one job, then GitHub deregisters it, and your autoscaler (ARC or your own scripts) destroys the machine or container and starts a clean one. That's what gives each job a fresh environment, with no leftover state, cached credentials, or build artifacts from a previous job that a later job (or a compromised workflow) could read. The flag alone wipes nothing. A long-lived, reusable self-hosted runner is a much bigger attack surface, especially if it ever runs workflows triggered from a public repo's pull requests.

## Hosted vs self-hosted side by side

| | GitHub-hosted | Self-hosted, persistent | Self-hosted, ephemeral |
|---|---|---|---|
| Clean machine for every job | Yes | No | Yes |
| Who patches the OS and tools | GitHub | You | You, in the runner image |
| Scaling | Automatic | By hand or your own scripts | An autoscaler such as ARC |
| Reaches your private network | Not by default | Yes | Yes |
| Public repositories | Fine | Unsafe | Still risky: GitHub advises against self-hosted runners on public repos |
| What you pay for | Standard runners are free on public repos; private repos draw on the plan's included allowance, then pay for usage | Your machines and the time to run them | Your machines and the time to run them |

## Ephemeral runners on Kubernetes with ARC

The usual way to get ephemeral runners at scale is GitHub's Actions Runner Controller with runner scale sets. Store a GitHub App's credentials as a Secret, install the controller once, then one scale set per kind of runner:

```bash
kubectl create namespace arc-runners
kubectl create secret generic arc-github-app --namespace arc-runners \
  --from-literal=github_app_id=123456 \
  --from-literal=github_app_installation_id=7890123 \
  --from-file=github_app_private_key=app.private-key.pem

helm install arc \
  --namespace arc-systems --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

helm install linux-x64 \
  --namespace arc-runners \
  --set githubConfigUrl="https://github.com/your-org" \
  --set githubConfigSecret=arc-github-app \
  --set minRunners=0 --set maxRunners=20 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

Workflows then use the installation name as the label, `runs-on: linux-x64`. Each job gets a fresh pod that's deleted when the job finishes, and with `minRunners=0` no idle runners wait around when there's nothing to do. A GitHub App is a better choice than a personal access token here, because it isn't tied to one person and its permissions can be narrowed.

On a single VM without Kubernetes, the same idea works with the `--ephemeral` flag:

```bash
./config.sh --url https://github.com/your-org/your-repo --token "$REG_TOKEN" \
  --ephemeral --labels linux,x64,build --unattended
./run.sh
```

The registration token expires after an hour, so a script that creates fresh runners fetches a new one from the API each time. And since the flag only deregisters the runner after its one job, the script also has to throw the VM away and start a clean one.

A few more hardening steps interviewers like to hear: limit which repositories can use a runner group, give jobs cloud access through OIDC instead of long-lived secrets, and avoid ARC's Docker-in-Docker mode unless you need it, since it runs a privileged container. [Reusable workflows](/questions/github-actions-reusable-workflows-explained) and [the matrix strategy](/questions/github-actions-matrix-strategy-test-across-versions) cover the workflow side.

## Why interviewers ask this

They're checking two things at once: do you understand the operational tradeoff of self-hosted runners (you save money on compute but take on patching, scaling, and isolation yourself), and do you default to the secure pattern without being prompted. Anyone can say "install the runner and point it at your repo." Fewer people volunteer that persistent runners are a security liability.

## Follow-ups to expect

**Why is a persistent self-hosted runner risky?** Because state carries over between jobs. Secrets, cached files, or malicious code dropped by one job can affect the next job that lands on the same machine, which is a bigger concern for public repos or untrusted PR workflows.

**Who should register the runner, and what does the registration token control?** The registration token ties the runner to a specific repo or org, so it should be treated like a credential and not left exposed in scripts or logs.

**When does self-hosted actually save money versus hosted runners?** It depends on how much build minutes you're burning on GitHub's hosted runners versus the cost and effort of running and maintaining your own fleet. The win is real, but it isn't free, someone has to keep the machines patched and scaled to the job queue.

## The common wrong answer

Most candidates describe the registration and `config.sh` steps correctly but stop there, treating self-hosted runners as a pure cost win with no downside. They skip the ephemeral piece entirely, which is the detail that actually separates a working setup from a secure one.
