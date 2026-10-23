---
title: Alert Fatigue - 4 Ways to Kill Noisy Alerts
description: How to answer the alert fatigue interview question: deduplicate, group, route by severity, tie thresholds to SLOs, delete dead alerts.
date: 2026-10-22
keywords: observability, devops interview questions, alert fatigue, alert fatigue devops interview, noisy alerts kubernetes, observability interview questions
category: observability
youtube: rmA3ro6gdwM
---

300 alerts fire overnight and engineers ignore every one of them. This is one of the most common observability questions in SRE and DevOps interviews because almost every candidate has lived through it, and how you talk about fixing it tells the interviewer whether you understand monitoring or just configure it.

## The answer interviewers want

Juniors respond to alert fatigue by adding more thresholds. Seniors ask a different question first: why is this alert firing if nobody acts on it?

There are four moves that actually fix the problem:

1. **Deduplicate** - collapse repeated firings of the same underlying issue into a single alert instead of paging on every occurrence.
2. **Group** - bundle related alerts (same service, same root cause) so one incident produces one notification, not twenty.
3. **Route by severity** - not every alert deserves a page at 3AM. Critical, user-facing issues go to on-call; everything else goes to a dashboard or ticket queue.
4. **Tie thresholds to SLOs** - set alert thresholds against your service level objectives, not arbitrary numbers someone picked because they looked reasonable in a dashboard once.

The detail most candidates miss: if an alert fires and nobody pages or responds, delete it. A dead alert doesn't just waste a notification, it erodes trust in every alert that comes after it. Once engineers learn that some alerts are noise, they start treating all alerts as noise, including the ones that matter. That's the real mechanism behind alert fatigue, and it's why the fix isn't more tuning, it's ruthless deletion.

Get this right and the next time 300 alerts fire at 3AM, you know exactly which ones matter and which ones are static.

## Why interviewers ask this

This question separates people who treat monitoring as a checklist from people who treat it as a feedback loop. Interviewers want to hear that you connect alert design to SLOs and to on-call behavior, not just to metric thresholds. They're also checking whether you'll actually delete things, since most engineers are reluctant to remove an alert even when it's clearly useless.

## Follow-ups to expect

**How do you decide what severity an alert gets?** Tie it to user impact and SLO burn rate: anything that threatens the SLO or affects users directly gets paged, anything informational goes to a dashboard or low-priority channel.

**What do you do with an alert that nobody ever acts on?** Delete it. If it's not actionable and nobody responds, it's just noise that trains people to ignore real alerts.

**How do you stop this problem from coming back?** Review alert-to-action ratios periodically. Alerts with no associated response over time are candidates for deletion or rethinking.

## The common wrong answer

Most candidates say they'd "tune the thresholds" or "add more context to the alert," which treats alert fatigue as a tuning problem instead of a trust problem. That answer misses the real fix: removing alerts nobody acts on and grounding the remaining ones in SLOs, not guesswork.
