---
title: Reverse Proxy vs Load Balancer vs API Gateway
description: Reverse proxy vs load balancer vs API gateway explained for DevOps interviews: what each layer does and how they work together.
date: 2026-10-22
keywords: networking, devops interview questions, reverse proxy vs load balancer, api gateway vs load balancer, system design interview questions
category: networking
youtube: kaEpMqpqpaA
---

A system design or networking round will almost always poke at whether you actually know where a reverse proxy ends and a load balancer or API gateway begins. Most engineers use the terms interchangeably in conversation, which is exactly what trips them up when an interviewer asks for the precise distinction.

## The answer interviewers want

Think of these as three layers that solve different problems, even though they often sit in the same request path.

A **reverse proxy** sits in front of a server and handles requests on its behalf: terminating TLS, caching, compressing responses, and forwarding traffic to a backend. `nginx` is the classic example.

A **load balancer** distributes traffic across multiple backend instances so no single server gets overwhelmed and traffic keeps flowing if one instance dies. `HAProxy` is the classic example.

An **API gateway** manages APIs specifically: routing requests to the right service, handling auth, rate limiting, and request/response transformation. `Kong` is the classic example.

The trick interviewers are listening for is whether you know these aren't mutually exclusive. In a real stack they often work together: a request might hit a reverse proxy for TLS termination, get load balanced across a fleet of API gateway instances, and the gateway then routes it to the correct microservice. Naming one tool and claiming it does all three is the tell that you haven't actually operated this kind of stack.

## Why interviewers ask this

This question is a quick way to check whether you understand network request flow at a conceptual level or just know product names. It also signals whether you can reason about layered architecture, since production systems rarely use just one of these components in isolation. A clean answer shows you can map tools to responsibilities instead of treating them as synonyms.

## Follow-ups to expect

**Can one tool do all three jobs?** Some tools blur the lines, for example `nginx` can do basic load balancing and some reverse proxies add gateway-like features, but the underlying concepts are still distinct and worth naming separately in an answer.

**Where would you put TLS termination in this stack?** Typically at the reverse proxy or load balancer layer, before traffic reaches the API gateway or backend services, so backend instances don't each have to manage certificates.

**Why would you need an API gateway if you already have a load balancer?** Because a load balancer only distributes traffic; it doesn't handle concerns like auth, rate limiting, or routing by API path or version, which is the API gateway's job.

## The common wrong answer

The most common mistake is treating these as three names for the same thing, usually by describing a reverse proxy and then just restating it when asked about load balancing or API gateways. The second most common mistake is picking one tool, often `nginx`, and claiming it single-handedly covers all three roles without acknowledging that each layer has a distinct responsibility even when a single product can technically perform more than one of them.
