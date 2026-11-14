---
title: Distroless Images - Reduce Container CVEs
description: How distroless base images shrink container CVE counts by dropping packages your app never uses, and how to debug them without a shell in Kubernetes.
date: 2026-10-22
keywords: devsecops, devops interview questions, distroless images, container cve reduction, distroless vs alpine, devsecops interview questions
category: devsecops
youtube: EKvla997Ud4
---

A recruiter or hiring panel wants to know if you can reduce container attack surface without signing your team up to keep patching hundreds of packages it never uses. This question comes up because "just patch the base image" is the answer most candidates give, and it doesn't scale once you have hundreds of images to track.

## The answer interviewers want

Stop shipping containers with a full OS inside. Most CVEs in container scans come from OS packages you never actually use: package managers, shells, coreutils, debugging tools. Distroless images strip everything except your app and its runtime dependencies (things like glibc, libssl and CA certificates, which still come from Debian). No shell and no package manager means far less to flag and far less for an attacker to work with, but a bug in your app or those libraries is still exploitable.

In practice: multi-stage build your app, then copy just the compiled binary into a `gcr.io/distroless` base image. Scan the result with `trivy` or `grype` to confirm the CVE count actually drops.

The thing most people miss: no shell means no `kubectl exec -it pod -- bash`. If you need to inspect a running distroless container, use `kubectl debug` with an ephemeral container instead. That attaches a separate debug container with a shell and tools to the same pod's namespaces, without adding a shell to your production image.

The one-line answer that shrinks the CVE patching treadmill: ship distroless, not another full OS image, and rebuild whenever the base image updates.

## Why interviewers ask this

They're checking whether you think about attack surface reduction as a design decision, not just a patching chore. Anyone can say "run a scanner and fix what it finds." Fewer candidates can explain why stripping out unused OS packages changes the problem, and even fewer know the operational tradeoff: you lose your usual debugging shell and need a different workflow for it.

## Follow-ups to expect

**How do you debug a distroless container when something breaks in production?** Use `kubectl debug` to attach an ephemeral container with a shell and tooling to the same pod, since the production container itself has no shell to exec into.

**Does this fit into your CI pipeline, or is it a one-off build step?** The multi-stage build and the `trivy`/`grype` scan both belong in CI, so the distroless image is built and verified on every change, not assembled manually.

**What do you lose by going distroless?** You lose the convenience of a shell and OS tools inside the running container, which is exactly the tradeoff that shrinks the attack surface in the first place.

## The common wrong answer

Most candidates describe a patching process: pin base image versions, run Dependabot or Renovate, rebuild on a schedule, re-scan, repeat. That's a reasonable hygiene practice, but it doesn't answer the question. On its own it keeps you on a treadmill chasing CVEs in OS packages your app never calls. The stronger answer strips those packages out so there's far less to patch and far less for a scanner to flag, keeps the rebuild-and-rescan loop for what's left, and pairs that with a real plan for debugging without a shell, which is the part people forget to mention.
