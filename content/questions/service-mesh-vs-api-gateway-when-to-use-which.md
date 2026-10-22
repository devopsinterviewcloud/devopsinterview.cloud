---
title: Service Mesh vs API Gateway - When to Use Which
description: API gateway vs service mesh: when to use each, how they layer together, and when adding a mesh is overkill for your service count.
date: 2026-10-22
keywords: networking, devops interview questions, service mesh vs api gateway, service mesh interview questions, api gateway kubernetes interview
category: networking
youtube: rsOeh0KnRD8
---

This question gets framed as a binary choice, and that's exactly why it trips people up in interviews. The honest answer is that API gateway and service mesh solve different problems and often run in the same architecture at the same time.

## The answer interviewers want

An API gateway handles traffic coming in from outside your system: authentication, rate limiting, routing requests to the right backend. A service mesh handles traffic between your own services internally: mTLS, retries, timeouts, and observability for service-to-service calls.

In a typical production setup, you'd run something like Kong or AWS API Gateway at the edge, and Istio or Linkerd inside the cluster. They layer on top of each other rather than competing. The gateway is the front door; the mesh is the internal nervous system.

The part most candidates miss is the operational cost of adding a mesh too early. If you only have three services, skip it. Istio in particular adds real overhead, extra sidecars, extra latency, extra moving parts to debug at 3AM, and that cost isn't justified when your service graph is small and traceable by hand. A reasonable rule of thumb: start with just a gateway, and add a mesh once you're running something like 10-plus services, where tracking retries, mTLS, and cross-service observability manually becomes unmanageable.

## Why interviewers ask this

This question screens for whether a candidate actually understands what each tool does, versus someone who's memorized that "Istio is for microservices." Interviewers are listening for the distinction between north-south traffic (gateway) and east-west traffic (mesh), and whether the candidate can justify not adopting a trendy tool when it doesn't fit the scale of the problem.

## Follow-ups to expect

**"What problems does a service mesh actually solve that a gateway can't?"** Mesh gives you mTLS between internal services, automatic retries, and per-call observability without instrumenting every service individually, none of which a gateway touches since it only sees traffic entering the system.

**"Why not just run a mesh from day one to be future-proof?"** Because Istio adds real overhead, sidecars, added latency, and new failure modes, and that complexity isn't worth paying for until the service count and interdependency actually demand it.

**"How do you decide the point at which you add a mesh?"** Watch the service count and the pain of tracking retries, failures, and traffic patterns manually; once that becomes unmanageable, generally somewhere past ten services, a mesh starts paying for itself.

## The common wrong answer

Most candidates pick a side and defend it like a trivia question, arguing either "gateway is enough" or "mesh is the modern standard," without acknowledging that the two sit at different layers of the traffic path. The other common mistake is recommending a mesh by default regardless of team size, treating it as a best practice rather than a tool with a real operational cost that only makes sense past a certain scale.
