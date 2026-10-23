---
title: Azure Front Door vs Application Gateway - When to Use
description: Azure Front Door vs Application Gateway explained: when to pick global edge vs regional VNet load balancing for interviews.
date: 2026-10-22
keywords: azure, devops interview questions, azure front door vs application gateway, azure application gateway interview questions, azure load balancer comparison, azure networking interview
category: azure
youtube: AjBKJwEK0-U
---

Azure has two load balancing services that sound interchangeable until you actually have to pick one for a design, and interviewers use this question to see if you understand the difference between regional and global traffic management. It comes up constantly in Azure networking and architecture interviews because the wrong answer usually means an over-engineered or under-secured design.

## The answer interviewers want

The two services solve different problems at different layers, and most engineers reach for the wrong one by default.

`Application Gateway` is regional. It sits inside your VNet, which means it can do VNet integration directly and it's the right choice when you need a Web Application Firewall (WAF) in front of internal apps or anything that has to stay within a specific region's network boundary.

`Front Door` is global. It runs on Microsoft's edge network, not inside any single VNet, so it's built for routing and accelerating traffic across regions. Use it for global apps, especially ones that benefit from caching at the edge.

So the quick decision rule: internal apps, WAF requirements, or VNet integration point you to App Gateway. Global reach and caching point you to Front Door.

The detail that separates a good answer from a great one: you can chain them. Put Front Door in front of Application Gateway for global apps that still need VNet backends. Front Door handles the global edge routing and caching, then hands traffic off to Application Gateway, which does the regional, VNet-aware work including WAF enforcement close to the backend.

## Why interviewers ask this

This question tests whether you understand the regional-versus-global split in Azure's networking stack, not just that two products exist. It also probes whether you can combine services instead of treating each one as a standalone silo, since the chained pattern (Front Door to App Gateway) is a common real-world architecture for global apps with regional backends.

## Follow-ups to expect

- **Why would you need WAF at both layers if you chain them?** You generally wouldn't run full WAF policies at both layers for the same rules; the point of the chain is that Front Door handles global edge concerns while Application Gateway enforces WAF and routing against the VNet-resident backend.
- **What happens if your app is global but has no caching needs?** Caching is one driver for Front Door, but global reach and edge routing alone are still reasons to use it even without heavy caching requirements.
- **Could you use Application Gateway alone for a global app?** Not well, since Application Gateway is regional and sits in a single VNet, so it can't natively provide the global edge distribution that Front Door offers.

## The common wrong answer

Candidates often treat Front Door and Application Gateway as competing options and pick one based on vague familiarity, usually defaulting to Application Gateway because it's more commonly used for internal apps. The miss is not recognizing that they operate at different layers (global edge versus regional VNet) and that production architectures frequently chain them together rather than choosing one exclusively.
