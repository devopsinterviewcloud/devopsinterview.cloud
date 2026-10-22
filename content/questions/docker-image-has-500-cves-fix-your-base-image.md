---
title: Docker Image Has 500 CVEs - Fix Your Base Image
description: Why a single FROM line can cause 500 CVEs in a Docker image, and how base image choice plus CI scanning fixes it.
date: 2026-10-22
keywords: docker, devops interview questions, docker image vulnerabilities fix, docker base image best practices, reduce docker image CVEs, docker security interview questions
category: docker
youtube: K__dTTQzZ00
---

A scan comes back with 500 CVEs and nobody touched the application code. This shows up in interviews because it's a quick way to check whether a candidate actually understands where container vulnerabilities come from, or just knows how to run `trivy image` and read the output.

## The answer interviewers want

Most CVEs in a container image aren't in your code. They're in the base image. Something like `FROM ubuntu:latest` or `FROM python:3` pulls in hundreds of packages you never use and never asked for: package managers, compilers, shells, libraries for use cases that have nothing to do with your app. Each of those packages carries its own CVE history, and you inherit all of it on day one.

The fix is to switch your base image to something minimal. Move to a distroless image or Alpine, and you typically go from 500 CVEs down to under 10. You're not patching your way out of this problem; you're removing the attack surface that was never necessary in the first place.

The part most people miss is when you scan. Scanning right before deploy is too late, it just tells you the problem after it's already built. Scan in CI, on every build, with a tool like Trivy or Docker Scout. Fail the build when a critical CVE is found. That turns vulnerability scanning from a report nobody reads into a gate that actually stops bad images from shipping.

## Why interviewers ask this

This question separates people who treat container security as a checkbox scan from people who understand supply chain risk. An interviewer wants to know if you think about what's actually in the image, not just whether a scanner ran. They're also checking if you build enforcement into the pipeline instead of relying on someone reading a report after the fact.

## Follow-ups to expect

**Why not just patch the packages in the base image instead of switching?** You can, but you're still carrying packages you don't need and will keep re-patching them every release. Removing unused packages by switching to a minimal base is a one-time fix instead of an ongoing chase.

**What if distroless breaks our debugging workflow?** That's a real tradeoff since distroless images often lack a shell, so some teams keep a debug variant for troubleshooting while running distroless in production.

**Where exactly in CI should the scan run?** As part of the build stage, right after the image is built and before it's pushed to a registry, so a failing scan blocks the image from ever reaching a place it could get deployed.

## The common wrong answer

The common mistake is treating this as purely an application-layer problem: auditing dependencies in `package.json` or `requirements.txt` while ignoring the base image entirely. Candidates will also say "we scan our images" without saying when, which misses the point that a scan after deploy is just documentation of a problem you already shipped.
