---
title: Pod CrashLoopBackOff - 5 Common Causes
description: Why Kubernetes pods hit CrashLoopBackOff: OOM kills, init container failures, app startup errors, bad config, and probes.
date: 2026-10-22
keywords: scenario, devops interview questions, pod crashloopbackoff, kubernetes crashloopbackoff interview, k8s pod troubleshooting interview, kubernetes interview questions
category: scenario
youtube: QUVXlXcLy2Q
---

CrashLoopBackOff is one of the most common Kubernetes failure modes, and interviewers love it because it's open-ended. There's no single root cause, so the question really tests whether you have a systematic debugging process instead of guessing.

## The answer interviewers want

CrashLoopBackOff means Kubernetes keeps restarting a pod because the container keeps exiting, and the backoff delay between restarts keeps growing. There are five causes that come up again and again.

First, memory limits. Your app hits its memory limit, the OOM killer kills the process, the container exits, and Kubernetes restarts it, over and over.

Second, init container failures. If an init container fails, the main container never even starts, so the pod sits in a crash cycle before your actual application code runs.

The other three: application errors at startup, like a bad command or entrypoint or an unhandled exception on boot; bad config, where the app exits because an env var, config file or credential it needs is wrong or missing; and startup probe timeouts, where the app is still initializing but the probe gives up too early and Kubernetes kills it before it's ready. Image pull failures and a missing `Secret` or `ConfigMap` look similar, but the container never starts, so you see states like `ImagePullBackOff` or `CreateContainerConfigError` instead.

In all five cases, the first move is the same: `kubectl logs <pod> --previous` to see what the last crashed instance printed before it died, and `kubectl describe pod <pod>` to see the last termination reason and exit code (that's where OOMKilled shows up) plus events like probe failures. Between those two commands you can usually narrow it down to one of the five causes fast.

## Why interviewers ask this

They want to see that you don't panic-restart things or start randomly editing YAML. They're checking whether you know the standard first two commands to run and whether you can reason about which of several distinct failure categories you're looking at before you start changing config.

## Follow-ups to expect

**How do you tell OOMKilled apart from a plain application crash?** Check `kubectl describe pod` for a reason field of OOMKilled under the last terminated state. A plain crash shows a different exit code and the logs will usually show an application-level stack trace or error instead.

**What would you check if `kubectl logs` shows nothing at all?** Try `kubectl logs <pod> --previous` first, since the container may have just restarted. If that's empty too, it's usually an init container failure, where the main container never started, or a process that died before printing anything, like a bad entrypoint. Check `kubectl describe pod` events and run `kubectl logs <pod> -c <init-container>`.

**How would you fix a startup probe that's too aggressive?** Increase the `initialDelaySeconds` or `failureThreshold` on the startup probe so the app has more time to come up before Kubernetes decides it's unhealthy.

## The common wrong answer

Most candidates jump straight to "increase the memory limit" as if that's the universal fix. That only addresses one of the five causes, and it signals you haven't separated the failure modes. A stronger answer always starts with checking logs and describe output first, then picks the fix based on what's actually there.
