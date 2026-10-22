---
title: Linux Audit Framework - Track Who Did What
description: How to answer the Linux audit framework interview question: using auditd to track user activity at the kernel level, beyond syslog.
date: 2026-10-22
keywords: linux, devops interview questions, linux audit framework, linux audit interview questions, auditd linux tutorial, linux security interview questions
category: linux
youtube: STQWInu5VSA
---

Interviewers want to know whether you understand the difference between application-level logging and kernel-level auditing. This question comes up constantly in SRE and platform roles because syslog gaps are a classic blind spot during incident forensics and compliance audits.

## The answer interviewers want

Syslog does not tell you who deleted a file. It only sees what processes choose to report, which means a process can delete a file without logging anything meaningful about who triggered it. `auditd` sits lower in the stack, in the kernel, below syslog and below your application. It sees everything that happens at the syscall level, regardless of whether the process itself logs it.

To use it, first enable the daemon:

```
systemctl enable --now auditd
```

Then add a watch rule, for example to track changes to a sensitive file:

```
auditctl -w /etc/passwd -p wa -k passwd-changes
```

This watches `/etc/passwd` for write and attribute changes (`-p wa`) and tags matching events with the key `passwd-changes` so they're easy to find later.

Query the results with:

```
ausearch -k passwd-changes
```

One detail that trips people up in production: rules added with `auditctl` directly are not persistent. They live in memory and are lost on reboot. If you only add rules with `auditctl`, your next restart silently kills your compliance coverage and nobody notices until an audit or an incident review comes up empty. To make rules survive a reboot, write them to a file under `/etc/audit/rules.d/` instead.

Once this is in place, the next time someone asks who deleted a file or modified a config, auditd already has the answer.

## Why interviewers ask this

This question separates people who've only worked with application logs from people who understand the full observability stack on Linux. It also tests whether you know that logging tools can have gaps, and whether you've actually operated a system under compliance requirements like PCI or SOC 2, where someone will eventually ask "who touched this file."

## Follow-ups to expect

**What's the performance cost of running auditd with broad rules?** Watching high-traffic files or syscalls generates a lot of events, so rules should be scoped narrowly to what you actually need to prove, not broad syscall-wide watches.

**How do you make sure audit rules survive a reboot?** Write them as persistent rule files in `/etc/audit/rules.d/` instead of only applying them live with `auditctl`, since `auditctl` rules are lost on restart.

**How would you search audit logs during an incident?** Use `ausearch` with the key you tagged the rule with, which lets you pull matching events without grepping raw audit logs manually.

## The common wrong answer

Most candidates answer with syslog or application-level logging and stop there, assuming that covers "who did what." That misses the core point of the question: syslog only reports what a process chooses to tell it, so a malicious or buggy process can act without leaving a syslog trail. Candidates who don't mention the kernel level, or who forget that `auditctl` rules need to be persisted to survive a reboot, haven't actually run this in production.
