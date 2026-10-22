---
title: ImagePullBackOff - Debug Container Pull Failures
description: How to debug ImagePullBackOff in Kubernetes: kubectl describe pod, image verification, manual pulls, and common auth/DNS causes.
date: 2026-10-22
keywords: kubernetes, devops interview questions, imagepullbackoff kubernetes, kubernetes interview questions imagepullbackoff, kubernetes container pull failure debug, kubernetes interview questions
category: kubernetes
youtube: CMw98znIE5Q
---

A pod stuck in `ImagePullBackOff` is one of the most common Kubernetes failures you'll hit in production, and interviewers use it to check whether you actually debug systematically or just guess. It's a quick way to separate people who've run real clusters from people who've only read the docs.

## The answer interviewers want

Start with `kubectl describe pod <pod-name>`. The events section at the bottom tells you exactly what's wrong, usually one of three things: authentication failure, a wrong image tag, or a network issue reaching the registry.

Next, verify the image actually exists. Check your registry directly and confirm the tag is correct. Typos in tags or images that were never pushed are a common cause.

Then test pulling the image manually on the node itself, using `docker pull` or `crictl pull` depending on your container runtime. If it fails manually the same way it fails for the kubelet, you've isolated the problem away from Kubernetes scheduling and onto the pull path itself.

Here's the part most people skip: check `imagePullSecrets` on the pod or service account, and check node network connectivity to the registry. Most real-world `ImagePullBackOff` failures come down to either a missing or expired auth secret, or DNS resolution failing on the node when it tries to reach the registry endpoint.

## Why interviewers ask this

This question tests whether you have a repeatable debugging process or just start guessing at random fixes. It also reveals whether you understand the layers involved: the Kubernetes API, the kubelet, the container runtime, and the registry are all separate systems that can each fail independently. Interviewers want to see you narrow the problem down methodically instead of jumping straight to "redeploy it and see if it works."

## Follow-ups to expect

**How do you check if imagePullSecrets is actually attached correctly?** You'd look at the pod spec or service account for the secret reference, then confirm the secret exists in the right namespace and contains valid, non-expired registry credentials.

**What's the difference between `ImagePullBackOff` and `ErrImagePull`?** `ErrImagePull` is the actual pull attempt failing, while `ImagePullBackOff` is Kubernetes backing off retries after repeated failures, so `describe pod` events usually show the underlying `ErrImagePull` reason first.

**If the manual pull on the node works but the pod still fails, what do you check next?** That points back to credentials or service account configuration, since the runtime itself has proven it can reach the registry, so the issue is likely scoped to how the pod authenticates.

## The common wrong answer

The typical wrong answer jumps straight to "check the image name" or "restart the pod" without ever looking at `kubectl describe pod`. Candidates who skip the events section end up guessing at causes instead of reading what Kubernetes is already telling them, and they often miss that the real culprit is almost always auth or DNS, not a typo in the image name.
