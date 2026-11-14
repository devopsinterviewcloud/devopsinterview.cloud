---
title: SLO-Based Alerting - Stop Alert Fatigue for Good
description: How SLO-based alerting stops alert fatigue: error budget burn rate, multi-window alerts, and why you start with a looser SLO.
date: 2026-10-22
keywords: observability, devops interview questions, slo based alerting, slo alerting interview questions, stop alert fatigue devops, error budget alerting
category: observability
youtube: XtKX7ZVFlGo
---

Your on-call rotation pages people for nothing, then the real outage gets ignored because everyone's numb to the noise. Interviewers ask how you'd prevent alert fatigue while still catching real issues, because it reveals whether you alert on symptoms users feel or on infrastructure metrics that just look scary.

## The answer interviewers want

SLO-based alerting ties pages to what users actually experience, measured through an SLI like request success rate or latency. Instead of setting a threshold on CPU or memory, you alert on error budget burn rate: how fast you're consuming the acceptable amount of failure defined by your SLO.

In practice, you set multi-window, multi-burn-rate alerts. A fast burn alert catches immediate, severe issues, where you're burning through budget so quickly that a page is justified right now. A slow burn alert catches trending problems, where the degradation is real but gradual, so it can route to a ticket instead of waking someone up. Each alert checks a long window and a short one, so it only fires while the burn is still happening and clears soon after it stops. Prometheus or Datadog can handle the burn rate math for you, you don't need to hand-roll it.

Here's the part most people skip: start with a target the service can actually meet, even if that's 99% rather than 99.9%. If the target is tighter than the service's normal behavior, ordinary variance eats the whole budget on its own. That gives you the same noisy, meaningless alerts you were trying to get away from. Start looser, then tighten it once you understand your real failure patterns. Done right, this gets rid of most 3AM pages for nothing, because you're paging on budget burn users can feel, not on a scary-looking server graph.

## Why interviewers ask this

They're checking whether you understand SLO methodology beyond the buzzword, specifically whether you alert on symptoms that affect users rather than causes that might not matter. They also want to see if you've thought about the practical tuning problem: a technically correct SLO that's too strict will still generate noise, and that's a nuance a lot of candidates miss.

## Follow-ups to expect

**What's the difference between a fast burn and slow burn window?** Fast burn alerts on a short window where you're consuming error budget rapidly, which justifies an immediate page. Slow burn alerts on a longer window where consumption is steady but trending badly, which can wait for a ticket instead of an interrupt.

**Why not start at 99.9%?** If the service doesn't already run that well, a 99.9% target leaves less budget than ordinary noise uses, so it burns all the time and alerts constantly. Starting at a target you actually meet, say 99%, gives the burn rate math enough room to separate real degradation from normal variance.

**What should the SLO actually measure?** It should reflect what users experience, like request success rate or latency, not server-level metrics like CPU or memory that can look fine while users are suffering, or look bad while nobody's affected.

## The common wrong answer

Most candidates default to "set thresholds on CPU, memory, and disk" or propose a flat uptime percentage without connecting it to an error budget at all. Others jump straight to a 99.9% or higher SLO because it sounds more rigorous, not realizing that an overly tight target removes the breathing room needed for burn rate alerting to filter out noise in the first place.
