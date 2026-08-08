---
title: How to Shrink a 2GB Docker Image with Multi-Stage Builds
description: Multi-stage builds done correctly, Alpine vs distroless vs scratch, layer caching, and the honest numbers each approach can actually reach.
date: 2026-08-05
keywords: docker image optimization, docker multi-stage builds, reduce docker image size, alpine vs distroless, dockerfile best practices, docker interview questions
---

"Your image is 2GB. Production pulls are timing out, registry costs are climbing, and security keeps flagging the attack surface. Fix it." This scenario shows up constantly in DevOps interviews because it tests three things at once: whether you understand what is actually inside an image, whether you can use multi-stage builds correctly (most candidates get the dependency handling subtly wrong), and whether you know the real trade-offs between base images instead of reciting "use Alpine".

The video version walks the same optimization live if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/4v3tNTslxqg" title="Optimize a 2GB Docker Image" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## Why images balloon to 2GB in the first place

The root cause is treating a container like a virtual machine. A typical bloated Node.js image looks like this: a full Debian-based `node` base image (over 1GB by itself), `node_modules` installed with dev dependencies included (webpack, jest, eslint and friends shipping to production), the entire source tree copied in including `.git`, and often a compiler toolchain someone added to make one native module build. The application code is 10MB; everything else is baggage.

The baggage is not just size. Every package you ship is attack surface, every CVE in the toolchain is a finding in your security scan, and every node that does not already have the layers cached pulls all of it across the network.

## Multi-stage builds, done correctly

The idea: use one stage with the full toolchain to build, then copy only the finished artifacts into a minimal runtime stage. The build stage is discarded; only the final stage ships.

The classic mistake is dependency handling. You cannot `npm ci --omit=dev` in the build stage, because building usually needs the dev dependencies (TypeScript, bundlers). And you should not ship the build stage's `node_modules`, because it contains them. The clean pattern uses three stages:

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: build with the full toolchain
FROM node:22-alpine AS builder
WORKDIR /app
# Native modules? Alpine's node image ships no compiler toolchain. Any stage
# that runs npm ci over native deps (this one AND deps below) needs, BEFORE it:
# RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production dependencies only
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: minimal runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
USER app
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

Details interviewers probe on:

- **`npm ci`, not `npm install`.** It installs exactly what the lockfile says, fails loudly on drift, and is faster in CI. `npm install` can silently mutate the lockfile.
- **`COPY package*.json ./` before `COPY . .`** so the dependency layer is cached and only rebuilds when the lockfile changes, not on every source edit.
- **A non-root user.** Root containers are among the first things any security review flags; creating a dedicated user costs three lines.
- **Pinned base versions.** `node:22-alpine` beats `node:latest`, but be precise in interviews: a version tag is still mutable and will pick up new patch builds. Only pinning by digest (`node@sha256:...`) makes the base truly immutable.

Two supporting pieces do a surprising amount of work. A `.dockerignore` excluding `node_modules`, `.git`, tests and docs keeps the build context small and stops `COPY . .` from dragging junk into layers. And `docker history <image>` (or the excellent [dive](https://github.com/wagoodman/dive) tool) shows you exactly which instruction created which megabytes, which is how you find the accidental 400MB layer.

## The honest numbers

This is where many tutorials oversell, and where being precise wins interviews. First, define the measurement: the sizes below are uncompressed, what `docker images` shows locally. Registries store compressed layers, so Docker Hub numbers look roughly two to three times smaller for the same image; comparing one article's compressed number against another's uncompressed one is how "50MB Node images" get invented. For our Node.js example:

| Approach | Realistic size (uncompressed) |
|---|---|
| Full `node:22` base, dev deps, source tree | ~2GB |
| Multi-stage with `node:22-alpine` runtime | 150 to 250MB |
| Multi-stage with distroless Node runtime | similar, slightly leaner surface |
| Go or Rust static binary on `scratch`/distroless | 10 to 50MB |

A Node.js image bottoms out around 150MB because the runtime itself weighs that much before your code arrives; a minimal Python Alpine image starts smaller but still lands well above the static-binary class once real dependencies are installed. The 90 percent-plus reductions are real. When a team genuinely needs the sub-50MB class, the answer is a compiled language producing a static binary, where the final stage can be `FROM scratch` plus CA certificates.

## Alpine vs distroless vs scratch

- **Alpine** (~5MB base): has a shell and the `apk` package manager, so you can still debug interactively. The trade-off people forget: it uses musl libc instead of glibc, which occasionally breaks native modules and prebuilt binaries. If your app depends on native code, test on Alpine before committing to it.
- **Distroless** (Google's images): your language runtime, CA certificates, tzdata, and nothing else. No shell, no package manager, dramatically reduced attack surface, and noticeably quieter CVE scans. The debugging story needs a plan: use `kubectl debug` with ephemeral containers, or the `:debug` image variants which include busybox.
- **Scratch**: literally empty. Only works for static binaries, and you must copy in CA certificates yourself if the app makes TLS calls. The leanest and most secure option when it fits.

A defensible production default: Alpine for interpreted languages where the debugging ergonomics matter, distroless where security posture is the priority, scratch for static binaries.

## What this buys you beyond disk

The size reduction is the headline, but the second-order effects are what you should lead with in an interview answer: cold pulls on fresh nodes drop from minutes to seconds, which is exactly when it matters (autoscaling events, node replacement, disaster recovery). CVE scan reports shrink from hundreds of findings to a handful, because the vulnerable packages simply are not there. And registry storage and egress costs fall roughly in proportion to the image, across every environment that stores a copy.

## Recap

1. Multi-stage builds: fat builder stage, separate production-deps stage, minimal runtime stage.
2. `npm ci` with a lockfile, dependency layers before source layers, `.dockerignore` always.
3. Alpine, distroless, or scratch, chosen by debugging needs, security posture and whether the binary is static.
4. Non-root user and pinned base versions, every time.
5. Quote honest numbers, and say whether they are compressed or uncompressed: 90 percent-plus reductions are achievable, but a Node runtime image bottoms out around 150MB uncompressed.

Container questions in real interviews go several follow-ups deeper than any one article: image internals, layer caching strategy, registry architecture, then straight into Kubernetes. [Container Orchestration Journey: Docker to Kubernetes](/ebooks/container-orchestration-journey) covers that full arc with 100+ worked questions, follow-up chains and production war stories. It is one of the five books in the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
