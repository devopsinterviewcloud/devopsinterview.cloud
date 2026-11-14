---
title: API Gateway vs Service Mesh - Different Problems
description: When to use an API Gateway vs a service mesh in interviews: what each handles, when teams need both, and common mix-ups.
date: 2026-10-22
keywords: microservices, devops interview questions, api gateway vs service mesh, microservices interview questions, api gateway service mesh difference, microservices architecture interview
category: microservices
youtube: AGlrPBsB5SU
---

A classic trap question in system design and platform interviews: candidates often treat API Gateway and Service Mesh as competing tools instead of complementary ones. Getting the boundary wrong signals you haven't actually operated either, which is exactly what interviewers want to catch.

## The answer interviewers want

A lot of engineers assume API Gateway and Service Mesh solve the same problem. Their features overlap, but they're built for different jobs.

An **API Gateway** handles external traffic coming into your system. That means things like authentication, rate limiting, and routing requests from outside the cluster to the right backend service. It's the front door.

A **Service Mesh** manages service-to-service communication inside your cluster. It's concerned with how your internal services talk to each other once a request is already in the building, not how it got there.

In practice, you often need both. The Gateway handles client-facing concerns at the edge, and the Mesh handles internal concerns between services. One doesn't replace the other; they sit at different layers of the same system.

## Why interviewers ask this

This question is a quick filter for whether you understand traffic boundaries in a distributed system. Anyone can name both tools, but conflating them suggests you've read about them without deploying them. Interviewers are also checking whether you can reason about layered responsibility instead of treating infrastructure as one undifferentiated pile of "networking stuff."

## Follow-ups to expect

**"Could you use a Service Mesh to handle external traffic instead of a Gateway?"**
Partly. A mesh's ingress gateway, Istio's for example, can terminate TLS, validate JWTs and apply rate limits to external traffic. What it doesn't give you is API management: developer keys, usage plans, request transformation, a portal. If outside clients need those, put a Gateway in front; if they don't, the mesh ingress can be enough.

**"Why would a system need both at once?"**
 Because they cover different hops in the request path. The Gateway deals with auth, rate limiting, and routing as a request enters the system from a client; the Mesh then governs how that request moves between internal services. Removing either one leaves a gap at that layer.

**"What's the risk of only having a Gateway and no Mesh, or vice versa?"**
 With only a Gateway, internal calls get no mTLS, retries or tracing unless each service or the network adds them. With only a Mesh, its ingress gateway covers basic edge control, but you lose API management like keys and quotas. Each can cover part of the other's job; neither covers all of it.

## The common wrong answer

The weak answer treats them as interchangeable because the feature lists overlap. The overlap is real: Istio's ingress gateway can handle TLS, JWT auth and rate limiting for external traffic, and a Gateway can front internal APIs. What the stronger answer adds is what each is built around: the Gateway manages the API contract with outside clients (keys, quotas, versioning), the Mesh manages every service-to-service hop (mTLS, retries, telemetry), and plenty of real systems run both side by side.
