---
title: Deployment Broke SSL Certs - Quick Fix
description: A deployment breaks SSL in production. Here's the diagnostic order interviewers expect: cert status, secret versions, ingress cache.
date: 2026-10-22
keywords: scenario, devops interview questions, deployment broke ssl, ssl certificate fix kubernetes, ssl broken after deployment, devops ssl troubleshooting
category: scenario
youtube: EPTTC30MwzI
---

A deployment goes out and suddenly every browser hitting your site throws a security warning. Production is down, the boss is in your DMs, and you've got minutes to figure out whether this is an expired cert, a bad secret, or something stuck in cache. Interviewers use this scenario because the fix is simple once you know it, but panicked engineers often skip straight to the wrong layer.

## The answer interviewers want

Start with the obvious: did a certificate actually expire, or did the deployment just make it look that way? Run `kubectl get certificates` and check the `READY` column. If it says `False`, that's your first signal, something in the cert-manager pipeline isn't reconciling.

Next, check whether the deployment actually updated the certificate secret it depends on. Compare secret versions, if the deployment rolled out a new config but the underlying TLS secret wasn't refreshed (or refreshed to the wrong thing), you'll get a mismatch between what's deployed and what's actually being served.

Here's the step most people miss: restart your ingress controller pods. Ingress controllers cache certificates in memory. Even if cert-manager fixed the secret and everything looks correct on paper, the ingress pods can keep serving the old, broken, or expired cert until they're restarted and reload the new one from the secret store.

In short: verify cert status, verify secret freshness, then clear the ingress cache by restarting. Once you know this sequence, what used to be a 3AM fire drill turns into a five-minute fix.

## Why interviewers ask this

This question tests whether you understand that Kubernetes TLS has multiple layers that can drift independently: the Certificate resource, the Secret it writes to, and the ingress controller that actually serves traffic. A candidate who jumps straight to "redeploy everything" or "check the CA" without checking these layers in order is signaling they haven't actually operated cert-manager under pressure. Interviewers also want to see a calm, structured diagnostic flow under a simulated incident.

## Follow-ups to expect

**Why would secret versions mismatch after a deployment?** A deployment can reference a secret by name without guaranteeing cert-manager has reconciled a fresh certificate into it yet, so the secret the pod mounts may still hold the old or incomplete data.

**Why does restarting the ingress controller fix it if the secret is already correct?** Because the ingress controller reads the secret into memory at startup or on a watch event, and if it cached the old certificate before the update landed, it'll keep serving that stale version until it's restarted.

**What would you check if `kubectl get certificates` shows `READY: True` but browsers still warn?** That points away from cert-manager entirely and toward the ingress controller still serving a cached or mismatched cert, which is why the restart step matters even when the certificate resource looks healthy.

## The common wrong answer

Most candidates either blame the CA or jump straight to reissuing certificates from scratch, skipping the cheaper diagnostic steps. They miss that the certificate resource, the secret, and the ingress controller are three separate layers that can each be the culprit, and they almost never mention that ingress controllers cache certs and need a restart, which is usually the actual fix.
