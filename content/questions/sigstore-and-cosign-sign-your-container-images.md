---
title: Sigstore and Cosign - Sign Your Container Images
description: Learn how Sigstore and Cosign enable keyless container image signing and verification, a key DevSecOps interview topic for 2026.
date: 2026-10-22
keywords: devsecops, devops interview questions, sigstore cosign container signing, container image security devops, sigstore keyless signing tutorial, cosign verify container images
category: devsecops
youtube: NR0zHuIjfeQ
---

Running containers from a registry means trusting that the image you pull is the image someone actually built and tested. Interviewers ask this to see if you understand supply chain security beyond "we scan for vulnerabilities," and whether you know the difference between signing an image and actually enforcing that signature at runtime.

## The answer interviewers want

Sigstore solves this with keyless signing. Instead of generating and managing private keys yourself, you authenticate with an OIDC provider like GitHub or Google, and your identity becomes the basis for the signature. There's no key material for you to rotate, store, or leak.

Cosign is the tool that does the signing. Run `cosign sign` against an image and it signs using your authenticated identity, then stores the resulting signature in the registry right alongside the image itself. No separate signature store to stand up or maintain.

Signing the image is only half the job. The part most teams skip is enforcement: setting up an admission controller in your cluster that checks for a valid signature before it lets a pod run, and blocks anything unsigned. Without that step, you've proven you can sign images, but nothing in your runtime actually cares whether they're signed. Teams sign religiously in CI and then never add the gate that makes it matter.

## Why interviewers ask this

This question separates people who've read about supply chain security from people who've actually implemented it. Anyone can say "we sign our images." The interviewer is listening for whether you connect signing to verification and enforcement, and whether you understand that keyless signing removes a real operational burden (key management) rather than just being a buzzword.

## Follow-ups to expect

**If you sign images but don't configure an admission controller, what's the actual security benefit?** Close to none at runtime. The signature exists and can be checked manually or in CI, but unsigned or tampered images can still be scheduled and run in the cluster. The admission controller is what turns a signature into an enforced control.

**How does keyless signing avoid the key management problem?** Instead of a long-lived private key you have to generate, store securely, and rotate, you authenticate via OIDC with an identity provider like GitHub or Google. Your identity, not a key file, is what backs the signature.

**Where do the signatures actually live?** Cosign stores them in the same registry as the image, right alongside it, so there's no separate infrastructure to run just to hold signature data.

## The common wrong answer

Most candidates describe the signing step in detail, cosign, OIDC, keyless, and stop there, treating "we sign our images" as the complete answer. They skip the admission controller entirely, which is exactly the gap interviewers are probing for. Signing without enforcement means the signature is informational at best; it doesn't stop a tampered or unsigned image from running.
