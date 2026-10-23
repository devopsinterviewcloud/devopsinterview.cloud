---
title: ClusterIP vs NodePort vs LoadBalancer vs Ingress
description: When to use ClusterIP, NodePort, LoadBalancer, or Ingress in Kubernetes, and why the wrong choice quietly inflates cloud bills.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes service types interview question, clusterip vs nodeport vs loadbalancer vs ingress, kubernetes interview questions for beginners, kubernetes networking explained
category: kubernetes
youtube: Ld078C9lB7k
---

Every Kubernetes networking interview eventually lands on this question: when do you reach for ClusterIP versus NodePort versus LoadBalancer versus Ingress? It sounds like trivia, but interviewers use it to check whether you understand cost and architecture tradeoffs, not just the kubectl syntax.

## The answer interviewers want

Start with what each type actually does:

- `ClusterIP` is internal only, pod to pod. It's the default, and it's what you use for anything that doesn't need to be reached from outside the cluster.
- `NodePort` punches a port open on every node in the cluster. It's a blunt instrument, mostly useful for quick testing or edge cases where you need direct node access.
- `LoadBalancer` provisions a cloud load balancer, one per service. That's the detail people forget: it's one LB per service, not one per cluster.
- `Ingress` handles all HTTP traffic through a single entry point, routing to multiple backend services based on host or path rules.

The thing most people miss is cost. If you have ten microservices and you expose each one with its own `LoadBalancer` service, you're paying for ten cloud load balancers. One Ingress controller, backed by a single `LoadBalancer`, can front all ten. The practical pattern is: use `ClusterIP` for everything internal, and put one Ingress at the edge to handle external HTTP traffic. Reserve `LoadBalancer` for the Ingress controller itself, or for non-HTTP traffic that Ingress can't route, and skip `NodePort` outside of debugging.

So the direct answer to "should I just use LoadBalancer for everything" is no, and you should be able to say exactly why: it doesn't scale cost-wise, and it throws away the centralized routing, TLS termination, and path-based rules that Ingress gives you for free.

## Why interviewers ask this

This question separates people who've only run `kubectl expose` a few times from people who've actually operated a multi-service cluster in production. It tests whether you think about cloud spend as part of your architecture decisions, not just whether the service type "works."

## Follow-ups to expect

- **What happens if you need to route non-HTTP traffic, like raw TCP or a database connection?** Ingress is built for HTTP/HTTPS, so for other protocols you'd typically fall back to a `LoadBalancer` or `NodePort` service for that specific workload.
- **Why not just use NodePort for everything and skip the cloud load balancer cost entirely?** NodePort opens a port on every node, which pushes traffic management and failover onto whatever's in front of the nodes, and it doesn't give you the per-service HTTP routing Ingress does.
- **How would you explain the cost difference to a non-technical stakeholder?** Frame it as ten cloud load balancers running and billing continuously versus one, with Ingress doing the routing work that would otherwise require ten separate ones.

## The common wrong answer

The common mistake is listing the four types correctly but treating them as interchangeable, usually ending with "I'd just use LoadBalancer since it's simplest." That answer misses the cost implication entirely and signals the candidate hasn't operated a cluster with more than one or two services exposed externally.
