---
title: Linux High CPU - Find the Rogue Process Fast
description: How to troubleshoot high CPU on Linux for a DevOps interview: top, htop, ps aux, and catching intermittent spikes with top -p.
date: 2026-10-22
keywords: linux, devops interview questions, linux high cpu, find high cpu process linux, linux cpu troubleshooting interview, top command linux
category: linux
youtube: 2Npctz5_fMk
---

A server pegged at 100% CPU is one of the most common troubleshooting prompts in DevOps and SRE interviews, because it's cheap to ask and reveals whether you actually have a method or just guess. The question isn't really about CPU. It's about whether you work a problem systematically under pressure.

## The answer interviewers want

Start with `top`. Once it's open, press `P` (capital) to sort processes by CPU usage. The hungry processes float straight to the top, so you don't have to scan the whole list.

If `htop` is available, use it instead for better visibility: colored bars, a cleaner layout, easier navigation. Press `F6` inside `htop` to pick CPU percent as the sort key explicitly.

You can get the same answer without a full-screen tool by running `ps aux` and piping it into `sort` by the CPU column, something like `ps aux | sort -nrk 3 | head`. This is useful in scripts or when you only have a minimal shell.

The part most candidates miss: a single snapshot from `top` or `ps` only shows CPU usage at that instant. If the spike is intermittent, you can walk away thinking everything's fine. Use `top -p <PID>` to watch one or more specific process IDs continuously over time. That catches processes that spike, idle, and spike again, which a one-off snapshot will never show you.

## Why interviewers ask this

They're checking that you have a default first move instead of freezing or guessing randomly. They're also checking whether you understand the limits of your own tools, since knowing that `top` and `ps` give you point-in-time snapshots is what separates someone who's actually debugged production from someone who's only read the man page. A strong answer shows a progression: quick check, better tool, then sustained monitoring for anything non-obvious.

## Follow-ups to expect

**"What do you do once you've found the PID?"** Identify the binary and its parent process, check recent deploys or cron jobs tied to it, and decide whether to let it run, throttle it, or kill it depending on what it's doing and what depends on it.

**"How would you investigate if the process itself looks legitimate but is just doing too much work?"** Look at what it's processing, like traffic volume, queue depth, or a bad input causing a loop, rather than assuming the process itself is the bug.

**"What if `top -p` shows nothing unusual but users still report slowness?"** Consider that the bottleneck might not be CPU at all, and check I/O wait, memory pressure, or network saturation instead.

## The common wrong answer

Most candidates say "I'd run `top`" and stop there, as if finding one high-CPU process at one moment answers the whole question. That misses intermittent spikes entirely and gives the interviewer nothing to probe, which usually gets you a follow-up question you weren't ready for. The stronger answer is the one that admits a single snapshot isn't enough and names a way to monitor over time.
