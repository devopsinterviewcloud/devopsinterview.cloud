---
title: Container Escape - 3 Ways Attackers Break Out
description: Learn the three real container escape vectors: privileged mode, Docker socket mounts, and kernel CVEs. A common DevSecOps interview question.
date: 2026-10-22
keywords: devsecops, devops interview questions, container escape interview question, container security interview questions, kubernetes security interview, devsecops interview questions
category: devsecops
youtube: MlhGqr_rsMs
---

Container escape questions separate candidates who've read a blog post from candidates who've actually hardened a cluster. The junior answer is 'don't run as root.' The senior answer names the specific vectors attackers use to break out of a container and onto the host.

## The answer interviewers want

There are three main escape vectors worth naming.

**One: privileged mode.** Running a container with `--privileged` gives it full host access. It disables the isolation Docker normally enforces, so a compromised process inside the container can act directly on the host kernel and devices.

**Two: mounting the Docker socket.** If a container mounts `/var/run/docker.sock`, anything running inside it can talk to the Docker daemon on the host. That means it can spin up new containers as root on the host, which is effectively a root shell outside the container boundary. This is the sneakiest one on the list. It often shows up disguised as a monitoring agent or CI runner config, something that looks routine in a manifest. Seniors flag it in code review. Juniors ship it to prod without a second look.

**Three: unpatched kernel CVEs.** Containers share the host kernel, so a kernel vulnerability reachable through unrestricted syscalls can let an attacker pivot from container to host regardless of how the container itself is configured. This is why kernel patching and syscall filtering (like seccomp profiles) matter even when everything else is locked down.

Knowing all three, and why the socket mount is the one people overlook, is what separates a passing answer from a job offer.

## Why interviewers ask this

This question checks whether you understand container isolation as a set of specific boundaries rather than a vague security feature. Anyone can say 'don't run as root.' Naming privileged mode, socket mounts, and kernel syscalls shows you understand what Docker isolation actually relies on and where it breaks. It also tests whether you'd catch a dangerous config in a real code review, not just recite a definition.

## Follow-ups to expect

**How would you catch a Docker socket mount before it reaches prod?** Treat it like any other privileged access request in code review, flag any manifest that mounts `/var/run/docker.sock` and require an explicit justification, since it's rarely needed outside of CI tooling.

**Why is the socket mount harder to spot than privileged mode?** Privileged mode is an obvious flag in a Dockerfile or deployment spec, while a socket mount can be buried in a volume list next to legitimate monitoring or logging mounts, so it doesn't jump out the same way.

**What mitigates the kernel CVE vector specifically?** Keeping the host kernel patched and restricting syscalls available to containers, since the exploit path runs through unrestricted syscalls reaching a vulnerable kernel.

## The common wrong answer

Most candidates stop at 'don't run containers as root' and treat that as the whole answer. It's not wrong, but it only addresses privilege escalation within the container, not the actual boundary-crossing mechanisms. Candidates also tend to skip the Docker socket vector entirely because it doesn't look dangerous in a config file, which is exactly why interviewers ask about it.
