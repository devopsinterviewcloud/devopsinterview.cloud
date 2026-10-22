---
title: AWS EventBridge - Event-Driven Architecture
description: How AWS EventBridge differs from SQS and SNS for event-driven architecture, explained for DevOps and SRE interview prep.
date: 2026-10-22
keywords: aws, devops interview questions, aws eventbridge interview questions, eventbridge vs sns sqs interview, event driven architecture aws, aws eventbridge explained
category: aws
youtube: TjdYO-uFuRs
---

A platform team wiring up event-driven services eventually hits this question in interviews: why reach for EventBridge instead of just wiring SQS queues and SNS topics together? It's a common AWS architecture question because the three services overlap just enough to confuse people who've only used one of them.

## The answer interviewers want

EventBridge isn't just another queue or topic. It's a smart event router. Where SQS gives you a queue and SNS gives you pub/sub fan-out, EventBridge routes events based on content, using rules and event patterns written as JSON.

In production, the workflow looks like this: you create a custom event bus, define rules that match on event patterns (source, detail type, fields in the payload), and route matching events to multiple targets at once, things like `Lambda`, `SQS`, or even external APIs via API destinations. That content-based routing is the piece SQS and SNS don't do on their own. SNS fans out to subscribers, but it doesn't inspect the event body and route differently depending on what's inside it the way EventBridge rules do.

The detail that trips people up in real deployments: EventBridge charges per event published, not per hour or per queue. If you design your events at too fine a granularity, chatty services firing off tiny events constantly, the bill can get away from you fast. Getting event granularity right up front matters as much as getting the routing logic right.

The bigger point to land in an interview: EventBridge changes how you think about decoupling services. Instead of each service knowing where to send its output, services publish events and EventBridge decides, based on rules, who gets them.

## Why interviewers ask this

They're checking whether you understand the actual mechanism differences between these services rather than just knowing three AWS product names. They also want to see if you think about cost and event design as architectural decisions, not just plumbing, since EventBridge's per-event pricing has burned teams who didn't plan for it.

## Follow-ups to expect

**When would you still choose SQS over EventBridge?** When you need a simple durable queue with consumers pulling at their own pace, not content-based routing to multiple targets.

**How do you prevent EventBridge costs from exploding?** Design event granularity deliberately rather than emitting an event for every minor state change, since you're charged per event published.

**What happens when a rule matches but the target fails?** This is where you'd bring up retry behavior and dead-letter handling on targets, since EventBridge's routing logic doesn't replace the need to handle delivery failures.

## The common wrong answer

Most candidates describe EventBridge as "SNS but newer" or say all three services basically do pub/sub, and leave it there. That misses the core distinction: EventBridge routes on content using rules and patterns, which SQS and SNS don't do, and it misses the per-event cost model entirely, which is exactly the kind of production detail interviewers are listening for.
