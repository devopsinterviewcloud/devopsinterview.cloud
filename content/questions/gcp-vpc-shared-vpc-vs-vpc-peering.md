---
title: GCP VPC - Shared VPC vs VPC Peering
description: When to use Shared VPC vs VPC Peering in GCP: centralized admin, IAM requirements, and why startups often start with peering.
date: 2026-10-22
keywords: gcp, devops interview questions, gcp vpc interview questions, shared vpc vs vpc peering, gcp networking interview, google cloud vpc peering
category: gcp
youtube: 4fygvJZCoD4
---

This one comes up constantly in GCP architecture interviews because it's a quick way to check if a candidate actually understands organizational structure in GCP, not just networking theory. Anyone can describe peering as "two networks talking to each other," but explaining why Shared VPC requires more than just technical setup is where candidates separate themselves.

## The answer interviewers want

Think of Shared VPC as one IT department managing all office networks centrally. A host project owns the VPC, and service projects attach to it. This gives you centralized network administration and consistent security policies across every project that participates, because one team controls the subnets, firewall rules, and routing for everyone.

VPC Peering is more like separate offices agreeing to connect directly to each other. Each side keeps its own network, its own admin control, and its own policies, but you set up a direct connection between them so resources in each VPC can talk to resources in the other.

So the decision comes down to control. Use Shared VPC when you want one team enforcing consistent security policy across multiple projects, and you're fine with that team owning the network layer centrally. Use VPC Peering when teams need to keep independent control over their own networks but still need connectivity between them.

Here's the part that trips people up: Shared VPC isn't just a checkbox in a project's VPC settings. It requires organization-level setup and specific IAM roles to configure, because you're designating a host project and granting service project admins the right to use its subnets. That's an org-level decision, not a project-level one. Most startups can't even use Shared VPC initially, because they haven't set up that organizational structure yet. So in practice, a lot of early-stage teams start with VPC Peering by default, even if Shared VPC would be the better long-term answer once the org is mature enough to support it.

## Why interviewers ask this

This question tests whether you understand GCP's resource hierarchy, not just networking primitives. Anyone can define peering versus Shared VPC from a diagram, but interviewers want to see if you know the organizational and IAM prerequisites that make Shared VPC viable, and whether you can reason about when centralized control is worth the setup cost.

## Follow-ups to expect

- **What IAM roles are involved in setting up Shared VPC?** The source points to specific IAM roles being required at the organization level for designating host and service projects, which is part of why it's more than a simple project setting.
- **Why can't a new startup just set up Shared VPC on day one?** Because it depends on organization-level configuration, and many startups haven't established that org structure yet, so they default to peering instead.
- **If a team's needs change, can you migrate from Peering to Shared VPC later?** The underlying driver is whether you want centralized admin control or independent team control, so a migration would mean re-architecting around that organizational decision, not just a networking change.

## The common wrong answer

Candidates usually recite the definitions, Shared VPC centralizes, Peering connects independent networks, and stop there. They miss the organizational dependency entirely, treating Shared VPC as a purely technical networking choice instead of one that requires org-level IAM setup most small teams don't have in place yet.
