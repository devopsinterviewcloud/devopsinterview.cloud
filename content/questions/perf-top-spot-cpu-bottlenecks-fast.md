---
title: perf top - Spot CPU Bottlenecks Fast
description: perf top shows which function burns CPU live, kernel or user space, so you stop restarting boxes and fix the real cause.
date: 2026-10-22
keywords: linux, devops interview questions, perf top, perf top linux tutorial, cpu bottleneck troubleshooting linux, linux performance interview questions
category: linux
youtube: prMjn3IYSAM
---

A team restarted a box every time CPU hit 100%, and ten minutes later it pegged again. `top` showed the load average but nothing about why. This comes up in interviews because it separates engineers who root-cause from engineers who reboot and hope.

## The answer interviewers want

`perf top` samples your CPU live and shows exactly which function, kernel space or user space, is burning cycles right now. Run `perf top` to profile the whole system, or add `-p <PID>` to target one process. It sorts by overhead, so the hottest function sits at the top of the list.

One catch: without debug symbols installed, you get hex addresses instead of function names, which is useless for diagnosis. Install the debuginfo packages for the binary or library in question first, otherwise you're profiling garbage data you can't act on. That one step, live sampling plus symbols, is what breaks the restart-reboot-repeat loop and gets you to the actual offending function.

## Why interviewers ask this

They want to see if you reach for a tool that explains *why* CPU is pegged, not just one that confirms it is. Restarting a pod or box every time load spikes is a classic failure pattern that masks the real problem and guarantees a repeat page. This question also checks whether you know the difference between a snapshot tool like `top` and a live profiler.

## Follow-ups to expect

- **What do you do if perf top only shows hex addresses?** Install the debug symbols or debuginfo package for the relevant binary or library, then rerun it so the addresses resolve to function names.
- **How do you narrow the view to a single misbehaving process?** Pass `-p` followed by the PID, which scopes the sampling to that process instead of the whole system.
- **How is this different from just running top?** `top` tells you which process is consuming CPU; `perf top` tells you which function inside that process, kernel or user space, is actually doing the work.

## The common wrong answer

Most candidates either say "I'd restart the service" or jump straight to "check the logs," without naming a tool that attributes CPU time to a specific function. Others stop at `top` and treat high load average as the full diagnosis, missing that `top` tells you which process is hot but not which line of code inside it is spinning. Neither approach would have stopped the team's restart loop.
