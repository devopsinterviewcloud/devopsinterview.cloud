---
title: gRPC Interview Questions: When to Use gRPC vs REST
description: gRPC interview questions with answers: when to use gRPC vs REST, the four call types, load balancing in Kubernetes, browsers, and safe protobuf changes.
date: 2026-10-22
updated: 2026-11-20
keywords: grpc interview questions, microservices, devops interview questions, grpc vs rest, when to use grpc vs rest, grpc rest interview question, microservices interview questions
category: microservices
youtube: AJ-U-88nH6U
---

This question comes up because a lot of microservices interviews eventually ask you to justify a protocol choice, and "gRPC vs REST" is the easiest way to see if you actually think about architecture or just repeat buzzwords.

## The answer interviewers want

REST is your front door. `gRPC` is your internal backbone. They do different jobs, so you don't pick one and throw the other away.

In practice: use REST for public APIs, and use `gRPC` for internal traffic between services. Think about checkout calling inventory. That call needs low latency and often needs streaming, not the overhead of parsing JSON back and forth on every hop.

Here's the part people miss: mixing both is normal, not a compromise. A common pattern is `gRPC` for service-to-service calls inside the mesh, with REST or GraphQL exposed at the edge for external clients, mobile apps, or partner integrations. So the real framing isn't "REST or gRPC," it's REST at the edge, `gRPC` in the mesh. Each protocol is doing the job it's good at: REST for broad compatibility and human-readable debugging at the boundary, `gRPC` for fast, typed, efficient calls between services you control.

## gRPC vs REST side by side

| | gRPC | REST |
|---|---|---|
| Transport | HTTP/2 (a few implementations also support HTTP/3) | Any HTTP version, usually HTTP/1.1 or HTTP/2 |
| Payload | Protocol Buffers, binary | Usually JSON, text |
| Contract | A `.proto` file, with client and server code generated from it | Optional, often an OpenAPI spec |
| Streaming | Built in: server, client and bidirectional streams | Request and response by default; streaming is possible (streamed bodies, SSE, WebSockets) but isn't part of the contract |
| Browsers | Need gRPC-Web, served by the server itself or by a proxy such as Envoy | Work natively |
| Debugging | `grpcurl`, which needs the schema or server reflection | `curl` and a browser |
| Load balancing | Per request only with an L7 proxy or client-side balancing | Per request through any HTTP load balancer or ingress, which is how REST is usually deployed; behind a plain L4 balancer, keep-alive connections get pinned too |

## Why interviewers ask this

They want to know if you understand that protocol choice is a design decision tied to where the traffic lives, not a personal preference or a trend you read about. It also tests whether you can reason about trade-offs like latency, tooling, and client compatibility instead of treating every technology choice as universal. A candidate who says "gRPC is just better" or "REST is simpler so always use it" signals they haven't actually run both in production.

## Follow-ups to expect

**Why not use gRPC for your public API too?** Because public clients, browsers, partners, third parties, generally need the broad compatibility and easy debugging REST gives you, not the tighter coupling and tooling requirements gRPC expects.

**Why does the checkout-to-inventory call specifically benefit from gRPC?** That call needs low latency and can benefit from streaming, and avoiding JSON parsing on every internal hop cuts overhead that adds up at scale.

**Doesn't running two protocols add complexity?** Yes, but the complexity is justified because each protocol is matched to the job it's actually good at: REST at the edge for compatibility, gRPC in the mesh for speed.

## The common wrong answer

Most candidates turn this into a binary debate, arguing that gRPC is strictly faster so it should replace REST everywhere, or that REST is simpler so it's always the safer choice. Both answers miss the actual pattern senior teams use, which is running both at once: REST or GraphQL at the edge for external clients, and gRPC internally in the mesh where low latency and streaming actually matter.

## More gRPC interview questions

**What are the four kinds of gRPC call?** Unary (one request, one response), server streaming (one request, a stream of responses, like a price feed), client streaming (a stream of requests, one response, like uploading metrics in batches), and bidirectional streaming, where both sides send independently over the same call. You choose one per method in the `.proto` file with the `stream` keyword.

**Why does gRPC traffic end up on one pod in Kubernetes?** A ClusterIP Service balances connections, not requests. A gRPC client usually opens one long-lived HTTP/2 connection and sends every call over it, so all its calls land on whichever server pod that connection reached, and pods added by a scale-up sit idle. Fix it with client-side balancing (a headless Service so DNS returns every pod IP, plus the `round_robin` policy in the client) or with a proxy that balances per request, such as Envoy or a mesh like Linkerd or Istio. Setting a maximum connection age on the server also makes clients reconnect and spread out over time.

**Can a browser call a gRPC service?** Not directly. Browser APIs don't give JavaScript the control over HTTP/2 frames and trailers that gRPC needs. The usual options are gRPC-Web, either built into the server or through a proxy like Envoy, or transcoding the same service to REST and JSON at the edge with something like grpc-gateway. It's one more reason REST tends to stay at the edge.

**How do you change a protobuf message without breaking old clients?** Add new fields with new field numbers and never reuse or renumber an existing one. When you delete a field, mark its number and name as `reserved` so nobody reuses them by accident. Old clients skip fields they don't know, and new clients see default values for fields an old server doesn't send. Renumbering a field, or changing its type to one that isn't wire-compatible, is what breaks things.

**What happens if a client never sets a deadline?** In most gRPC libraries the default is no deadline at all, so a call to a stuck server can wait forever and hold resources the whole time. Set a deadline on every call and pass the incoming context, deadline included, to the calls a service makes downstream. Then a slow dependency deep in the chain fails fast instead of piling requests up behind it.

**How do you monitor gRPC errors?** By gRPC status code, not HTTP status. A failed call usually still comes back as HTTP 200, with the real result in the `grpc-status` trailer, so a dashboard that counts 5xx responses can look healthy while calls fail with `UNAVAILABLE` or `DEADLINE_EXCEEDED`. For health checks, implement the standard `grpc.health.v1.Health` service; Kubernetes can call it directly with a `grpc` liveness or readiness probe.
