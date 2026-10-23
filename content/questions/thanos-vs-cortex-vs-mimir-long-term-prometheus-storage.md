---
title: Thanos vs Cortex vs Mimir - Long-Term Prometheus Storage
description: Thanos vs Cortex vs Mimir explained for DevOps interviews: when to pick each for long-term Prometheus storage and multi-tenancy.
date: 2026-10-22
keywords: observability, devops interview questions, prometheus long term storage, thanos vs cortex vs mimir, prometheus interview questions, observability interview questions advanced
category: observability
youtube: 2Za7VKWIhKE
---

Any shop running Prometheus past a handful of clusters eventually hits the retention and multi-tenancy wall, and interviewers use this topic to see if you understand the trade-offs between the three main long-term storage options rather than just name-dropping them.

## The answer interviewers want

Thanos is the federation king. It sits in front of multiple Prometheus instances and gives you effectively unlimited retention by shipping blocks to object storage (S3, GCS, etc). Pick it when you've got several Prometheus servers across clusters or regions and need a single global query view with cheap, long-term retention.

Cortex excels at multi-tenancy. If you're running a SaaS platform and need to fully isolate each customer's metrics from every other customer's, Cortex was built for exactly that isolation model.

Mimir is Grafana's rewrite of Cortex, and it has noticeably better query performance. It's built on the same multi-tenant architecture Cortex pioneered but is actively eating Cortex's lunch in terms of adoption, largely because of that query speed improvement.

So the short version: Thanos for federating existing Prometheus instances with long retention, Cortex/Mimir for multi-tenant, horizontally scalable metrics backends, and Mimir specifically when you want that Cortex-style architecture with better query performance out of the box.

## Why interviewers ask this

This question separates people who've only run single-node Prometheus from people who've actually operated it at scale. It tests whether you understand *why* Prometheus alone doesn't solve long-term retention or multi-tenant isolation, and whether you can map a real constraint (tenant isolation, unlimited retention, query speed) to the right tool instead of just reciting three names.

## Follow-ups to expect

- **How does object storage change the retention story?** Shipping blocks to S3 or GCS decouples retention from local disk, which is what lets Thanos offer effectively unlimited history instead of the weeks you'd get from local Prometheus storage alone.
- **Why would a SaaS company pick Cortex or Mimir over Thanos?** Because strict per-tenant isolation is a first-class design goal in Cortex and Mimir's architecture, whereas Thanos is built around federating and globally querying what are usually trusted, internal Prometheus instances.
- **Why is Mimir gaining ground over Cortex?** It's a rewrite of the same multi-tenant model with meaningfully better query performance, so teams already bought into Cortex's architecture get a faster drop-in replacement.

## The common wrong answer

Most candidates treat this as a vocabulary quiz: they rattle off that "Thanos, Cortex, and Mimir all do long-term Prometheus storage" and stop there. That misses the actual signal interviewers want, which is matching a specific operational constraint, like tenant isolation versus simple federation versus query speed, to the tool that was built to solve it. Saying all three names without explaining the trade-off reads as memorized, not understood.
