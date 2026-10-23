---
title: Linux Network Troubleshooting - ss netstat traceroute
description: How to debug Linux network issues using ss and traceroute instead of netstat, and why interviewers care about modern tooling.
date: 2026-10-22
keywords: linux, devops interview questions, linux network troubleshooting, ss vs netstat command, linux network commands interview, traceroute linux troubleshooting
category: linux
youtube: k11Mfm7rPPE
---

A connection is timing out somewhere between your service and a dependency, and you need to find out where. This is a staple Linux/DevOps interview question because it's a fast way to check whether you're still running commands from a decade-old habit or actually know the current toolset.

## The answer interviewers want

Start with `ss` instead of `netstat`. It's faster and more detailed, it shows socket states and process info, and it doesn't hang on DNS lookups the way `netstat` can.

Use `ss -t` to look at TCP sockets and `ss -u` for UDP. Add `-p` to see which process owns a given socket, which is usually the first thing you need when something is bound to a port it shouldn't be, or when a port you expect to be listening isn't.

That covers the local side: is the socket open, is it in the state you expect, is the right process holding it. For path issues, where traffic leaves the box and you need to know where it's actually dying, use `traceroute`. It shows exactly where packets stop getting through, hop by hop.

The practical workflow is to combine the two: `ss` to check local sockets first, then `traceroute` to check the remote path if the local socket looks healthy but the connection still isn't working. Ditch `netstat`, master `ss`.

## Why interviewers ask this

This question is a cheap way to tell who has kept their toolkit current versus who's reciting commands they memorized years ago. It also checks whether you can reason in layers: is the problem local (socket state, process binding) or is it the path (routing, a hop dropping packets)? That split is exactly how you'd actually triage an outage.

## Follow-ups to expect

**Why is `ss` preferred over `netstat`?** It's faster and more detailed, and it doesn't hang trying to resolve DNS for every address it displays, which matters a lot when a box is under load or the network is already degraded.

**How would you find out which process is bound to a UDP port?** Run `ss -up` to list UDP sockets with process info attached, instead of grepping through `netstat` output.

**If `ss` shows a healthy local socket but the connection still fails, what's next?** That's when you move to `traceroute` to check the path, since the problem is no longer local to the box.

## The common wrong answer

Most candidates default straight to `netstat -tulpn` because it's muscle memory, and stop there without mentioning `ss` at all. Others can name `ss` but can't explain why it's actually better, or they treat socket checks and path checks as the same problem instead of recognizing that a healthy local socket and a broken route require different tools entirely.
