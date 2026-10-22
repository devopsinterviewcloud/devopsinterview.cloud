---
title: Correlation IDs: Tracing a Request Across Services
description: How correlation IDs let you trace one request across a dozen microservices, from edge generation to log indexing.
date: 2026-10-22
keywords: observability, devops interview questions, correlation id, correlation id tracing, distributed tracing interview questions, microservices debugging interview
category: observability
youtube: LGsSiIR1N-I
---

A request hits your API gateway, fans out across ten services, and comes back broken. Which service caused it? This question shows up in almost every observability interview because it separates engineers who've actually debugged distributed systems from engineers who've only read about them.

## The answer interviewers want

The fix has three parts, and they have to happen in order.

First, generate a correlation ID, a unique identifier for the request, at the edge: your API gateway or load balancer, before the request touches any downstream service. This is the one ID that will represent the entire journey.

Second, propagate that ID through everything: every HTTP header, every queue message, every log line the request generates downstream. No exceptions. If one service drops the header when it calls the next service, or a background job strips it when publishing to a queue, you lose the thread right there and you're back to guessing.

Third, ship all your logs to one place, Elasticsearch, Loki, or whatever your stack uses, and index by that correlation ID. That's what lets you run a single search and see the full request journey across all ten services in one view, instead of SSHing into ten boxes and grepping by timestamp.

Do those three things and you go from ten services and zero clues to one ID and the full story.

## Why interviewers ask this

This question tests whether you understand distributed tracing as a system, not just a tool you bolted on. Anyone can name Jaeger or Zipkin. Interviewers want to know if you understand the plumbing underneath: where the ID originates, how it survives every hop, and why centralized indexing is what actually makes it useful during an incident.

## Follow-ups to expect

**What happens if a service doesn't propagate the header?** You get a broken chain, that service and everything downstream of it shows up as a dead end in your trace, and you're back to manual correlation by timestamp for that segment.

**Does this replace proper distributed tracing tools?** No, a correlation ID is the thread that ties log lines together; tools like Jaeger or Zipkin build span and timing data on top of that same propagation pattern.

**Where exactly should the ID be generated?** At the edge, the API gateway or load balancer, before the request reaches any internal service, so every downstream component inherits the same ID instead of generating its own.

## The common wrong answer

Most candidates jump straight to naming a tracing tool, Jaeger, Zipkin, X-Ray, and stop there, as if picking a product is the whole answer. That skips the part interviewers actually care about: the ID has to be generated once at the edge, propagated through every header, queue message, and log line without exception, and indexed centrally. A tool name without that propagation discipline just means you'll have gaps in your trace exactly when you need it most, mid-incident, at 3AM.
