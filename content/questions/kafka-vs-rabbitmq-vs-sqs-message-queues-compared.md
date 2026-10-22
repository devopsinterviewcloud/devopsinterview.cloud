---
title: Kafka vs RabbitMQ vs SQS - Message Queues Compared
description: Kafka vs RabbitMQ vs SQS for interviews: when to pick each, and why backpressure and missing dead-letter queues cause outages, not the broker.
date: 2026-10-22
keywords: microservices, devops interview questions, kafka vs rabbitmq vs sqs, message queue interview questions, kafka rabbitmq sqs comparison, microservices interview questions
category: microservices
youtube: nVHKQAL1oIs
---

Orders vanish overnight and the postmortem lands on the message queue. Interviewers bring up Kafka vs RabbitMQ vs SQS to see if you actually understand what each tool is built for, or if you just have a favorite.

## The answer interviewers want

Start with what each one actually is. Kafka is a distributed log built for huge throughput. RabbitMQ is a smart broker built for flexible routing. SQS is fully managed - AWS runs the ops for you.

That maps directly to when you'd pick each:

- **Kafka** for event streaming and replay, when you need consumers to re-read history or fan out the same events to many systems.
- **RabbitMQ** for complex routing, when messages need to go to different places based on content, priority, or topology.
- **SQS** when you just want AWS to handle it and don't want to run or tune a broker yourself.

Here's the part nobody tells you in the "pick a tool" answer: the outage in the scenario wasn't Kafka's fault. There was no dead-letter queue, so failing messages kept retrying without bound. Backpressure killed the system, not the broker. The real lesson is that it's never about picking the fastest broker. It's about matching backpressure handling to your failure mode - what happens when a consumer slows down, a message keeps failing, or a downstream service goes dark.

## Why interviewers ask this

This question filters out people who memorized a comparison chart from people who've actually operated one of these systems under load. They want to hear you reason about failure modes - retries, dead-letter queues, backpressure - not just repeat "Kafka is fast, SQS is managed." A good answer shows you know the outage usually comes from missing operational guardrails, not from the broker choice itself.

## Follow-ups to expect

**How would you stop a poison message from taking down a queue?** Add a dead-letter queue with a bounded retry count, so a message that keeps failing gets pulled out instead of retried forever.

**How would you design for message replay?** Kafka keeps a log you can re-read, which is why it fits event streaming; RabbitMQ and SQS generally remove messages once they're acknowledged, so replay isn't their strength.

**What happens when consumers can't keep up with producers?** That's backpressure, and without a plan for it - DLQs, bounded retries, slowing producers - the system backs up and fails regardless of which broker you chose.

## The common wrong answer

Most candidates answer this as a popularity contest: "Kafka, because it's the most scalable," with no mention of routing needs, operational overhead, or failure handling. The weaker version of that mistake is blaming the broker itself for an outage that was actually caused by missing dead-letter queues and unbounded retries - which is exactly the trap this question is designed to expose.
