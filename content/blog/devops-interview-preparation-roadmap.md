---
title: The 60-Day DevOps Interview Preparation Roadmap (2026 Edition)
description: A week-by-week plan to prepare for DevOps and SRE interviews in 60 days: what to study, what to build, what to skip, and how to convert preparation into offers.
date: 2026-07-16
keywords: devops interview preparation, devops roadmap 2026, sre interview prep, devops interview study plan, how to prepare for devops interview
---

Sixty days is enough to prepare for DevOps interviews properly, but only if you spend the time on what interviews actually test. Most candidates fail not because they know too little, but because they spread two months evenly across everything and arrive shallow in the five areas every loop drills: Linux and networking fundamentals, one cloud done well, Kubernetes, IaC and CI/CD, and production judgement. Here is the plan I would give a friend.

## The ground rules

**Depth beats coverage.** One cloud provider deeply beats three superficially. Interviewers follow up until they find the edge of your knowledge; make sure that edge is deep in the topics they care about, and be honest everywhere else.

**Everything you study, you build.** A concept you have not touched breaks down on the second follow-up question. Every week below has a build component. A laptop with Docker plus one cheap cloud account is enough; kind or k3d gives you Kubernetes for free.

**Stories are the currency of senior interviews.** Keep a running document of incidents, debugging sessions, and design decisions from your current and past work. Every study week, add one story the topic reminded you of. You will use these in behavioural rounds and in every "tell me about a time" follow-up.

## Weeks 1-2: Linux, networking, and the fundamentals filter

Interviews for every DevOps level start with a fundamentals filter, and it kills more candidates than Kubernetes ever will.

**Study:** processes and signals, file descriptors and permissions, systemd units, memory (what the OOM killer does and why), DNS resolution end to end, TCP handshakes and TIME_WAIT, TLS at a working level, HTTP semantics including load-balancer health checks.

**Build:** debug on purpose. Fill a disk and find it with `df` and `du`. Kill a process with each signal and explain the difference. Trace a slow DNS lookup with `dig`. Watch a TLS handshake in `curl -v`.

**The bar:** you can narrate "what happens when I type a URL and press enter" for five unbroken minutes, from DNS to rendered response, and answer interruptions at any layer.

## Weeks 3-4: one cloud, done properly

Pick the provider your target jobs mention most (in most markets that is AWS, but go where your applications point) and go deep: VPC networking (subnets, route tables, NAT, security groups vs NACLs), IAM (roles, policies, and why instance profiles beat access keys), compute and autoscaling, managed databases, object storage, load balancers, and cost awareness, which is a 2026 interview topic in its own right.

**Build:** a three-tier application from scratch, no console clicking allowed after day one; script or Terraform everything. Break it deliberately: wrong security group, missing route, over-restrictive IAM policy, and debug each.

**The bar:** given a networking symptom ("instance cannot reach the internet"), you list the four or five most likely causes in the order you would check them.

If your interviews span multiple clouds, [Cloud Interview Mastery: AWS, Azure & GCP](/ebooks/cloud-interview-mastery) maps the equivalent services and the questions asked about each, which saves you re-deriving everything three times.

## Weeks 5-6: Kubernetes, the main event

For most DevOps loops in 2026, Kubernetes is the longest technical conversation. Two weeks of focused work gets you conversational at depth.

**Study, in this order:** pods and the pod lifecycle, Deployments and rolling updates, Services and Ingress, ConfigMaps and Secrets, requests/limits and what happens when each is breached, probes and their misuse, StatefulSets, scheduling (taints, affinity, PodDisruptionBudgets), and the debugging workflows for Pending, CrashLoopBackOff, and NotReady nodes.

**Build:** run kind on your laptop. Deploy the app from weeks 3-4 onto it. Then run the breakage drills: bad image tag, memory limit too low, readiness probe pointing at the wrong port, a node drain that a PDB blocks. Each drill is a war story you now own.

**The bar:** handed `kubectl describe` output for a broken pod, you can identify the problem class in under a minute, and you can explain what the control plane does during a rolling update without notes. Our post on [Kubernetes interview questions](/blog/kubernetes-interview-questions-2026) is a good self-test at the end of week 6.

## Week 7: Infrastructure as Code

**Study:** Terraform state (what it is, why remote, locking, drift), plan/apply mechanics, modules and environment structure, import and moved blocks, and how Terraform runs safely in CI. State questions dominate real interviews; syntax questions barely appear. Test yourself against our [Terraform interview questions](/blog/terraform-interview-questions) list.

**Build:** put everything from weeks 3-6 under Terraform in a repo with plan-on-PR wired up, even if the "CI" is a GitHub Actions workflow on a personal repo.

**The bar:** you can answer "someone changed it in the console, what happens on the next plan?" instantly, and structure a dev/staging/prod layout on a whiteboard while naming its trade-offs.

## Week 8: CI/CD and GitOps

**Study:** pipeline anatomy (build, test, scan, artifact, deploy), deployment strategies and when each fits (rolling, blue/green, canary), GitOps with Argo CD or Flux and what reconciliation buys you over push deploys, secrets in pipelines (OIDC federation over static keys), and rollback thinking: how fast, triggered by what signal.

**Build:** a pipeline that ships your app to your kind cluster via Argo CD. Then break a deploy and roll it back, and note the time it took; "our rollback was two minutes because Git revert re-synced" is a lovely sentence to say in an interview. For the full progressive-delivery picture, [Modern CI/CD & GitOps](/ebooks/modern-cicd-gitops) covers pipelines, Argo CD, and canary analysis at interview depth.

## Weeks 9-10 (senior track): observability, reliability, security

If you are interviewing at senior or SRE level, these two weeks are what separate you.

**Study:** SLIs, SLOs and error budgets with real numbers, the three telemetry types and when each answers a question (metrics for "is it broken", traces for "where", logs for "why"), alerting philosophy (page on symptoms, not causes), incident response roles, and the security topics loops now include: least privilege, supply chain basics, and secrets management.

**Build:** put Prometheus and Grafana on your cluster, define one SLO for your app, and make one alert fire for the right reason. Run one game-day against yourself.

**The bar:** you can design an alerting strategy that would not page anyone at 3 a.m. for a cause that self-heals, and defend it. This is precisely the ground [Senior DevOps & SRE Handbook](/ebooks/senior-devops-handbook) covers, question by question.

## The final two weeks: convert knowledge into offers

**Mock out loud.** Answering in your head feels fluent; answering out loud exposes every gap. Record yourself on the twenty most likely questions, or drill with a friend who interrupts with follow-ups.

**Prepare eight stories.** Incidents, migrations, conflicts, failures. Structure each as situation, action, result, and what changed afterwards. Senior loops are half stories.

**Do reconnaissance per company.** Read their engineering blog and job description; a loop at a Kubernetes-heavy shop and one at a serverless shop deserve different final-week emphasis.

**Day-of logistics matter more than people admit.** Question frameworks, whiteboard habits, what to ask the interviewer, salary conversation timing. We wrote the Interview-Day Playbook for exactly this, and it comes free with every [book purchase](/#ebooks).

## The compressed version

If you have less than 60 days: weeks 1-2 fundamentals are non-negotiable, one cloud at depth beats everything else, Kubernetes gets whatever time remains, and Terraform state plus one prepared incident story covers a surprising fraction of the rest. The [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle) packages all five books (250+ questions with worked answers across cloud, containers, IaC, CI/CD and SRE) if you want the structured version of this entire roadmap in one place.
