---
title: Deployment Broke SSL Certs - Quick Fix
description: A deployment breaks SSL in production. Here's the diagnostic order interviewers expect: cert status, the Ingress and its Secret, then the cert actually served.
date: 2026-10-22
keywords: scenario, devops interview questions, deployment broke ssl, ssl certificate fix kubernetes, ssl broken after deployment, devops ssl troubleshooting
category: scenario
youtube: EPTTC30MwzI
---

A deployment goes out and suddenly every browser hitting your site throws a security warning. Production is down, the boss is in your DMs, and you've got minutes to figure out whether this is an expired cert, a bad secret, or something stuck in cache. Interviewers use this scenario because the fix is simple once you know it, but panicked engineers often skip straight to the wrong layer.

## The answer interviewers want

Start with the obvious: did a certificate actually expire, or did the deployment just make it look that way? Run `kubectl get certificates` and check the `READY` column. If it says `False`, that's your first signal, something in the cert-manager pipeline isn't reconciling.

Next, check what the deployment changed on the Ingress. A renamed `secretName`, a dropped `tls` block or a new hostname that isn't on the certificate will all break TLS even when the cert itself is fine. Confirm the Ingress points at the Secret you expect and that the cert inside covers the hostname and hasn't expired.

Here's the step most people miss: check the cert that's actually being served, not just the Secret. Run `openssl s_client -connect <host>:443 -servername <host>` and compare its expiry and issuer with what's in the Secret. Ingress controllers watch Secrets and normally load a new cert on their own, so if the two differ, read the controller logs to see why. Restart the controller pods only once you've confirmed it's stuck.

In short: verify cert status, verify the Ingress and the Secret it points at, then compare that with the cert being served. Once you know this sequence, what used to be a 3AM fire drill turns into a five-minute fix.

## Why interviewers ask this

This question tests whether you understand that Kubernetes TLS has multiple layers that can drift independently: the Certificate resource, the Secret it writes to, and the ingress controller that actually serves traffic. A candidate who jumps straight to "redeploy everything" or "check the CA" without checking these layers in order is signaling they haven't actually operated cert-manager under pressure. Interviewers also want to see a calm, structured diagnostic flow under a simulated incident.

## Follow-ups to expect

**Why would TLS break after a deployment if nothing expired?** Usually the deploy changed the Ingress: a new `secretName` that cert-manager hasn't issued into yet, or a host the cert doesn't cover. Until a matching cert is in place, the controller typically falls back to its default cert and browsers warn.

**When would restarting the ingress controller actually help?** Only when you've confirmed the Secret is correct and the controller is still serving something else. Controllers watch Secrets and reload certs on change, so a stuck controller is the exception: check its logs for why it didn't load the new cert, and treat the restart as recovery, not diagnosis.

**What would you check if `kubectl get certificates` shows `READY: True` but browsers still warn?** Ready only means cert-manager has a valid cert matching the Certificate spec, not that browsers trust it. Check the served cert's issuer: a Let's Encrypt staging or self-signed issuer gives exactly this symptom. If the Secret holds a trusted cert and the served one differs, look at the ingress controller.

## The common wrong answer

Most candidates either blame the CA or jump straight to reissuing certificates from scratch, skipping the cheaper diagnostic steps. They miss that the certificate resource, the secret, and the ingress controller are three separate layers that can each be the culprit, and they rarely check the cert that's actually being served, which is the quickest way to see which layer broke.
