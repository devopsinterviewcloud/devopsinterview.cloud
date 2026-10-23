---
title: gRPC vs REST - When to Use Which
description: A DevOps interview answer on choosing gRPC vs REST for internal and public APIs, covering latency, streaming, and edge-vs-mesh design.
date: 2026-10-22
keywords: microservices, devops interview questions, grpc vs rest, when to use grpc vs rest, grpc rest interview question, microservices interview questions
category: microservices
youtube: AJ-U-88nH6U
---

This question comes up because almost every microservices interview eventually asks you to justify a protocol choice, and "gRPC vs REST" is the easiest way to see if you actually think about architecture or just repeat buzzwords.

## The answer interviewers want

REST is your front door. `gRPC` is your internal backbone. They do different jobs, so you don't pick one and throw the other away.

In practice: use REST for public APIs, and use `gRPC` for internal traffic between services. Think about checkout calling inventory. That call needs low latency and often needs streaming, not the overhead of parsing JSON back and forth on every hop.

Here's the part people miss: mixing both is normal, not a compromise. A common pattern is `gRPC` for service-to-service calls inside the mesh, with REST or GraphQL exposed at the edge for external clients, mobile apps, or partner integrations. So the real framing isn't "REST or gRPC," it's REST at the edge, `gRPC` in the mesh. Each protocol is doing the job it's good at: REST for broad compatibility and human-readable debugging at the boundary, `gRPC` for fast, typed, efficient calls between services you control.

## Why interviewers ask this

They want to know if you understand that protocol choice is a design decision tied to where the traffic lives, not a personal preference or a trend you read about. It also tests whether you can reason about trade-offs like latency, tooling, and client compatibility instead of treating every technology choice as universal. A candidate who says "gRPC is just better" or "REST is simpler so always use it" signals they haven't actually run both in production.

## Follow-ups to expect

**Why not use gRPC for your public API too?** Because public clients, browsers, partners, third parties, generally need the broad compatibility and easy debugging REST gives you, not the tighter coupling and tooling requirements gRPC expects.

**Why does the checkout-to-inventory call specifically benefit from gRPC?** That call needs low latency and can benefit from streaming, and avoiding JSON parsing on every internal hop cuts overhead that adds up at scale.

**Doesn't running two protocols add complexity?** Yes, but the complexity is justified because each protocol is matched to the job it's actually good at: REST at the edge for compatibility, gRPC in the mesh for speed.

## The common wrong answer

Most candidates turn this into a binary debate, arguing that gRPC is strictly faster so it should replace REST everywhere, or that REST is simpler so it's always the safer choice. Both answers miss the actual pattern senior teams use, which is running both at once: REST or GraphQL at the edge for external clients, and gRPC internally in the mesh where low latency and streaming actually matter.
