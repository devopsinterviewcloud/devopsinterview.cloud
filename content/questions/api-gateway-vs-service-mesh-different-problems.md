---
title: API Gateway vs Service Mesh - Different Problems
description: When to use an API Gateway vs a service mesh in interviews: what each handles, why teams need both, and common mix-ups.
date: 2026-10-22
keywords: microservices, devops interview questions, api gateway vs service mesh, microservices interview questions, api gateway service mesh difference, microservices architecture interview
category: microservices
youtube: AGlrPBsB5SU
---

A classic trap question in system design and platform interviews: candidates often treat API Gateway and Service Mesh as competing tools instead of complementary ones. Getting the boundary wrong signals you haven't actually operated either, which is exactly what interviewers want to catch.

## The answer interviewers want

Most engineers assume API Gateway and Service Mesh solve the same problem. They don't.

An **API Gateway** handles external traffic coming into your system. That means things like authentication, rate limiting, and routing requests from outside the cluster to the right backend service. It's the front door.

A **Service Mesh** manages service-to-service communication inside your cluster. It's concerned with how your internal services talk to each other once a request is already in the building, not how it got there.

In practice, you often need both. The Gateway handles client-facing concerns at the edge, and the Mesh handles internal concerns between services. One doesn't replace the other; they sit at different layers of the same system.

## Why interviewers ask this

This question is a quick filter for whether you understand traffic boundaries in a distributed system. Anyone can name both tools, but conflating them suggests you've read about them without deploying them. Interviewers are also checking whether you can reason about layered responsibility instead of treating infrastructure as one undifferentiated pile of "networking stuff."

## Follow-ups to expect

**"Could you use a Service Mesh to handle external traffic instead of a Gateway?"**
The source draws a clean line: Gateway is for traffic from outside, Mesh is for traffic between services inside the cluster. Blurring that line is the mistake the question is designed to expose, so the honest answer is to keep them scoped to what they're each built for.

**"Why would a system need both at once?"**
 Because they cover different hops in the request path. The Gateway deals with auth, rate limiting, and routing as a request enters the system from a client; the Mesh then governs how that request moves between internal services. Removing either one leaves a gap at that layer.

**"What's the risk of only having a Gateway and no Mesh, or vice versa?"**
 The source doesn't go into failure scenarios directly, but the implication is clear: if you only have a Gateway, you have no visibility or control over internal service-to-service traffic. If you only have a Mesh, you have no proper edge control for external clients. The two are not substitutes for each other.

## The common wrong answer

Candidates typically describe one tool and then just bolt on the other tool's job description, as if a Gateway could also manage internal mesh traffic or a Mesh could handle external auth and rate limiting. That answer collapses two distinct architectural layers into one, which is the exact confusion this interview question exists to surface. The stronger answer keeps the boundary explicit: external traffic is the Gateway's job, internal service-to-service traffic is the Mesh's job, and most real systems run both side by side.
