---
title: Distributed Tracing with OpenTelemetry - Quick Start
description: How to answer the OpenTelemetry distributed tracing interview question: spans, exporters, and why sampling matters in production.
date: 2026-10-22
keywords: observability, devops interview questions, opentelemetry distributed tracing, distributed tracing tutorial, opentelemetry quick start, microservices observability
category: observability
youtube: 9nq3uVq-PfU
---

A request hits your API gateway, fans out across fifteen microservices, and something times out. Which one? Without tracing, you're grepping logs across fifteen hosts hoping to get lucky. This question shows up because almost every real production system is distributed, and "how do you debug it" separates people who've actually run one from people who've only read about them.

## The answer interviewers want

OpenTelemetry creates a breadcrumb trail for a request as it moves through your system. Each service adds spans to a trace, and those spans show exactly where the request went and how long each hop took. You get the full path and the latency at every step, not just "service B is slow."

Getting it running is mechanically simple: add the OpenTelemetry SDK to your app, instrument your HTTP calls, and configure an exporter to ship the data somewhere you can view it (a backend like Jaeger, Tempo, or a vendor collector). In practice that's a handful of lines of code for full request visibility across the call chain.

The part candidates usually skip: always set sampling rates in production. Tracing every single request sounds great until you realize full tracing will crush your performance and your bill. You don't need 100% of traces to find the slow service or the failing dependency, you need a representative sample plus the ability to capture the interesting ones (errors, high latency) reliably.

## Why interviewers ask this

They want to know if you can go from "something's slow" to "here's the exact span that's slow" without guessing. They're also checking whether you understand the cost side of observability, not just the instrumentation side, since tracing everything is an easy way to blow up both your tracing backend's storage and your cloud bill.

## Follow-ups to expect

**How would you decide what to sample?** You'd keep a baseline rate for normal traffic but bias toward always capturing errors and high-latency requests, since those are the traces you actually need when debugging.

**What happens if one service in the chain isn't instrumented?** The trace breaks at that point. You lose visibility into anything downstream of the gap, which is usually how teams discover which services still need the SDK added.

**Where does the exported data actually go?** You configure an exporter to send spans to a backend for storage and querying. Without that step, instrumentation alone doesn't give you anything to look at.

## The common wrong answer

Candidates often describe tracing as something you flip on and get infinite visibility for free. They'll explain spans and context propagation in detail but never mention cost or sampling, which signals they've read the docs but never run OpenTelemetry at real traffic volume. The interviewer is listening for that sampling caveat specifically, because it's the thing that bites teams in production.
