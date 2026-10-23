---
title: How to Answer Scenario-Based Interview Questions
description: How to answer the production outage interview question using STAR, with a concrete example and the metrics that signal seniority.
date: 2026-10-22
keywords: career, devops interview questions, scenario interview questions, technical interview preparation, behavioral interview questions
category: career
---

Interviewers ask this because almost everyone has a production incident story, but almost no one tells it well. It's a cheap way to separate engineers who can communicate impact from engineers who just did the work and never framed it.

## The answer interviewers want

Use the STAR method: Situation, Task, Action, Result. Skipping straight to the technical fix is the most common reason this answer falls flat.

**Situation** - what broke. Be specific: "the database crashed at 2AM."

**Task** - your role. State it plainly: "I owned incident response."

**Action** - what you actually did. For example: switched to a read replica, implemented a circuit breaker, and automated failover.

**Result** - the business impact, in numbers. This is the part seniors get right and juniors skip. In this example: MTTR dropped from 45 minutes to 8 minutes.

Always close with metrics: downtime reduced, money saved, team productivity gained. A story that ends on the technical action and never states the outcome reads as incomplete, even if the engineering was solid.

## Why interviewers ask this

This question is a proxy for three things at once: can you operate under pressure, do you understand the actual blast radius of what you fixed, and can you communicate that to a non-engineer in a room (a director, a customer, a VP). Candidates who ramble through the technical steps without naming impact signal that they either don't track outcomes or can't translate their work into business terms. Both are disqualifying at senior levels.

## Follow-ups to expect

**"What would you have done differently?"** - Have a real answer ready, even a small one. Something like catching the failure mode earlier with better alerting shows reflection, not just execution.

**"How did you prevent it from happening again?"** - This is where the circuit breaker and automated failover from the example become the answer. The interviewer wants to hear that the fix was systemic, not just a one-time patch.

**"How did you communicate the incident to stakeholders during the outage?"** - Ties back to the Result step. If you tracked MTTR and impact numbers, you already have the material for this answer.

## The common wrong answer

Most candidates launch straight into the technical narrative: the database crashed, I checked the logs, I found the root cause, I deployed a fix. It's accurate and it's dull, and it ends with no number attached. That structure answers "what happened" but never answers "so what." Interviewers walk away unsure whether the outage cost the company ten minutes or ten hours, and whether the candidate even knows the difference. Rambling without the Situation/Task/Action/Result shape, and skipping the Result entirely, are the two failure modes that show up most often.
