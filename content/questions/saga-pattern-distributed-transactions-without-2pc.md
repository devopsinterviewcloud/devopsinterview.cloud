---
title: Saga Pattern - Distributed Transactions Without 2PC
description: How to handle distributed transactions across microservices without 2PC: the Saga pattern, choreography vs orchestration.
date: 2026-10-22
keywords: microservices, devops interview questions, saga pattern distributed transactions, saga pattern microservices interview, distributed transactions without 2PC, microservices interview questions advanced
category: microservices
youtube: 1rdJD98yTuM
---

Distributed transactions across microservices come up in almost every system design interview once you mention splitting a monolith apart. Interviewers want to see if you reach for two-phase commit out of habit, because 2PC is a blocking protocol that will take down your cluster the moment one participant stalls or drops.

## The answer interviewers want

2PC is the wrong answer here. The pattern you want is the **Saga pattern**: you split one distributed transaction into a series of local transactions, one per service, and each local transaction publishes an event when it completes. If any step fails, you don't roll back a global lock, you run **compensating transactions** that undo the previous steps in reverse.

There are two ways to implement a saga:

- **Choreography**: services react to each other's events directly. No central coordinator. Each service listens for the events it cares about and decides what to do next.
- **Orchestration**: a single coordinator - something like Temporal - drives the whole flow explicitly, calling each service in sequence and triggering compensations when a step fails.

Choreography looks clean on a whiteboard with two or three services. It falls apart once you've got eight services reacting to each other's events, because there's no single place to see or trace the flow - you end up chasing event chains across logs to figure out what actually happened. For anything beyond a trivial saga, orchestration wins because the coordinator gives you one place to see the state of the transaction and one place to reason about failure handling.

## Why interviewers ask this

This question separates people who've only read about microservices from people who've had to debug a partial failure in production. The interviewer wants to know you understand why 2PC doesn't survive network partitions and service restarts at scale, and whether you can name the actual tradeoff between choreography and orchestration rather than just reciting "use sagas."

## Follow-ups to expect

- **How would you implement a compensating transaction for a payment step?** You'd write a local transaction that reverses the specific effect of the original step, for example issuing a refund instead of trying to undo the charge at the database level - compensation is business-logic-specific, not a generic rollback.
- **When would you still choose choreography?** For a small number of services with a simple, linear flow, where the overhead of running a coordinator isn't worth it yet.
- **What happens if a compensating transaction itself fails?** That's the hard edge case orchestration tools like Temporal are built to handle, since the coordinator can retry or escalate instead of leaving the event chain in an unknown state.

## The common wrong answer

Most candidates either say "use two-phase commit" without acknowledging why it doesn't work at scale, or they say "use sagas" and stop there without being able to explain compensating transactions cold or name the choreography-versus-orchestration tradeoff. Saying "saga pattern" alone doesn't demonstrate you've actually thought through how the flow traces and fails in production.
