---
title: Pod CrashLoopBackOff - 5 Common Causes
description: Why Kubernetes pods hit CrashLoopBackOff: OOM kills, init container failures, image pulls, secrets, and probes.
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

The other three: image pull failures, where the node can't pull the image because of a bad tag, missing registry credentials, or network issues; missing secrets, where the container can't start because a required `Secret` or `ConfigMap` reference doesn't exist; and startup probe timeouts, where the app is still initializing but the probe gives up too early and Kubernetes kills it before it's ready.

In all five cases, the first move is the same: `kubectl logs <pod>` to see what the container printed before it died, and `kubectl describe pod <pod>` to see events like OOMKilled, failed pulls, or probe failures. Between those two commands you can usually narrow it down to one of the five causes fast.

## Why interviewers ask this

They want to see that you don't panic-restart things or start randomly editing YAML. They're checking whether you know the standard first two commands to run and whether you can reason about which of several distinct failure categories you're looking at before you start changing config.

## Follow-ups to expect

**How do you tell OOMKilled apart from a plain application crash?** Check `kubectl describe pod` for a reason field of OOMKilled under the last terminated state. A plain crash shows a different exit code and the logs will usually show an application-level stack trace or error instead.

**What would you check if `kubectl logs` shows nothing at all?** That usually points to an init container failure or an image pull problem, since the main container never got far enough to log anything. You'd check `kubectl describe pod` events and also try `kubectl logs` against the init container specifically.

**How would you fix a startup probe that's too aggressive?** Increase the `initialDelaySeconds` or `failureThreshold` on the startup probe so the app has more time to come up before Kubernetes decides it's unhealthy.

## The common wrong answer

Most candidates jump straight to "increase the memory limit" as if that's the universal fix. That only addresses one of the five causes, and it signals you haven't separated the failure modes. A stronger answer always starts with checking logs and describe output first, then picks the fix based on what's actually there.
