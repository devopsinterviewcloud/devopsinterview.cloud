---
title: Cosign vs Notation - Sign Container Images
description: Cosign vs Notation for signing container images: keyless OIDC signing vs PKI-based trust, and when to use each in interviews.
date: 2026-10-22
keywords: devsecops, devops interview questions, cosign vs notation, sign container images interview, container image signing tutorial, devsecops interview questions
category: devsecops
youtube: i7PeSEh6LPQ
---

Container image signing comes up in almost every DevSecOps interview now, because supply chain security questions have moved from theoretical to table stakes. The interviewer usually isn't testing whether you've memorized a tool. They're testing whether you understand the trust model underneath it.

## The answer interviewers want

Cosign and Notation solve the same problem, proving an image hasn't been tampered with, but they come from different trust models.

Cosign is part of Sigstore and uses keyless signing tied to your OIDC identity. There's no long-lived private key to manage or rotate. You authenticate through an identity provider (GitHub Actions, Google, etc.), and Sigstore's transparency log ties the signature to that identity at signing time. This fits cloud-native CI/CD well: fast, no cert infrastructure to run, works naturally in ephemeral pipelines.

Notation comes from the Notary Project and is backed by traditional PKI with X.509 certificates. That means you need a certificate authority issuing and managing those certs. This fits regulated shops that already run a CA as part of their compliance posture, think banks, think anything built around Azure Container Registry, which has first-class Notation support.

The part most candidates miss: these two aren't mutually exclusive, and you can run both in the same org. A common pattern is verifying public, third-party images with Cosign, since most open source projects publish Cosign signatures, while using Notation for your internal supply chain where you control the CA and need PKI-based attestation for audit purposes.

So the direct answer to "which one does the interviewer want" is: neither, by itself. Cosign and Notation aren't rivals competing for the same slot. They're built for different trust models, and the stronger answer explains both and says which one fits which part of the pipeline.

## Why interviewers ask this

This question screens for whether you understand trust models, not tool trivia. Anyone can name both tools. The signal they're after is whether you can articulate the tradeoff between keyless OIDC-based signing and certificate-based PKI, and whether you'd default to one blindly or actually reason about the environment first.

## Follow-ups to expect

**"How does keyless signing actually work without a private key to steal?"** Sigstore ties the signature to your OIDC identity at signing time and records it in a transparency log, so there's no long-lived key sitting around to leak or rotate.

**"Why would a bank prefer Notation over Cosign?"** Banks and similarly regulated shops typically already run a certificate authority as part of their compliance and audit requirements, so PKI-based signing fits their existing trust chain instead of introducing a new OIDC-based one.

**"Could you use both in the same pipeline?"** Yes, a common pattern is verifying public images with Cosign and signing your internal supply chain with Notation, since they're not rivals, they're built for different trust models.

## The common wrong answer

Most candidates pick a side, usually Cosign because it's the one they've heard more about, and defend it as the universally correct choice. That answer misses the point entirely. It signals that the candidate has memorized a tool name without understanding why the trust model, OIDC identity versus PKI and a CA, determines the right fit for a given environment.
