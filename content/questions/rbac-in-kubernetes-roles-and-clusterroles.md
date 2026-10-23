---
title: RBAC in Kubernetes - Roles and ClusterRoles
description: Roles vs ClusterRoles in Kubernetes RBAC explained: scope, use cases, and the RoleBinding-to-ClusterRole trick interviewers probe for.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes rbac interview questions, kubernetes roles vs clusterroles, rbac kubernetes interview, kubernetes security interview questions
category: kubernetes
youtube: NDn06caHYIM
---

Kubernetes RBAC interview questions almost always include this one because it separates people who memorized `kubectl create role` from people who understand how permissions actually scope across a cluster. It's a quick way for an interviewer to check whether you've managed multi-tenant namespaces for real.

## The answer interviewers want

The core distinction is scope. A `Role` grants permissions within a single namespace. It only applies to resources inside that namespace, nothing else. A `ClusterRole` grants permissions cluster-wide, across all namespaces, and it's also required for cluster-scoped resources that don't belong to any namespace, like nodes or persistent volumes.

That maps directly to who uses each one. Application teams managing their own namespace use `Role` plus a `RoleBinding`, scoped tightly to what their service needs in that namespace. Platform admins who need to manage cluster-wide resources, or who need a permission set that applies everywhere, use `ClusterRole`.

The detail that trips people up: you can bind a `ClusterRole` to a single namespace by pairing it with a `RoleBinding` instead of a `ClusterRoleBinding`. This gives you a reusable permission set, defined once as a `ClusterRole`, that you then grant only within one namespace. It's a common pattern when you have a standard "view" or "edit" style role you want to apply consistently across many namespaces without redefining it each time, but still want to limit its effect to one namespace for a given binding.

So the mental model is: `Role`/`RoleBinding` for namespace-local permissions, `ClusterRole`/`ClusterRoleBinding` for cluster-wide permissions or cluster-scoped resources, and `ClusterRole`/`RoleBinding` as the hybrid for reusable-but-namespace-limited access.

## Why interviewers ask this

This question screens for whether a candidate actually understands RBAC's object model or just runs `kubectl create rolebinding` from memory. It also surfaces whether someone has operated a multi-tenant cluster, since the ClusterRole-plus-RoleBinding pattern only shows up once you've had to manage permissions at scale across many teams.

## Follow-ups to expect

- **When would you use a ClusterRoleBinding instead of a RoleBinding?** When the permission genuinely needs to apply across every namespace, such as a monitoring agent that reads pods cluster-wide.
- **Why not just give every team a ClusterRole directly?** Because that grants permissions everywhere, breaking namespace isolation; binding a ClusterRole with a RoleBinding keeps the reusable definition but limits its blast radius to one namespace.
- **What resources require a ClusterRole regardless of binding type?** Cluster-scoped resources like nodes or persistent volumes, since they don't live inside any namespace.

## The common wrong answer

Most candidates say "Role is namespaced, ClusterRole isn't" and stop there, treating it as a vocabulary question. That misses the reusability pattern of binding a ClusterRole to a namespace via a RoleBinding, which is usually the part interviewers actually want to hear to confirm hands-on RBAC experience.
