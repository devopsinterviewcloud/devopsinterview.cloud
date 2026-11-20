---
title: Incident Severity Levels - P1 P2 P3 P4 Explained
description: How to classify P1, P2, P3, and P4 incident severity levels in SRE interviews, with business impact and response expectations.
date: 2026-10-22
updated: 2026-11-20
keywords: sre, devops interview questions, incident severity levels, P1 P2 P3 P4 explained, sre interview questions, incident response interview
category: sre
youtube: XgLKp7lOyUw
---

Production is down and someone asks what severity this is. It's a staple SRE and DevOps interview question because the answer reveals whether you think in terms of business impact or just technical noise.

## The answer interviewers want

Every company writes its own severity matrix, but the levels should map to customer impact, not to how technically interesting the bug is.

- **P1**: Customers can't use the product at all, or data is being lost. Page the on-call and an incident commander immediately and bring leadership in early, no debate.
- **P2**: Degraded performance or a broken feature affecting some users. This still pages someone right away, 3AM included, just without the executive and public communication a P1 gets.
- **P3**: Minor issues with workarounds available. This goes in the next sprint, not an emergency fix.
- **P4**: Cosmetic bugs. This gets fixed when someone has spare time.

The part that separates a strong answer from a textbook one: when you're not sure which level an incident is, classify it one level higher than your gut says. It's much easier to downgrade a P1 to a P2 once you have more information than to explain to leadership why you sat on a customer-facing outage at P3 for two hours. Over-reacting costs you a stand-down email. Under-reacting costs you trust.

## A severity matrix you can sketch in an interview

| Level | Customer impact | Example | Response | Communication |
|---|---|---|---|---|
| P1 | Product down or unusable for most users, data loss, or an active security breach | Nobody can log in | Page on-call and an incident commander now | Status page, leadership, regular updates (every 30 minutes is common) |
| P2 | A major feature broken or badly degraded for some users | Search times out for customers in one region | Page on-call now | Incident channel, plus the status page if customers can see it |
| P3 | Minor problem with a workaround | CSV export fails, but the API returns the same data | Ticket, fixed within days | Team channel |
| P4 | Cosmetic | A misaligned button on the settings page | Backlog | None |

## Classifying four incidents

1. **Card payments fail for 30% of checkouts after a payment provider update.** By the letter of the matrix that's a P2, since most customers can still pay. But it's lost revenue every minute and you don't know yet whether it's spreading. Call it P1 and downgrade once you know more.
2. **The primary database fails over to its replica. Errors spike for 40 seconds, then recover on their own.** How long it lasted doesn't set the severity; the impact does. If a handful of requests failed and nobody lost data or money, most matrices put that at P3. If payments failed during those 40 seconds, it rates higher. Either way, mark it resolved, keep the severity the impact justified, open a follow-up to find out why it failed over, and write it up if nobody expected it.
3. **Password reset emails have stopped sending.** Logged-in users are fine, but anyone locked out stays locked out. A broken feature for some users: P2.
4. **A dashboard shows yesterday's date in the wrong time zone.** P4.

Once you've picked a level, put it in the first message along with who's in charge and when the next update comes:

```text
INCIDENT: card payments failing for ~30% of checkouts
Severity: P1 (may downgrade once scope is clear)
Impact: customers can't complete purchases, started 14:05 UTC
Incident commander: on-call SRE
Next update: 14:45 UTC in #inc-payments
```

Severity also decides the follow-up. Many teams require a [blameless postmortem](/questions/blameless-postmortems-how-to-write-them) for every P1 and P2, and [on-call best practices](/questions/on-call-best-practices-don-t-burn-out-your-team) covers keeping the paging side sustainable.

## Why interviewers ask this

They're checking whether you can translate a technical symptom into a business decision under pressure. Anyone can describe what a 500 error is; fewer people can say, in the first sixty seconds of an incident, who needs to know and how urgently. This question also tests judgment about escalation, since over-paging and under-paging both have real costs, and interviewers want to see you reason about that trade-off out loud.

## Follow-ups to expect

**"Who decides the severity level, and can it change?"** Whoever is first on the scene makes the initial call, usually the on-call engineer or incident commander, and it should be revisited as more information comes in. Severity is a live assessment, not a one-time label.

**"What happens if you get the severity wrong?"** If you call it too high, you stand people down and move on; if you call it too low, you've potentially left customers broken while the response stayed small. That asymmetry is exactly why the default should lean toward over-classifying.

**"How does severity affect communication, not just response?"** A P1 usually comes with customer-facing status updates and executive visibility, while a P3 or P4 might never leave the engineering backlog. The severity level sets the audience, not just the urgency.

## The common wrong answer

Most candidates describe severity purely in technical terms, like "P1 means the database is down," instead of in terms of customer impact. That framing falls apart the moment the interviewer asks about a database failure that has a working failover with zero customer impact, which by this framework is not a P1 at all. The strong answer always anchors on what the customer experiences, not on which system happens to be broken.
