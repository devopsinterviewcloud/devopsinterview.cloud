---
title: ECS vs EKS vs Lambda - When to Use Which?
description: A clear framework for choosing AWS Lambda, ECS, or EKS in interviews, with the reasoning interviewers want to hear.
date: 2026-10-22
keywords: aws, devops interview questions, ecs, eks, lambda
category: aws
---

Picking the wrong compute platform on AWS can mean months of wasted migration work and a bloated bill. This question shows up constantly because it's less about trivia and more about whether you can match infrastructure complexity to actual business need.

## The answer interviewers want

Start with the workload shape, not the hype.

Use **Lambda** for event-driven tasks that finish in under 15 minutes. Image processing, API responses, scheduled jobs. Anything short-lived and triggered by an event fits here.

Use **ECS** when you want containers without taking on Kubernetes complexity. It's a good fit for monoliths moving into containers, or simple microservices where you don't need the full orchestration feature set.

Use **EKS** when you need full Kubernetes features: multi-cloud portability, complex networking requirements, or you already have K8s expertise on the team that you'd be wasting otherwise.

The practical progression: start with Lambda, graduate to ECS when you outgrow it, and only move to EKS if you genuinely need what it offers. Teams that pick EKS too early end up carrying operational complexity they didn't need, and regretting it later.

## Why interviewers ask this

They want to know if you default to the trendiest option or actually reason about tradeoffs. Picking EKS by default is a common tell that someone optimizes for their resume instead of the team's operational capacity. This question also probes whether you understand the cost and staffing implications of each platform, not just the technical feature list.

## Follow-ups to expect

**"What would make you migrate from ECS to EKS later?"** Needing multi-cloud portability, complex networking that ECS can't handle, or inheriting a team with deep existing Kubernetes expertise that would go to waste on ECS.

**"Why not just run everything on Lambda?"** Lambda has a hard ceiling at 15 minutes of execution time, so anything longer-running or stateful doesn't fit. It's built for event-driven, short-lived work, not persistent services.

**"What's the risk of choosing EKS too early?"** You take on Kubernetes's operational complexity, cluster management, networking, and upgrade overhead, before you have the scale or requirements that justify it. That's extra burden on the team for no real payoff yet.

## The common wrong answer

Most candidates answer this by listing features of each service, EKS has more control, ECS is simpler, Lambda is serverless, without ever connecting it to a decision process. That reads as memorized documentation, not judgment. The stronger answer is the progression: start simple, add complexity only when a specific requirement forces your hand, and be explicit about what that requirement looks like for each jump.
