---
title: Blameless Postmortems - How to Write Them
description: Learn how to write a blameless postmortem for SRE interviews: timeline, impact, system failures, and concrete action items.
date: 2026-10-22
keywords: sre, devops interview questions, blameless postmortem, SRE, incident management, devops interview
category: sre
---

A postmortem that lists 'human error' as the root cause is a postmortem that stopped too early. Interviewers ask this because blameless postmortems are one of the clearest signals of SRE maturity on a team, and a lot of candidates can describe the format without actually understanding the point of it.

## The answer interviewers want

Start with the timeline and impact. Lay out what happened, when it happened, and who was affected. This part is just facts, no finger-pointing.

From there, shift the focus from human failures to system failures. The question to keep asking is: why did the system allow this mistake to happen in the first place? If an engineer ran the wrong command, that's not the end of the analysis, that's the start of it. What let that command run against production? Why didn't anything catch it?

End with concrete action items. Each one needs an owner and a deadline. Vague commitments like "we'll be more careful next time" don't count as action items, because they don't change anything about the system and they won't survive contact with the next on-call rotation.

A good gut check: if the postmortem doesn't make someone a little uncomfortable about the system design, the analysis probably didn't go deep enough. Comfortable postmortems tend to mean the hard questions about tooling, process, and safeguards got skipped.

## Why interviewers ask this

This question tests whether a candidate treats incidents as inputs to engineering work or as events to close out and move past. Interviewers are listening for whether you default to blaming an individual or whether you instinctively reframe toward the system that let the failure happen. It also shows whether you understand that a postmortem without owned, dated action items is just a story, not a process improvement.

## Follow-ups to expect

**What do you do if an action item keeps getting deprioritized sprint after sprint?** That's worth flagging as its own signal: if a system weakness never gets fixed, it says something about how the org prioritizes reliability work versus feature work.

**How do you keep a postmortem blameless when the mistake really was an individual's action?** Keep the facts about what the person did, but direct every "why" question at the system: why was that action possible, why wasn't it caught, why didn't guardrails stop it.

**What belongs in the timeline versus the analysis section?** The timeline is strictly what happened and when, observable facts and impact. The analysis section is where you dig into system causes and allowed conditions, kept separate so facts don't get tangled up with interpretation.

## The common wrong answer

Most candidates can recite "blameless" and "no finger-pointing" as buzzwords, but then describe a postmortem that still ends at "the engineer made a mistake" with no further digging. The other common failure is a postmortem full of good analysis but closing with soft, unowned commitments instead of specific action items with names and dates attached. Both versions look blameless on the surface but change nothing about the system.
