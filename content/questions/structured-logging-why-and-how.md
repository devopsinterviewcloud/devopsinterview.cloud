---
title: Structured Logging - Why and How
description: A DevOps interview answer on structured vs unstructured logging: what JSON logging gives you, when plain text still makes sense.
date: 2026-10-22
keywords: observability, devops interview questions, structured logging interview questions, structured logging vs plain text, json logging best practices, devops logging interview
category: observability
youtube: GtvjaOF6PBA
---

This question shows up in almost every observability-focused interview because so many teams have logs that humans can read but machines can't use. The interviewer wants to know if you understand logging as a data problem, not just a debugging convenience.

## The answer interviewers want

Unstructured logs are free-form text. A human can read them, but a machine has to guess at the structure, usually with regex, to pull anything useful out.

Structured logs use a consistent format, typically JSON. Every field has a name and a type: `timestamp`, `level`, `service`, `request_id`, and so on. Because the shape is consistent, tools like the ELK stack can automatically index and search these logs. You query on a field name instead of writing a regex pattern to extract it.

That said, don't reflexively log everything as JSON. High-frequency debug logs can stay plain text, because structured logging adds overhead (serialization, larger payloads) and at high volume that cost adds up. The point of structured logging is to make your logs actually useful to your tooling, not to turn every log line into a formatting exercise. Use it where it earns its keep: anything that feeds search, alerting, or dashboards. Keep the noisy, throwaway debug output lightweight.

Done right, your logs stop being something that just takes up disk space and starts being something you can actually query during an incident.

## Why interviewers ask this

They're checking whether you think about logs as structured data that downstream systems consume, not just text dumped to stdout. This is a proxy for whether you've actually built or operated a log pipeline, versus just writing `console.log` and hoping someone greps it later. It also tests judgment: do you know structured logging has a cost, or do you treat it as free?

## Follow-ups to expect

- **Why not just use regex to parse unstructured logs at query time?** It works, but it's brittle. Log formats drift, regex breaks, and queries get slower as volume grows; structured fields are indexable and searchable without that overhead.
- **What fields would you standardize across services?** At minimum something like timestamp, log level, service name, and a request or correlation ID, so logs from different services can be tied together.
- **Where would you deliberately keep logs unstructured or plain text?** High-frequency debug logging, where the performance cost of structuring and serializing every line outweighs the benefit of making it queryable.

## The common wrong answer

Candidates often answer this as if structured logging is purely a formatting choice: "JSON instead of plain text." That misses the actual point, which is machine-indexability versus regex parsing. Weaker answers also treat structured logging as an all-or-nothing rule, converting every log line to JSON without considering the serialization cost on high-volume debug output. A strong answer shows you know when structure helps and when it's just overhead.
