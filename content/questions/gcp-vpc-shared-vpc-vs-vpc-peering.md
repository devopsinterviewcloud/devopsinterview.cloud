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

Here's the part that trips people up: Shared VPC isn't just a checkbox in a project's VPC settings. It requires organization-level setup and specific IAM roles to configure, because you're designating a host project and granting service project admins the right to use its subnets. That's an org-level decision, not a project-level one. Projects that don't belong to an organization can't use Shared VPC at all, so early-stage teams that skipped that setup often start with VPC Peering by default, even if Shared VPC would be the better long-term answer. Creating the organization early, through Cloud Identity or Workspace, avoids that.

## Why interviewers ask this

This question tests whether you understand GCP's resource hierarchy, not just networking primitives. Anyone can define peering versus Shared VPC from a diagram, but interviewers want to see if you know the organizational and IAM prerequisites that make Shared VPC viable, and whether you can reason about when centralized control is worth the setup cost.

## Follow-ups to expect

- **What IAM roles are involved in setting up Shared VPC?** A Shared VPC Admin needs Compute Shared VPC Admin and Project IAM Admin at the organization or folder level to designate host and service projects, and service project admins need Compute Network User on the host project or specific subnets. That's part of why it's more than a simple project setting.
- **Can a new startup set up Shared VPC on day one?** Yes, once it has an organization resource and someone holding the Shared VPC Admin role. Teams that skipped creating the organization can't, so they default to peering instead.
- **If a team's needs change, can you migrate from Peering to Shared VPC later?** The underlying driver is whether you want centralized admin control or independent team control, so a migration would mean re-architecting around that organizational decision, not just a networking change.

## The common wrong answer

Candidates usually recite the definitions, Shared VPC centralizes, Peering connects independent networks, and stop there. They miss the organizational dependency entirely, treating Shared VPC as a purely technical networking choice instead of one that needs an organization and IAM setup that small teams often haven't done yet.
