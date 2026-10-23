---
title: Toil Budget - Measure and Reduce Manual Work
description: How to define, measure, and manage a toil budget in SRE interviews, including Google's 50% rule and tracking methods.
date: 2026-10-22
keywords: sre, devops interview questions, toil budget sre, sre interview questions toil, site reliability engineering toil, sre interview questions
category: sre
youtube: 7DBX0Yl8pSM
---

A team spending 80% of its time firefighting instead of shipping is a classic failure pattern, and interviewers want to know if you'd recognize it before it burns everyone out. The toil budget question tests whether you can quantify operational drag instead of just complaining about it.

## The answer interviewers want

A toil budget puts a hard limit on how much manual, repetitive, non-engineering work your team absorbs. Google's rule of thumb is a ceiling of 50% toil, with the other 50% going to actual engineering projects. Think of it as a guardrail against your team quietly turning into a human script.

You measure it by tracking the work, not guessing at it. Common methods are ticket tags, time logging, or sprint allocation, anything that lets you separate `toil` from `project work` in your reporting. Break it down further: measure interrupts, manual deployments, and reactive incident work separately from planned engineering. That separation is what lets you see the trend line instead of a single noisy number.

Here's the part most candidates miss: toil isn't automatically bad. Some manual tasks exist because they teach you how the system actually behaves under load, what breaks, what the failure modes look like. The real distinction isn't "toil vs no toil," it's intentional, temporary toil you've chosen to tolerate while you learn or build the fix, versus endless firefighting that never gets scheduled for automation. A good answer closes with the loop: measure it, set a budget against it, then automate the pieces that cross the line from useful to draining.

## Why interviewers ask this

This question separates people who've internalized SRE principles from people who've just memorized the term "toil." They want to see that you can put a number on manual work, track it over time, and use that number to make a prioritization argument to leadership, not just vent about being overworked. It also tests whether you understand that some manual work is a deliberate tradeoff, not a failure.

## Follow-ups to expect

**How would you actually tag tickets to measure toil in a real system?** Use a consistent label in your ticketing tool, for example `toil` versus `project`, and review the ratio per sprint so trends are visible before the budget is blown.

**How do you tell good toil from bad toil?** Good toil is temporary and chosen deliberately because it's teaching you something about the system; bad toil is the same manual task repeating indefinitely with no automation plan attached to it.

**What do you do once toil exceeds the 50% budget?** Treat it as a signal to reprioritize: pull engineering time away from new features and point it at automating the highest-volume manual tasks until the ratio comes back under the line.

## The common wrong answer

Most candidates either skip measurement entirely and just say "we automate everything," or they treat every manual task as a problem to be eliminated on sight. Both miss the point. Without measurement you can't prove the budget exists or that it's being honored, and without the intentional-versus-firefighting distinction you end up automating things too early, before you've learned enough from doing them by hand to automate them well.
