---
title: Incident Severity Levels - P1 P2 P3 P4 Explained
description: How to classify P1, P2, P3, and P4 incident severity levels in SRE interviews, with business impact and response expectations.
date: 2026-10-22
keywords: sre, devops interview questions, incident severity levels, P1 P2 P3 P4 explained, sre interview questions, incident response interview
category: sre
youtube: XgLKp7lOyUw
---

Production is down and someone asks what severity this is. It's a staple SRE and DevOps interview question because the answer reveals whether you think in terms of business impact or just technical noise.

## The answer interviewers want

Severity levels map directly to customer impact, not to how technically interesting the bug is.

- **P1**: Customers can't use the product at all. This gets the CEO paged immediately, no debate.
- **P2**: Degraded performance affecting some users. This needs all hands on deck, but during business hours rather than a 3AM wake-up for everyone.
- **P3**: Minor issues with workarounds available. This goes in the next sprint, not an emergency fix.
- **P4**: Cosmetic bugs. This gets fixed when someone has spare time.

The part that separates a strong answer from a textbook one: when you're not sure which level an incident is, classify it one level higher than your gut says. It's much easier to downgrade a P1 to a P2 once you have more information than to explain to leadership why you sat on a customer-facing outage at P3 for two hours. Over-reacting costs you a stand-down email. Under-reacting costs you trust.

## Why interviewers ask this

They're checking whether you can translate a technical symptom into a business decision under pressure. Anyone can describe what a 500 error is; fewer people can say, in the first sixty seconds of an incident, who needs to know and how urgently. This question also tests judgment about escalation, since over-paging and under-paging both have real costs, and interviewers want to see you reason about that trade-off out loud.

## Follow-ups to expect

**"Who decides the severity level, and can it change?"** Whoever is first on the scene makes the initial call, usually the on-call engineer or incident commander, and it should be revisited as more information comes in. Severity is a live assessment, not a one-time label.

**"What happens if you get the severity wrong?"** If you call it too high, you stand people down and move on; if you call it too low, you've potentially left customers broken while the response stayed small. That asymmetry is exactly why the default should lean toward over-classifying.

**"How does severity affect communication, not just response?"** A P1 usually comes with customer-facing status updates and executive visibility, while a P3 or P4 might never leave the engineering backlog. The severity level sets the audience, not just the urgency.

## The common wrong answer

Most candidates describe severity purely in technical terms, like "P1 means the database is down," instead of in terms of customer impact. That framing falls apart the moment the interviewer asks about a database failure that has a working failover with zero customer impact, which by this framework is not a P1 at all. The strong answer always anchors on what the customer experiences, not on which system happens to be broken.
