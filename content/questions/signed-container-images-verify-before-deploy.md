---
title: Signed Container Images - Verify Before Deploy
description: How to verify container images before deployment using Cosign signing and admission controllers, and why base images often get skipped.
date: 2026-10-22
keywords: compliance, devops interview questions, signed container images, container image signing interview, cosign container security, supply chain attacks prevention
category: compliance
youtube: WRx-eWCkzrU
---

A supply chain attack through an unsigned, tampered container image is one of the more preventable incidents in production, which is exactly why interviewers keep circling back to image verification. They want to know if you treat the registry as trusted by default or if you actually check what you're deploying.

## The answer interviewers want

Digital signatures work like a wax seal on an envelope: they prove the image came from a trusted source and wasn't tampered with in transit or in storage. The standard approach is to sign images with `cosign`, then configure an admission controller in your cluster to reject any image that isn't signed.

The detail most candidates miss is scope. Most teams sign their final application images and stop there, forgetting to sign base images too. If your base image is unsigned or unverified, you've still got an unguarded entry point into the supply chain, no matter how carefully you sign the layer on top. Sign everything that moves through your build pipeline, not just the artifacts you ship to customers. The goal is a chain of trust with no weak link, not a single signed image sitting on top of an unverified stack.

## Why interviewers ask this

This question separates people who know supply chain security is a checkbox from people who've actually thought about where trust breaks down. It's also a quick way to see if you understand admission control as an enforcement mechanism, not just signing as a nice-to-have. Interviewers are listening for whether you treat verification as a pipeline-wide practice or an afterthought bolted onto the final image.

## Follow-ups to expect

- **What happens if someone bypasses the admission controller?** The admission controller is the enforcement point, so if it's misconfigured or has an exception policy that's too broad, unsigned images can still slip through. That's why the policy itself needs to be as locked down and reviewed as the signing process.
- **Why would you bother signing base images if the final app image is already signed?** Because the final image inherits the base image's layers and any vulnerabilities or tampering in it. Signing only the final artifact gives you false confidence about the whole stack.
- **Where does Cosign fit into a CI/CD pipeline?** Signing should happen as a build step immediately after the image is built and before it's pushed to the registry, so every image that reaches the registry already has a verifiable signature attached.

## The common wrong answer

The typical wrong answer stops at "we scan images for vulnerabilities," which conflates scanning with signing. Vulnerability scanning tells you what's inside an image; signing tells you whether the image is actually what it claims to be and hasn't been altered. Candidates also tend to describe signing as something applied only to the final deployable artifact, missing that base images and intermediate layers need the same treatment to close the gap attackers actually use.
