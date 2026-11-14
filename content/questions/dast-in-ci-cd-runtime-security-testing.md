---
title: DAST in CI/CD - Runtime Security Testing
description: Learn how to implement DAST in CI/CD with ZAP or Veracode in staging to catch runtime vulnerabilities static scans miss.
date: 2026-10-22
keywords: devsecops, devops interview questions, DAST, DevSecOps, CI/CD, security testing
category: devsecops
---

Static analysis passing clean but production still getting breached is a common gap, and it's exactly why interviewers bring up DAST. They want to know if you understand that scanning source code is not the same as testing a running application.

## The answer interviewers want

DAST (Dynamic Application Security Testing) runs against your deployed, running application, not the source code. Think of it as hiring an ethical hacker to attack your live app the way a real attacker would, by sending it requests and watching how it responds.

The standard pattern is to run DAST in a staging environment, after deployment, as part of the pipeline. Tools like `ZAP` or `Veracode` crawl the running app and scan for things like SQL injection, XSS, and broken authentication, flaws they confirm by how the app actually responds, including misconfigurations and auth problems that never show up in the source code.

The critical detail is environment parity: the staging environment you run DAST against has to mirror production as closely as possible. If staging is running different configs, auth settings, or security controls, the scan is testing a different app: it can come back clean while production is still exposed, or flag problems production doesn't have. That gap between "staging looks secure" and "production is secure" is where real vulnerabilities hide, and it's a mistake worth calling out explicitly in an interview because it shows you've actually hit it before, not just read about DAST in a slide deck.

## Why interviewers ask this

This question separates people who know DevSecOps buzzwords from people who understand the SAST-versus-DAST distinction and where each fits in the pipeline. They're also checking whether you think about environment parity, since a DAST scan against a misconfigured staging environment gives false confidence. A good answer shows you treat DAST as a pipeline stage with real engineering constraints, not just a tool you bolt on.

## Follow-ups to expect

**Why not run DAST directly against production?** Scanning production with an active DAST tool can trigger real attacks against a live system, causing outages or data issues, so staging that mirrors production is the safer middle ground.

**What's the difference between what SAST and DAST actually catch?** SAST scans source code for insecure patterns before the app runs; DAST tests the live, deployed app from the outside, so it catches what only shows up at runtime, like misconfigured auth, missing security headers, or an injection flaw that's actually exploitable in that environment.

**What happens if staging configs drift from production?** Vulnerabilities tied to production-only configuration get missed entirely, which is why keeping staging in sync with prod settings is treated as a hard requirement, not a nice-to-have.

## The common wrong answer

Candidates often describe DAST and SAST interchangeably, or say they'd just run security scans on source code and call it done. Others mention DAST tools correctly but skip the staging-parity detail entirely, missing the exact failure mode that makes DAST useful in the first place.
