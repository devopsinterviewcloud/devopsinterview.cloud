---
title: K8s In-Place Pod Scaling - No Restart Required
description: How Kubernetes in-place pod resizing works, why kubectl patch and resizePolicy matter, and what interviewers want you to know.
date: 2026-10-22
keywords: kubernetes, devops interview questions, kubernetes in-place pod scaling, k8s pod scaling without restart, kubernetes interview questions, kubectl patch resources
category: kubernetes
youtube: BSLToZFBWEo
---

Kubernetes added the ability to change a pod's CPU and memory limits without killing and recreating it. This comes up in interviews because it tests whether you understand resource management beyond the basic "just set requests and limits" answer, and whether you know the feature's limits.

## The answer interviewers want

In-place pod scaling lets you change CPU and memory limits on a running pod without restarting it. Think of it like upgrading the RAM in a laptop while it keeps running, instead of shutting it down, swapping the hardware, and booting it back up.

To use it, you patch the resources field on the container directly:

`kubectl patch pod <pod-name> --subresource resize --patch '{"spec":{"containers":[{"name":"<container-name>","resources":{...}}]}}'`

The behavior depends on the `resizePolicy` set on the container. If you want a resource change to apply without disrupting the container, set the restart policy for that resource to `NotRequired`. If it's set to `RestartContainer` instead, Kubernetes will restart just that container to apply the new limits, which is still far less disruptive than evicting and rescheduling the whole pod.

The part most people skip: not every container supports in-place resizing. Before you patch anything, check the `resizePolicy` in the pod spec. If you skip that check, you'll get cryptic errors instead of a clean resize, and you'll waste time debugging something that was never going to work in the first place.

## Why interviewers ask this

This question separates people who've only read the resource requests and limits section of the docs from people who've kept up with how Kubernetes handles resource management today. It also tests whether you think about failure modes before running a command, which is a proxy for how you'd behave in production rather than in a sandbox.

## Follow-ups to expect

**"What happens if the container doesn't support in-place resize?"** You'll get a cryptic error rather than a graceful fallback, which is why checking the `resizePolicy` field in the pod spec first is part of the correct workflow, not an optional step.

**"What's the difference between `NotRequired` and `RestartContainer` in the resize policy?"** `NotRequired` applies the new resources without touching the running container; `RestartContainer` restarts just that container to apply the change, still avoiding a full pod reschedule.

**"Why does this matter compared to the old way of scaling pods?"** The old way meant killing and recreating the pod to change its resources, which causes disruption; in-place scaling avoids that entirely or minimizes it to a single container restart.

## The common wrong answer

Most candidates default to talking about the Horizontal Pod Autoscaler or just say "you'd set new requests and limits and redeploy," which misses the point of the question entirely. The interviewer is asking about resizing an already-running pod without disruption, not about scaling the number of replicas or doing a rolling redeploy.
