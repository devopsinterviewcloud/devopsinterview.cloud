---
title: On-Call Best Practices - Don't Burn Out Your Team
description: How to design sustainable on-call rotations that prevent burnout: fair rotation, alert tuning, handoffs, and blameless post-mortems.
date: 2026-10-22
keywords: sre, devops interview questions, on call best practices, sre on call rotation, devops on call interview questions, prevent engineer burnout
category: sre
youtube: vQ8DD1aOedc
---

On-call that pages the same person every night isn't a process problem, it's a design problem. Interviewers ask this because almost every SRE or platform role involves on-call, and how you answer tells them whether you've actually lived through a bad rotation or just read about one.

## The answer interviewers want

Sustainable on-call rests on four pillars: fair rotation, meaningful alerts, proper handoffs, and follow-the-sun coverage.

Fair rotation means weekly shifts with a primary and a secondary on-call. The secondary exists so the primary isn't the sole point of failure when they're asleep, sick, or just slammed. Weekly rotations (rather than daily swaps) give people predictability and let them plan around it.

Meaningful alerts means every page has a severity level and a defined escalation path. If everything pages at the same priority, people stop trusting the pager and start sleeping through real incidents. Alerts should map to actual customer or system impact, not just "something looks off."

Proper handoffs matter because context gets lost between shifts. The outgoing on-call should hand the incoming one a clear picture of what's still open, what's flaky, and what to watch.

Follow-the-sun coverage spreads the rotation across time zones so no single team is always eating the 3AM pages. This only works if the teams in each region are genuinely staffed and trained to cover, not just nominally on the schedule.

The part that separates a good answer from a great one: blameless post-mortems for every page, not just major incidents. The goal isn't to find who to blame, it's to fix the alert, not just the issue. If an alert fired and didn't need a human response, that's a bug in your alerting, and it should get fixed the same way a code bug would. Done well, on-call practice saves both the team and the systems it protects.

## Why interviewers ask this

This question probes whether you think about on-call as a system to be engineered, not just a schedule to be filled. Interviewers want to know if you've seen alert fatigue firsthand and whether you treat it as an operational failure worth fixing, rather than an inevitable cost of running production systems.

## Follow-ups to expect

- **What do you do when the same alert keeps paging and turns out to be noise?** Treat it as a bug: tune the threshold, fix the underlying condition, or remove the alert entirely rather than letting people learn to ignore it.
- **How do you handle a rotation when one region doesn't have enough trained engineers for follow-the-sun?** You can't fake follow-the-sun coverage; until that region is properly staffed and trained, the rotation should reflect reality rather than an aspirational schedule.
- **Why blameless post-mortems specifically for every page, not just major incidents?** Minor pages are where alert fatigue starts, so catching and fixing noisy alerts early prevents the bigger problem of an on-call engineer missing a real incident later.

## The common wrong answer

Most candidates describe the rotation schedule, primary and secondary shifts, maybe an escalation policy, and stop there. That answer treats on-call as a staffing puzzle. It misses the actual fix: blameless post-mortems that drive alerts to get tuned or removed, which is what makes a rotation sustainable instead of just scheduled.
