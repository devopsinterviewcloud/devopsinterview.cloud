---
title: Persistent Volumes Explained - PV PVC StorageClass
description: Explains Kubernetes PV, PVC, and StorageClass: how they relate, why PVCs go pending, and what interviewers listen for.
date: 2026-10-22
keywords: kubernetes, devops interview questions, persistent volumes explained, kubernetes pv pvc storageclass interview, k8s storage interview questions, kubernetes interview questions
category: kubernetes
youtube: gonj5aq4y94
---

Kubernetes storage questions come up constantly because almost every candidate can define a Pod or a Deployment, but far fewer can cleanly separate the three storage objects that actually provision and consume disk. It's a cheap way for an interviewer to find out if you've only memorized YAML or if you understand the underlying model.

## The answer interviewers want

Most engineers treat PVs and PVCs as interchangeable. They aren't, and the distinction is the whole point of the question.

Think of it like renting an apartment. The `PersistentVolume` (PV) is the actual apartment: a real piece of storage that exists somewhere, with a defined capacity and access mode. The `PersistentVolumeClaim` (PVC) is your lease application: a request from a workload saying "I need this much storage, with these characteristics." The `StorageClass` is the property management company: it defines the policy for how new apartments (PVs) get built and handed out.

In practice, you rarely create PVs by hand. A `StorageClass` creates them automatically, on demand, when a pod needs storage. The pod references a PVC, the PVC references a `StorageClass`, and the `StorageClass`'s provisioner creates a matching PV behind the scenes. That's the separation of concerns: the application only ever talks to the PVC. It doesn't know or care where the actual storage lives or how it was provisioned.

Here's the detail that trips people up in interviews: a PVC stays in `Pending` state if there's no matching PV and no `StorageClass` available to dynamically create one. The claim just sits there, unbound, until something satisfies its request for size and access mode.

## Why interviewers ask this

This question screens for whether you understand Kubernetes as a system of decoupled objects talking through APIs, rather than a pile of YAML you copy-paste. It also checks if you've actually debugged storage in the wild, since a stuck PVC is one of the most common real-world Kubernetes support tickets.

## Follow-ups to expect

**What would you check first if a PVC is stuck in Pending?** Confirm whether a `StorageClass` exists and is set as default, and whether any existing PV matches the PVC's requested size and access mode.

**Why not just let every pod create its own PV directly?** That would break the separation of concerns: applications would need to know storage backend details instead of just declaring a claim, which removes the abstraction `StorageClass` provides.

**What's the role of the provisioner inside a StorageClass?** It's the component that actually does the work of creating the PV automatically when a PVC requests one, instead of an operator doing it manually.

## The common wrong answer

The typical wrong answer treats PV and PVC as synonyms, describing them both as "the storage," and skips StorageClass entirely because the candidate has only ever worked in clusters where someone else already set up dynamic provisioning. That answer signals you've used Kubernetes storage but never had to reason about why a claim wasn't binding.
