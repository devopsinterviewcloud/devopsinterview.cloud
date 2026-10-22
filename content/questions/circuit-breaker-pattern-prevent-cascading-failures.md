---
title: Circuit Breaker Pattern - Prevent Cascading Failures
description: How to answer the circuit breaker pattern interview question: closed, open, half-open states, and setting failure thresholds that matter.
date: 2026-10-22
keywords: microservices, devops interview questions, circuit breaker pattern, microservices interview questions, system design interview circuit breaker, fault tolerance microservices
category: microservices
youtube: vsfkPKVTGAU
---

One service starts failing, and instead of degrading gracefully, it takes the whole platform down with it. This is one of the most common microservices interview questions because it tests whether you understand resilience patterns or just know the buzzwords.

## The answer interviewers want

The circuit breaker pattern works like the electrical breaker in your house. When a service fails repeatedly, the circuit opens and stops sending requests to it, instead of letting every caller pile up and wait on a service that's already down.

There are three states to know:

- **Closed**: requests flow normally. The breaker is watching for failures but not blocking anything.
- **Open**: all requests are blocked immediately. No traffic goes to the failing service, so callers fail fast instead of timing out and tying up resources.
- **Half-open**: the breaker lets a small number of test requests through to check if the service has recovered. If they succeed, it closes again. If they fail, it goes back to open.

The part most candidates miss: the failure threshold that trips the breaker should be set based on business impact, not some arbitrary percentage like "open at 50% failure rate." A payment service and a recommendation service don't deserve the same tolerance for failure, so the threshold should reflect what breaking actually costs the business, not a number picked because it sounded reasonable.

## Why interviewers ask this

This question separates people who've memorized "circuit breaker" as a term from people who've actually reasoned about failure isolation. Interviewers want to see that you understand why fast failure is better than slow failure, and that you can connect a resilience pattern to real business tradeoffs instead of treating thresholds as a one-size-fits-all setting.

## Follow-ups to expect

**What happens to the requests that get blocked while the circuit is open?** They fail immediately instead of waiting on a timeout, which frees up resources and prevents threads or connections from piling up waiting on a dead service.

**How is a circuit breaker different from just adding retries?** Retries can make things worse by sending more load at an already struggling service. A circuit breaker stops sending requests entirely once it decides the service is unhealthy, which protects both the failing service and the callers.

**How would you decide where to set the failure threshold for a given service?** Base it on what failure actually costs that specific service's consumers, not a generic percentage. A critical path service might need a much lower tolerance for failure before tripping than a non-critical one.

## The common wrong answer

Most candidates can describe the three states fine, closed, open, half-open, because that part is easy to memorize. Where they fall apart is the threshold question. They'll say something like "open the circuit at 50% error rate" without being able to explain why that number, or how it changes based on what the service actually does. That's the tell that someone learned the pattern as trivia instead of understanding the judgment call behind it.
