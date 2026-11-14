---
title: KEDA - Event-Driven Autoscaling for Kubernetes
description: How KEDA enables event-driven Kubernetes autoscaling using queue depth and custom metrics, including scale-to-zero for batch workloads.
date: 2026-10-22
keywords: kubernetes, devops interview questions, keda kubernetes autoscaling, kubernetes event driven scaling, keda interview questions, kubernetes horizontal pod autoscaler
category: kubernetes
youtube: 8EJcXL8lJQw
---

A recruiter asks how you'd autoscale a Kubernetes deployment when the real signal for load isn't CPU but something like queue depth or request volume. This comes up a lot because CPU-based HPA is the usual starting point, and it isn't always the right signal for the workload.

## The answer interviewers want

KEDA stands for Kubernetes Event-Driven Autoscaler. It scales pods based on external metrics instead of just CPU or memory, things like queue length, database connections, or HTTP request rate.

You define a `ScaledObject` that watches an external source, say a queue's depth. When messages pile up, KEDA scales your consumer pods up to work through the backlog. When there are no messages, it scales the deployment down to zero pods.

That last part is the detail that separates a real answer from a surface-level one: KEDA can scale to zero. For years the standard Horizontal Pod Autoscaler stopped at one replica. Kubernetes 1.37 added HPA scale-to-zero (beta, on by default), but only for object or external metrics, so something still has to supply those. KEDA does that and handles the zero-to-one activation itself.

This makes KEDA a strong fit for batch jobs and consumers that only need to run when there's actual work queued up. Instead of keeping idle pods running around the clock waiting for the occasional burst, you let the workload spin down completely. Pair that with a node autoscaler that removes the empty nodes, and you stop paying for that compute until a message shows up.

## Why interviewers ask this

They want to know if you think about autoscaling in terms of the actual business signal driving load, not just whatever metric is easiest to wire up. CPU is a proxy for load, and a bad one for queue-based or bursty workloads. This question also checks whether you know how to get scale-to-zero, through KEDA or through HPA on Kubernetes 1.37 and later, because that has real cost implications.

## Follow-ups to expect

**How does KEDA interact with HPA under the hood?** KEDA works alongside the HPA mechanism rather than replacing it: it creates an HPA, feeds it external metrics for scaling between one and many replicas, and handles scaling to and from zero itself. HPA can now scale to zero on its own too, but only from Kubernetes 1.37 and only on object or external metrics.

**What workloads are a bad fit for scale-to-zero?** Anything latency-sensitive where a cold start to spin a pod back up would hurt user experience is a poor candidate; batch consumers tolerant of a short delay are the ideal case.

**What metrics sources can trigger a ScaledObject?** Any KEDA scaler: Kafka, RabbitMQ or SQS queue depth, a PostgreSQL query, Redis list length, a Prometheus query, a cron schedule or a CloudWatch metric, among dozens more.

## The common wrong answer

Candidates often describe KEDA as "just HPA with extra metrics" and stop there, missing the scale-to-zero capability entirely. That's the detail interviewers are listening for, because it's the difference between modestly better autoscaling and actually eliminating idle-pod cost for intermittent workloads like batch consumers.
