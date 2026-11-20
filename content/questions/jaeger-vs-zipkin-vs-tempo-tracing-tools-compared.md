---
title: Jaeger vs Zipkin vs Tempo - Tracing Tools Compared
description: Jaeger vs Zipkin vs Tempo for distributed tracing interviews: when to pick each, what interviewers probe for, and common mistakes.
date: 2026-10-22
updated: 2026-11-20
keywords: observability, devops interview questions, jaeger vs zipkin vs tempo, distributed tracing tools comparison, observability interview questions, jaeger zipkin tempo differences
category: observability
youtube: 9MvW_fWRWSE
---

Distributed tracing tools come up constantly in platform and SRE interviews because picking one says a lot about how you think about scale, cost, and operational overhead. This question is less about trivia and more about whether you can match a tool to a real environment.

## The answer interviewers want

Jaeger is the go-to choice for Kubernetes environments. It handles high throughput well and deploys on Kubernetes through the OpenTelemetry Operator (the old Jaeger Operator only supported v1 and is archived), which makes it a natural fit if you're already running everything on k8s and want tracing that's managed the same way as the rest of your cluster.

Zipkin is the lightweight option. It has a simpler setup and lower resource usage, which makes it a good fit for smaller distributed systems where you don't need Jaeger's throughput ceiling or its Kubernetes-native tooling.

Tempo is the newer entrant. It's Grafana's tracing backend, and it's built to work closely with the rest of the Grafana observability stack (metrics, logs, dashboards) so you're not stitching together separate tools for correlation. The detail most people skip: Tempo uses object storage under the hood, which means significantly lower costs for long-term trace retention compared to the index-heavy storage models older tracing backends use.

So the short version: Jaeger for Kubernetes-native, high-throughput environments. Zipkin for smaller systems where simplicity and low resource footprint matter more than scale. Tempo when cost-effective long-term retention and tight integration with Grafana's stack are the priority.

## Side by side

| | Jaeger | Zipkin | Tempo |
|---|---|---|---|
| Origin | Uber, now a CNCF graduated project | Twitter, now run by the OpenZipkin community | Grafana Labs |
| Storage | Elasticsearch or OpenSearch, or Cassandra (ClickHouse support is still experimental) | Elasticsearch, Cassandra or MySQL | Object storage: S3, GCS or Azure Blob |
| Searching traces | Its own UI, by service, operation and tags | Its own UI, with similar search | Grafana, with TraceQL queries |
| Ingest | OTLP natively; Jaeger v2 is built on the OpenTelemetry Collector | Zipkin format; OTLP only through an experimental add-on, or the Collector converts to Zipkin format | OTLP, Jaeger and Zipkin formats |
| What gets expensive | Running and scaling the search index | The same | Query compute for big searches; storage itself is cheap |

## Keep the choice reversible

Instrument with OpenTelemetry and put a Collector in front, so the backend is a config detail. This Collector config sends the same traces to Jaeger and Tempo, which is also how you'd run a migration:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
exporters:
  otlp_grpc/jaeger:
    endpoint: jaeger-collector:4317
    tls:
      insecure: true
  otlp_grpc/tempo:
    endpoint: tempo-distributor:4317
    tls:
      insecure: true
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp_grpc/jaeger, otlp_grpc/tempo]
```

`insecure: true` is only for traffic that stays inside the cluster. Collector versions from before the rename call this exporter `otlp`. There's no `batch` processor either: it was deprecated in November 2026, and batching is now set in each exporter's `sending_queue`.

## The cost lever people forget: sampling

Whichever backend you pick, the volume you send decides most of the bill. Head sampling decides at the start of a request, in the SDK. It's cheap but blind, and it can drop the one slow request you needed. Tail sampling, in the Collector's `tail_sampling` processor, holds a trace's spans for a short decision window and then keeps what matters: traces with an error or over a latency threshold, plus a small share of the rest. The catch is that every span of a trace has to reach the same Collector, so at scale you put a load-balancing exporter in front that routes by trace ID.

[Distributed tracing with OpenTelemetry](/questions/distributed-tracing-with-opentelemetry-quick-start) covers the instrumentation side, and [the OpenTelemetry Collector](/questions/opentelemetry-collector-unified-telemetry-pipeline) explains the pipeline these configs plug into.

## Why interviewers ask this

This question screens for whether you've actually operated a tracing backend versus just read the README. Anyone can name three tools; fewer people can explain the operational tradeoffs: resource footprint, storage cost at retention scale, and how well it fits the rest of your observability stack.

## Follow-ups to expect

**"How does trace retention cost scale differently between these tools?"** Tempo's object storage model avoids the heavier indexing costs that drive up storage spend in other backends, which matters a lot once you're retaining traces for weeks or months instead of days.

**"Would you run two tracing backends in parallel during a migration?"** Yes, for a short window. Put an OpenTelemetry Collector in front and send the same spans to both backends through two exporters, check that traces match, then move dashboards over and retire the old backend once its retention period runs out.

**"What would push you away from Jaeger even in a Kubernetes shop?"** If the team is small and doesn't need Jaeger's throughput or operator-driven complexity, Zipkin's lighter setup can be the more pragmatic call.

## The common wrong answer

Candidates often answer with a feature checklist pulled from marketing pages and never mention cost or operational fit. They'll say "Jaeger is powerful" or "Tempo is modern" without connecting the choice to what the environment actually looks like: cluster setup, team size, retention requirements, and whether the tool needs to plug into an existing stack rather than stand alone.
