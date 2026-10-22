---
title: OpenTelemetry Collector - Unified Telemetry Pipeline
description: Why interviewers ask about the OpenTelemetry Collector instead of shipping telemetry straight to a backend, and how to answer well.
date: 2026-10-22
keywords: observability, devops interview questions, opentelemetry collector, opentelemetry collector interview questions, otel collector explained
category: observability
youtube: x5xtgaAuAQU
---

Shipping telemetry straight from your app to a single observability backend looks simpler on day one, but it quietly locks you into that vendor and that schema. This question shows up constantly in observability interviews because it separates people who've only used a dashboard from people who've run the pipeline underneath it.

## The answer interviewers want

The OpenTelemetry Collector exists because direct shipping is a trap, not a shortcut. It's a pipeline with three stages: receivers pull data in, processors reshape it, exporters push it out. Your application code only ever needs to speak one protocol, OTLP. That's the whole point: the app stays dumb and portable.

In practice you run the Collector in two layers. An agent runs per node (sidecar or daemonset) to receive OTLP from local apps, and that agent fans out to a gateway cluster that does the heavier processing and routing before exporting onward. Because the app only knows OTLP, swapping backends later, or adding a second one, is a config change on the Collector, not an application redeploy.

The detail most candidates skip is the `memory_limiter` processor. Without it, a trace storm (a sudden spike in volume) can OOM kill the whole Collector pipeline, taking down telemetry for every service behind it at the worst possible moment. Direct-to-backend shipping isn't the simpler option, it's deferred complexity. You're just moving the vendor lock-in and the lack of a buffering layer into production and calling it a design decision.

## Why interviewers ask this

They're checking whether you understand the Collector as an architectural decoupling layer, not just another agent to install. The follow-up signal they want is whether you've thought about failure modes in the telemetry path itself, since a pipeline that falls over under load defeats its own purpose.

## Follow-ups to expect

- **What happens if the gateway cluster goes down?** Agents typically buffer briefly and retry, but this is why capacity planning and the memory limiter matter on both the agent and gateway tiers, not just one.
- **Why not just use vendor-specific SDKs instead of OTLP?** Vendor SDKs bake the backend choice into your application code; OTLP keeps the app backend-agnostic so the Collector, not the app, owns routing and vendor decisions.
- **How would you change exporters without downtime?** Since the app only speaks OTLP to the Collector, you add or swap exporters in the Collector config and reload it, with no application redeploy required.

## The common wrong answer

Most candidates describe the Collector as "just a proxy" or say it's only useful for converting formats between tools. That misses the processor stage entirely, especially the memory limiter, and it skips the bigger point: the Collector is what lets you change backends and topology without ever touching application code.
