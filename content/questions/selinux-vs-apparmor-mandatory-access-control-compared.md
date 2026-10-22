---
title: SELinux vs AppArmor - Mandatory Access Control Compared
description: SELinux vs AppArmor explained for DevOps interviews: label-based vs path-based mandatory access control, and which distro uses which.
date: 2026-10-22
keywords: linux, devops interview questions, selinux vs apparmor, selinux apparmor comparison interview, mandatory access control linux interview, linux security interview questions
category: linux
youtube: 66rOxf6Jt18
---

Mandatory access control comes up in Linux security interviews because candidates often assume SELinux and AppArmor are interchangeable. They're not, and mixing them up is a quick way to signal you've never actually administered a hardened box.

## The answer interviewers want

SELinux and AppArmor both implement mandatory access control (MAC), but they work in fundamentally different ways.

SELinux uses labels and contexts. Every user, process, and file gets a security label, and policy rules define what labels are allowed to interact with what other labels. This is powerful but notoriously fiddly: a mislabeled file after a restore or a copy with the wrong flags (`cp` without `--preserve=context`, for example) is a classic source of mysterious `permission denied` errors that `ls -Z` and `ps -Z` help you diagnose.

AppArmor takes a simpler approach: it works off file paths and capabilities. Profiles say things like "this binary can read these paths and use these capabilities," which is easier to read and write than an SELinux policy, but less granular.

Distro choice follows this split. Red Hat-based systems (RHEL, CentOS, Fedora) ship SELinux by default. Ubuntu ships AppArmor by default. Most teams stick with whatever their distro ships rather than swapping MAC systems, since both require policy work to use well and switching means relearning the tooling.

## Why interviewers ask this

This question filters out people who've only read about Linux hardening versus people who've actually fought a MAC system in production. It also checks whether you understand that "MAC is enabled" doesn't mean "MAC is configured correctly" - a huge number of real-world incidents are just SELinux or AppArmor silently blocking something after a deploy.

## Follow-ups to expect

**How do you debug an SELinux denial in production?** Check `ps -Z` and `ls -Z` to see current labels, and look at audit logs for the denial; the fix is usually relabeling the file or adjusting policy, not disabling SELinux outright.

**Why not just disable SELinux/AppArmor to avoid issues?** Because you're removing a real security layer; the right move is understanding and fixing the policy or label, not turning off MAC entirely.

**If you moved a workload from RHEL to Ubuntu, what changes?** You'd move from managing SELinux labels and contexts to writing AppArmor path-and-capability profiles, which is a different mental model and different tooling.

## The common wrong answer

The most common mistake is treating SELinux and AppArmor as roughly the same thing with different names, or worse, saying "I just disable SELinux when it causes problems." That answer tells an interviewer you've hit permission errors and reached for the sledgehammer instead of understanding labels, contexts, or profiles well enough to fix the actual policy.
