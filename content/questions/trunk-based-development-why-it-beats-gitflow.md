---
title: Trunk-Based Development - Why It Beats GitFlow
description: Why interviewers ask trunk-based vs GitFlow, what signal they want, and how to answer without padding or hype.
date: 2026-10-22
keywords: cicd, devops interview questions, trunk based development vs gitflow, trunk based development interview questions, gitflow vs trunk based development, cicd interview questions
category: cicd
youtube: n7GwPMdI8y8
---

A recruiter or hiring manager drops this question to see if you understand branching strategy as a velocity problem, not a Git trivia problem. It comes up constantly in CI/CD interviews because it reveals whether you've actually shipped on a team with fast release cycles or just read about one.

## The answer interviewers want

Trunk-based development means everyone commits to `main` daily. GitFlow, by contrast, creates long-lived branches (`develop`, `feature/*`, `release/*`) that drift apart from each other and cause merge hell when they finally come back together.

With trunk-based development you get continuous integration in the literal sense: changes are integrated into `main` constantly, feedback comes fast, and deployments can happen multiple times per day instead of being bottled up behind a release branch.

The key framing to give an interviewer: GitFlow was designed for scheduled releases, back when software shipped on a calendar, maybe once a month or once a quarter. Modern applications deploy continuously, often many times a day. Long-lived branches are a fine tool for a world that doesn't deploy often. They're a liability in a world that does. So the choice isn't "trunk-based is objectively superior Git hygiene," it's "trunk-based matches how we actually ship now, and GitFlow doesn't."

## Why interviewers ask this

They're checking whether you can connect a branching model to a deployment cadence, not just recite strategy names. A candidate who says "trunk-based is better" without explaining why GitFlow's assumptions (scheduled releases) no longer hold sounds like they memorized a blog post. They also want to see if you understand that branching strategy is a consequence of your release process, not an independent choice.

## Follow-ups to expect

- **How do you handle incomplete features on `main` with trunk-based development?** The source doesn't cover this directly, but the implication is that you lean on practices like feature flags so unfinished work can sit in `main` without being exposed to users, since everyone's committing to the same branch daily.
- **What breaks if a team adopts trunk-based development without changing anything else?** If deployments still happen on a slow manual cadence, you lose the main benefit, which is fast feedback and frequent deployment. The branching model alone doesn't create velocity.
- **When would GitFlow still make sense?** Based on its original design intent, it fits teams or products that genuinely ship on a fixed schedule rather than continuously, since that's the release pattern it was built around.

## The common wrong answer

Candidates usually answer with a surface-level comparison: "trunk-based has one branch, GitFlow has many branches, trunk-based is simpler." That's true but shallow, and it misses the actual point interviewers are listening for, which is the link between branching strategy and deployment frequency. Saying GitFlow is "outdated" without explaining it was built for scheduled releases, not continuous ones, reads as a memorized talking point rather than real understanding.
