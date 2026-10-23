---
title: Kubernetes Cost Optimization - Right-Size Your Pods
description: Learn how to answer the Kubernetes cost optimization interview question: right-sizing pod requests, limits, and VPA without downtime.
date: 2026-10-22
keywords: finops, devops interview questions, kubernetes cost optimization, kubernetes resource requests limits, kubernetes cost optimization interview, k8s pod right sizing
category: finops
youtube: sN79fE2MMeg
---

Cloud bills balloon fast when pods request more CPU and memory than they ever use, and this question shows up constantly because cost control is now part of the SRE/Platform job description, not just a finance problem. Interviewers use it to see if you understand how Kubernetes scheduling actually works under the hood, not just whether you know the `kubectl` commands.

## The answer interviewers want

Start with resource requests and limits, because they do different jobs. Requests guarantee a pod a slice of a node's capacity. Limits cap how much it can consume so one runaway process can't starve its neighbors. Most teams set both once at deploy time and never revisit them, which is exactly how cost creep happens.

To fix that, use the Vertical Pod Autoscaler (VPA) to analyze historical usage and recommend better request and limit values based on actual consumption instead of guesses. For a quick, real-time check, `kubectl top pods` shows current CPU and memory usage so you can spot obvious outliers without waiting on VPA's longer-term analysis.

Here's the part most candidates miss: CPU *requests* affect scheduling cost more than limits do. The scheduler allocates node capacity based on requests, not actual usage. So a pod that requests 2 cores but only uses 200m is still blocking 2 cores' worth of capacity on that node, even though it's nearly idle. That unused capacity is what you're paying for. Right-sizing requests, not just trimming limits, is what actually shrinks your node count and your bill.

## Why interviewers ask this

This question separates people who treat Kubernetes as a black box from people who understand how the scheduler makes bin-packing decisions. It also checks whether you'd approach cost-cutting safely, using data (VPA, `kubectl top`) instead of just slashing numbers and hoping nothing falls over in production.

## Follow-ups to expect

- **Why does a CPU request matter more than a CPU limit for cost?** Because the scheduler reserves capacity based on requests, not real usage. A high request blocks node capacity other pods could use, even if the pod is idle most of the time, so it drives how many nodes you actually need.
- **How would you find over-provisioned pods across a large cluster?** Use `kubectl top pods` for a quick current snapshot, then lean on VPA's historical analysis to get recommended request and limit values for each workload rather than eyeballing it.
- **How do you right-size without risking an outage?** Change requests and limits gradually based on VPA recommendations and monitor, rather than making a single sweeping cut across every deployment at once.

## The common wrong answer

Most candidates jump straight to "just lower the limits" or talk only about autoscaling the cluster, and skip requests entirely. That misses the actual cost driver: oversized requests reserve node capacity whether or not the pod uses it, so a cluster can look fully packed on paper while real utilization is low and the bill stays high.
