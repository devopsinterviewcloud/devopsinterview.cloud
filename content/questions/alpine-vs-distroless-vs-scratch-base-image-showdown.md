---
title: Alpine vs Distroless vs Scratch - Base Image Showdown
description: Alpine vs distroless vs scratch base images compared: musl libc bugs, attack surface, and why distroless beats Alpine in interviews.
date: 2026-10-22
updated: 2026-11-20
keywords: docker, devops interview questions, alpine vs distroless vs scratch, docker base image comparison, distroless docker interview question, alpine linux docker
category: docker
---

A team picks Alpine for every Dockerfile because it's small and familiar, then spends an afternoon chasing a bug that only happens in the container. This question shows up because interviewers want to know if you've actually hit that wall or just copy-pasted `FROM alpine` out of habit.

## The answer interviewers want

Alpine is not the safe default most people assume it is. It ships a shell and a package manager, which is genuinely useful for debugging, but it's built on musl libc instead of glibc. That difference causes subtle bugs with glibc-linked binaries: code that runs fine on your dev machine or in CI can misbehave inside the Alpine container, and these bugs are hard to trace back to the base image.

`scratch` sits at the other extreme. The base adds zero attack surface because there's nothing in it, so the only thing left to attack is your own binary, but that also means you're on your own. No shell, no libc, no utilities. If something goes wrong in prod, you can't exec in and poke around.

Distroless is the actual sweet spot. No shell, no package manager, so the attack surface stays small, but it includes the runtime your application actually needs, so you don't fight compatibility issues the way you do with Alpine's musl libc. The detail most people don't know: distroless base images come in a `:debug` variant with busybox added on top. That means you can run hardened, shell-less distroless in production, and when you need a shell during an incident, attach an ephemeral container with `kubectl debug` or rebuild on the debug variant.

So the real answer isn't "Alpine, because it's small and safe." It's distroless, because it gives you a minimal attack surface in production and a debugging path when you need one, without the glibc/musl landmines Alpine carries.

## Side by side

| | Alpine | Distroless | Scratch |
|---|---|---|---|
| Shell and package manager | Yes, busybox `sh` and `apk` | No package manager; `:debug` tags add a busybox shell | No |
| C library | musl | glibc in the `base` and `cc` images, none in `static` | None |
| CA certificates | Included | Included | Copy them in yourself |
| Time zone data | `apk add tzdata` | Included | Copy it in yourself |
| Non-root user | Create one with `adduser` | Built in: `:nonroot` tags run as UID 65532 | Set a numeric `USER` |
| Best fit | Images where you need a shell and can live with musl | Most production services | Fully static binaries |

## A worked example

A Go API built with `CGO_ENABLED=0` is a static binary. It doesn't need a C library, so the smallest distroless image is enough:

```dockerfile
FROM golang:1.27 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=build /out/api /api
ENTRYPOINT ["/api"]
```

The `nonroot` tag runs the process as UID 65532 without a `USER` line, and outbound HTTPS works because the CA bundle is already in the image. Put the same binary on `scratch` and the first HTTPS call fails with `x509: certificate signed by unknown authority`, since there are no CA certificates to check against. The fix is one more line in the final stage: `COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/`.

When something breaks in production, you don't rebuild. Attach a debug container to the running pod:

```bash
kubectl debug -it pod/api-6c9f7d8b5-x2kqz --image=busybox:1.36 --target=api
```

`--target` puts the debug container in the app container's process namespace (containerd and CRI-O support this), so `ps` shows the API process, and the debug container already shares the pod's network. The build side of all this, with typical size ranges, is in [Docker image optimization with multi-stage builds](/blog/docker-image-optimization-multi-stage-builds).

## Why interviewers ask this

This is a quick way to check whether a candidate has actually debugged a container in anger or is just repeating the common wisdom that Alpine is the lightweight, safe choice. It also tests whether you understand attack surface as a spectrum rather than a binary, since `scratch`, distroless, and Alpine all make different tradeoffs along that spectrum.

## Follow-ups to expect

- **What kind of bugs does musl libc actually cause?** Binaries compiled against glibc can behave differently or fail outright when run against musl, which is why a glibc-linked binary might work on your laptop and break inside an Alpine container. Real cases: Python packages that only publish glibc (`manylinux`) wheels get compiled from source on Alpine, which makes builds slow and images bigger; musl's default thread stack is much smaller than glibc's, so deep recursion can crash; and DNS lookups behave differently, for example musl before 1.2.4 couldn't retry a large DNS answer over TCP.
- **When would you still choose `scratch`?** When you want the absolute smallest attack surface and your application is fully self-contained, accepting that there's no shell to exec into, so live debugging means attaching an ephemeral container with `kubectl debug`.
- **How do you debug a distroless container in production?** Attach an ephemeral container with `kubectl debug` to get a shell next to the running process without touching the image. You can also rebuild on the `:debug` tag of the same distroless base, which adds busybox.

## The common wrong answer

Most candidates say "Alpine, because it's small and more secure than a full OS image," and stop there. That answer misses that Alpine's shell and package manager widen the attack surface compared to distroless, and it ignores the musl libc compatibility risk entirely, which is the exact tradeoff interviewers are trying to surface.
