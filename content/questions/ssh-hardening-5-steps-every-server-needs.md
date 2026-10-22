---
title: SSH Hardening - 5 Steps Every Server Needs
description: SSH hardening interview question: the 5 config changes that stop brute force attacks and lock down root and password login.
date: 2026-10-22
keywords: linux, devops interview questions, ssh hardening steps, ssh security configuration linux, server hardening checklist devops, linux security interview questions
category: linux
youtube: 19Gims2Qy_A
---

A weak SSH config is behind most server breaches, which is exactly why interviewers keep coming back to this topic. It's a cheap way to check whether a candidate actually hardens boxes in production or just knows the theory.

## The answer interviewers want

Start with the two changes that matter most. In `/etc/ssh/sshd_config`, set:

```
PermitRootLogin no
PasswordAuthentication no
```

Root access over SSH is like leaving your house key under the doormat. Disabling it means an attacker who gets a password can't log in as root directly, and they'd need both a valid non-root account and a key. Disabling password auth forces key-based login, which kills brute force guessing outright.

After that, three more steps:

- Change the default port with `Port 2222` (or any non-standard port). This doesn't stop a targeted attacker, but it cuts out the constant noise from automated scanners hammering port 22.
- Install `fail2ban` for brute force protection. It watches auth logs and temporarily bans IPs after repeated failed login attempts.
- Enable detailed logging with `LogLevel VERBOSE` so you can actually see what's hitting your server and investigate incidents after the fact.

The step most configs forget is `AllowUsers`, used to whitelist specific accounts:

```
AllowUsers deploy admin
```

Without it, any valid user on the box can attempt SSH login, not just the ones who should be remoting in. That's the gap that gets missed even in configs that otherwise look hardened.

## Why interviewers ask this

This question separates people who've memorized a checklist from people who've actually locked down a server under pressure. They're listening for whether you understand the reasoning behind each setting, not just the setting name, and whether you mention the less obvious controls like `AllowUsers` that most people skip.

## Follow-ups to expect

**What happens if you lock yourself out after disabling password auth?** Always keep a working key-based session open, or console/out-of-band access available, before you push the config change and restart `sshd`.

**Does changing the port actually improve security?** Not against a targeted attacker, but it drastically reduces log noise and opportunistic scanning, which makes real threats easier to spot.

**How does `fail2ban` interact with `AllowUsers`?** They solve different problems: `AllowUsers` restricts who can even attempt login, while `fail2ban` punishes repeated failed attempts from whoever is still allowed to try.

## The common wrong answer

Most candidates rattle off "disable root login, use keys instead of passwords" and stop there. They skip the whitelist step entirely, because `AllowUsers` isn't as well known as the basics, which is exactly the gap interviewers are probing for. A good answer treats SSH hardening as a layered set of controls, not a single switch to flip.
