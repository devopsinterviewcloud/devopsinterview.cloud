---
title: Linux File Permissions - chmod chown Explained
description: How to explain chmod vs chown in a Linux interview, why 777 is dangerous, and when to use symbolic vs numeric permissions.
date: 2026-10-22
keywords: linux, devops interview questions, linux file permissions, chmod command tutorial, chown command explained, linux interview questions
category: linux
youtube: ZIZp0UK-2Sk
---

Permissions questions show up in almost every Linux or DevOps interview because they're a cheap way to separate people who've memorized a cheat sheet from people who've actually broken production with a bad `chmod`. The question sounds basic, but it's really testing judgment.

## The answer interviewers want

`chmod` and `chown` solve two different problems, and mixing them up is the first red flag an interviewer listens for.

`chmod` changes what people can *do* with a file: read, write, execute. `chown` changes *who owns* the file. A useful mental model: if the file is a house, `chmod` sets the lock rules, and `chown` changes who holds the deed.

In day-to-day use:

- `chmod 644 file` - owner gets read and write, everyone else gets read only. This is the default for most regular files.
- `chmod 755 file` - same as above but adds execute for the owner (and read+execute for group/others). This is what you use for scripts and binaries.
- `chown user:group file` - changes both the owner and the group in a single command.

The part most people skip: you don't have to memorize octal numbers at all. Symbolic mode works directly on intent. `chmod +x file` makes it executable. `chmod -w file` removes write access. This is safer than numeric modes because you're not recalculating a three-digit number and risking a typo that opens up permissions you didn't mean to touch.

And then there's `chmod 777`. It gives read, write, and execute to the owner, the group, and everyone else on the system. On a production box, that's effectively handing out the keys to anyone with access to the machine. Anyone who suggests `777` as a quick fix is proposing a security hole, not a solution.

## Why interviewers ask this

They're checking whether you understand permissions as a security boundary, not just syntax to recite. The `chmod` vs `chown` distinction tests basic conceptual clarity. The `777` question tests judgment under pressure, whether you'll reach for the "it works now" fix when something's broken at 3AM instead of diagnosing the actual permission problem.

## Follow-ups to expect

**"When would you actually need `chown`?"** When a file is owned by the wrong user or group, usually after a deploy script runs as root and leaves app files that the app's service account can't write to.

**"Why not just use `777` to unblock yourself quickly and fix it later?"** Because "later" rarely happens, and in the meantime any user or process on the box can read, write, or execute that file, which is a direct path to a compromised service.

**"What's the difference between `chmod +x` and `chmod 755`?"** `+x` only adds execute permission on top of whatever's already set, while `755` sets the entire permission string explicitly, which can unintentionally remove permissions you meant to keep.

## The common wrong answer

The most common mistake is treating `chmod` and `chown` as interchangeable "permissions commands" without being able to say which one controls ownership versus access. A close second is defending `chmod 777` as a reasonable quick fix for a permissions error instead of naming it as the security risk it is.
