---
title: Multi-Stage Builds - Cut Image Size 80%
description: Docker multi-stage builds explained for interviews: cut production image size from 800MB to under 10MB using scratch or distroless base images.
date: 2026-10-22
keywords: docker, devops interview questions, docker multi-stage builds, docker multi-stage build interview question, reduce docker image size, dockerfile best practices
category: docker
youtube: 3ZjfhPtKyfE
---

Smaller Docker images don't happen by accident, and interviewers know it. This question checks whether you understand how Docker actually builds and layers images, not just whether you've typed `docker build` before.

## The answer interviewers want

Multi-stage builds are the standard fix. A Dockerfile can have multiple `FROM` statements, each starting a new stage. The first stage does the heavy lifting: it pulls in a full SDK image with compilers and build tools, and compiles your application. The second stage starts from a minimal base and copies in only the compiled artifact. Everything used to build the app, the compiler, the package manager, the cached source, never makes it into the final image.

A typical example:

```
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o myapp

FROM scratch
COPY --from=builder /app/myapp /myapp
ENTRYPOINT ["/myapp"]
```

The builder stage might be 800MB with the full Go toolchain. The final image, built `FROM scratch`, can be under 10MB because it contains nothing but the binary.

The detail most candidates skip: picking the right final base. `scratch` or a distroless image strips out the shell, the package manager, and most of the OS userland. That's not just smaller, it's a much smaller attack surface, since there's no shell for an attacker to pop even if they get code execution.

So no, small images aren't the default behavior of Docker. But getting there doesn't take a rewrite, it takes one more `FROM` line and some discipline about what gets copied where.

## Why interviewers ask this

They want to know you understand Docker's layer model, not just the CLI. Image size affects pull time, attack surface, and cold-start latency in orchestrated environments, so this question is really probing production awareness: have you shipped something past a toy build, and did you think about what ends up in the final layer.

## Follow-ups to expect

- **How does layer caching interact with multi-stage builds?** Each stage caches independently, so ordering `COPY` and `RUN` steps to put rarely-changing dependencies before frequently-changing source code still matters, even across stages.
- **Why not just use `alpine` instead of `scratch`?** Alpine still gives you a shell and a package manager (`apk`), which is fine for debugging but adds attack surface compared to scratch or distroless; it's a tradeoff between convenience and minimalism.
- **What do you lose by using `scratch`?** No shell means no `docker exec` into a running container for debugging, and no package manager for installing diagnostic tools on the fly, so some teams keep a debug-variant image around.

## The common wrong answer

Candidates often answer with generic advice like "use a smaller base image" or "clean up apt cache in the same RUN line," which is true but incomplete. It shows awareness of image bloat without showing understanding of the actual mechanism, multiple build stages, that separates build-time dependencies from the runtime artifact. Interviewers notice when someone can't name `FROM ... AS builder` or explain what `COPY --from=builder` does.
