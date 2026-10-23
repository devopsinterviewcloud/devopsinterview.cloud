---
title: Linux Server Hacked - 5 Forensics Steps
description: A walkthrough of the Linux breach forensics process interviewers expect: evidence preservation, artifact hunting, and the inode ctime trick.
date: 2026-10-22
keywords: linux, devops interview questions, linux server hacked forensics, linux security incident response, server compromise investigation steps, linux forensics commands
category: linux
youtube: xT4WGKo1Eig
---

Your production box just got popped. Before you touch anything, interviewers want to hear a structured response, not panic. This question shows up constantly in DevOps and SRE interviews because incident response separates engineers who've actually been on call from those who've only read about it.

## The answer interviewers want

Step one is always preserve the crime scene. Before the attacker notices you're onto them, dump memory, snapshot disks, and capture the current network state. Memory is volatile, it disappears on reboot, so if you're going to lose evidence it's the first thing you lose. Do this before you kill any process or pull a cable.

Step two is hunting for artifacts. Walk through `~/.bash_history`, `/var/log/auth.log` (or the equivalent on your distro), recently modified files, and any unusual network connections. You're building a timeline of what the attacker touched and how they got in.

Step three is focusing on persistence mechanisms, because that's how they survive your cleanup and come back later. That means cron jobs, systemd units, SSH authorized_keys, anything that re-establishes access after a reboot or a kill -9.

Here's the detail most teams miss: attackers routinely modify log timestamps to cover their tracks. If you only look at modification time (mtime), you'll trust a lie. Always check the inode change time (ctime) as well. Changing a file's content is easy to fake the mtime for, but ctime updates whenever the file's metadata changes, including permission or ownership changes, and it's much harder for an attacker to forge consistently.

## Why interviewers ask this

This question is really testing whether you understand that forensics and remediation are different phases with different priorities. They're checking that you default to preserving evidence first instead of immediately patching or rebooting, and that you know enough filesystem internals to catch an attacker who's trying to cover their tracks.

## Follow-ups to expect

**Why capture memory before anything else?** Because it's the most perishable evidence on the box. A reboot, a crash, or even normal memory pressure can wipe out the data that would tell you exactly what process was running and what it was doing.

**What counts as a persistence mechanism on Linux?** Cron jobs, systemd services or timers, modified shell startup files, and injected SSH keys are the classic ones. Any of these let an attacker regain access even after you've killed their original foothold.

**Why does ctime catch what mtime misses?** mtime only reflects content changes, which an attacker can reset with standard tools. ctime reflects any metadata change on the file, which is much harder to fully erase without leaving other traces.

## The common wrong answer

Most candidates jump straight to "I'd kill the suspicious process and patch the vulnerability." That's remediation, not forensics, and doing it first destroys the evidence you need to understand scope and root cause. The other common gap is stopping at mtime when checking for tampered files, which means a reasonably careful attacker walks right past your investigation unnoticed.
