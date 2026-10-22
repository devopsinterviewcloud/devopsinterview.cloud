---
title: systemd vs init - Why Linux Switched
description: Explains why systemd replaced init, how PID 1 and unit file dependencies work, and how missing After=/Requires= lines cause silent boot failures.
date: 2026-10-22
keywords: linux, devops interview questions, systemd vs init, systemd interview questions, linux interview questions for experienced, why linux switched to systemd
category: linux
youtube: NWDtVK69Rb0
---

A service that worked fine in testing vanished on boot with no logs and no alerts. The team behind it had assumed systemd behaves like the old init system. It doesn't, and that wrong assumption is exactly what interviewers are probing for when they bring up systemd versus init.

## The answer interviewers want

Init and systemd are not the same thing wearing different clothes. Init starts services sequentially: one finishes, the next starts. If one service hangs or blocks, everything behind it in the sequence waits too. That's slow, and it's fragile.

systemd runs services in parallel, tracks dependencies between them, and restarts services automatically when they fail. That's a fundamentally different model, not just a faster version of the same thing.

Here's the part most people miss: systemd is PID 1. It's the first process the kernel starts, and every other process is a descendant of it. If PID 1 dies, the kernel panics. There's no fallback, no restart, nothing above it to recover. That's why systemd bugs are a different category of risk than an ordinary service crashing.

In the silent boot failure case, the actual cause was a unit file missing `After=` and `Requires=` directives. Without them, systemd had no way to know the service depended on something else starting first, so it started too early, failed, and nothing downstream flagged it. Two lines in the unit file would have caught it before it ever reached production.

## Why interviewers ask this

This question separates people who've memorized "systemd replaced init" from people who've actually debugged a unit file at 3am. Interviewers want to know you understand PID 1's special status, that you know parallel startup means dependency ordering is now your responsibility, and that you reach for unit file configuration before you reach for logs.

## Follow-ups to expect

**How would you debug a service that silently fails on boot?** Start with the unit file itself, checking `After=` and `Requires=` (or `Wants=`) for missing dependencies, then check `systemctl status` and `journalctl` for whatever did get logged.

**Why does a PID 1 crash cause a kernel panic instead of a restart?** Because PID 1 has no parent process above it to detect the failure and relaunch it. The kernel has no recovery path for losing its init process, so it panics.

**How do you control startup ordering in systemd?** Use `After=` and `Before=` to set ordering, and `Requires=` or `Wants=` to declare actual dependencies, since ordering alone doesn't guarantee a dependency is running.

## The common wrong answer

Most candidates say something like "systemd is just a newer, faster init system" and stop there. That misses the parallel startup model, the dependency tracking that now lives in unit files, and the fact that systemd's PID 1 status makes its failures categorically worse than a regular service crash. It also means they'd go straight to generic log-checking instead of looking at unit file dependencies first, which is where this class of bug actually lives.
