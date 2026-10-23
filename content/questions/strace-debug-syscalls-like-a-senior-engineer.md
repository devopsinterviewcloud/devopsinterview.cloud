---
title: strace - Debug Syscalls Like a Senior Engineer
description: A process fails silently with no error logs. Learn how strace shows every syscall in real time to find exactly where it breaks.
date: 2026-10-22
keywords: linux, devops interview questions, strace linux debugging, system calls tracing linux, linux debugging tools interview, strace command tutorial
category: linux
youtube: _tMYVJB-Oqg
---

A process dies or hangs with nothing useful in the logs, and you're expected to figure out why without touching the code. This is a staple Linux debugging question because it tests whether you reach for tracing tools or just guess.

## The answer interviewers want

`strace` is your x-ray vision into what a process is actually doing at the system call level. It shows every syscall the process makes, in real time, as it happens.

You can attach it to a process that's already running:

```
strace -p <PID>
```

Or launch a command directly under it:

```
strace ./your-command
```

Either way, you'll see exactly where execution fails, the specific syscall, its arguments, and its return value, instead of guessing from a blank log file.

What separates a senior engineer from someone who just knows the tool exists is filtering. Raw `strace` output on a busy process is a wall of noise. Use `-e` to filter by syscall type:

```
strace -e open ./your-command
```

This shows only file-related operations, which is usually where "permission denied" or "file not found" failures hide when the application itself swallows the error. The same filtering approach works for other syscall categories too, you're not stuck reading everything the process touches.

The core idea: when an application fails silently, it's not necessarily broken, it's often just not logging the thing that matters. The kernel still sees every syscall it made, and `strace` lets you read that record directly.

## Why interviewers ask this

This question separates people who understand Linux at the syscall level from people who only know application-layer debugging. It also tests troubleshooting instinct under pressure, specifically whether you default to a systematic tool instead of adding print statements and redeploying, which isn't always possible in production.

## Follow-ups to expect

**Can you use strace on a process that's already running, without restarting it?** Yes, attach to it directly with `strace -p <PID>`. You don't need to stop and relaunch anything to get syscall visibility.

**Raw strace output is huge. How do you cut through the noise?** Filter by syscall type with `-e`, for example `strace -e open` to see only file operations. The same filtering pattern applies to narrowing down any other syscall category you're chasing.

**Why would strace show something application logs don't?** Logs only capture what a developer explicitly chose to write out. strace shows every system call the process makes, so it catches failures that happen below the application's own error handling, where nothing was ever logged in the first place.

## The common wrong answer

Most candidates default to restarting the process, adding print statements, or digging through application logs that were never going to contain the answer. That works when the bug is in your own code's logic, but it does nothing when the process fails at the OS boundary, a missing file, a permission error, a blocked syscall, none of which the application ever logs because it never even gets the chance.
