---
title: Grafana Dashboards - 5 Design Rules That Work
description: How to answer Grafana dashboard design interview questions: RED metrics, template variables, annotations, and avoiding panel overload.
date: 2026-10-22
keywords: observability, devops interview questions, grafana dashboards, grafana dashboard design interview questions, grafana panel best practices, observability interview questions
category: observability
youtube: oWB3jPguSzw
---

A recruiter pulls up a Grafana dashboard with forty panels crammed onto one screen and asks you to critique it. This question shows up in observability and SRE interviews because anyone can build a dashboard, but designing one that's useful during an incident is a different skill entirely.

## The answer interviewers want

Stop stuffing forty panels onto one dashboard. One rule beats everything else: **one panel answers one question**. If you can't say what decision a panel drives, delete it.

In practice, that looks like:

- Top row shows RED metrics: rate, errors, duration.
- Drill down left to right, going from service level down to the database.
- Use template variables so a single dashboard works across every environment instead of maintaining a copy per environment.
- Add deploy annotations and threshold lines. Without them, every graph looks like a mystery novel. You can see a latency spike, but not whether it lines up with a deploy or a config change.

That's the line that separates a real dashboard from a wall of graphs: stop stuffing panels in, and make each one answer exactly one question.

## Why interviewers ask this

They're checking whether you've actually been on call, or whether you just know how to drag panels into Grafana. Anyone can build a dashboard that looks impressive in a demo. Fewer people can explain what makes one usable when you're half-asleep at 3AM trying to find the cause of a page. The question also probes whether you think about dashboards as decision-making tools, not decoration, and whether you understand observability conventions like RED metrics well enough to structure information instead of just displaying it.

## Follow-ups to expect

**How do template variables help across environments?** They let one dashboard definition serve staging, production, and any other environment by swapping the variable instead of duplicating dashboards, which keeps panels consistent and easier to maintain.

**Why put deploy annotations on the graphs instead of just checking a deploy log separately?** Because correlation matters in the moment. Seeing a spike line up with a deploy marker on the same graph is faster than cross-referencing two tools while something is on fire.

**What's the reasoning behind drilling down left to right, service to database?** It mirrors how you'd actually investigate: confirm the symptom at the service level first, then move down the stack toward the database only once you know where to look.

## The common wrong answer

Most candidates describe a dashboard by listing visual polish: color schemes, panel layout, maybe a mention of Grafana's templating feature without explaining why it matters. They treat the question as a tooling question instead of a design question. The weak answer never mentions deleting panels, never ties anything to RED metrics, and never explains what a panel is supposed to help someone decide. That tells the interviewer the candidate has looked at dashboards, but hasn't been the one staring at them during an outage trying to figure out what broke.
