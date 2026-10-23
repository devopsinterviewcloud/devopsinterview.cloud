---
title: ISO 27001 for DevOps - 5 Controls You Need
description: Which ISO 27001 controls apply to a DevOps pipeline? Five controls interviewers actually ask about, plus why pipeline logs are your audit evidence.
date: 2026-10-22
keywords: compliance, devops interview questions, iso 27001 devops, iso 27001 interview questions, devops compliance interview
category: compliance
---

ISO 27001 comes up in DevOps interviews more often than people expect, especially for roles at regulated companies or vendors selling into enterprise. Candidates tend to treat it as a paperwork exercise and freeze when asked which controls actually map to a pipeline.

## The answer interviewers want

There's a myth that ISO 27001 is just paperwork. It isn't, and five controls come up repeatedly when interviewers probe this:

1. **Least-privilege access on CI/CD service accounts.** Pipeline identities should only have the permissions they need for their specific job, nothing broader.
2. **Immutable audit logs.** This means infrastructure-level logging like AWS CloudTrail, not just application logs. Auditors want a record that can't be edited after the fact.
3. **Every pipeline change tracked via pull request.** Changes to pipeline config and infrastructure-as-code need a reviewable trail, not direct pushes.
4. **Automated vulnerability scanning in the pipeline.** Tools like `trivy` or `snyk` both work; the point is that scanning is automated and runs on every build, not done manually before audits.
5. **Documented incident response runbooks, tested at least annually.** Having a runbook isn't enough; it needs to actually be exercised on a regular cadence.

The detail most candidates miss: auditors want evidence, not intent. A policy document saying you do code review doesn't satisfy an auditor. The pull request history that shows you actually did it does. Your pipeline logs are your compliance artifacts, not an afterthought you generate for the audit. Treat them that way from day one, and the audit becomes a matter of exporting what already exists rather than scrambling to reconstruct history.

## Why interviewers ask this

This question separates engineers who've only heard of compliance from those who've actually built a pipeline that could survive an audit. It also checks whether a candidate understands that security controls and DevOps practices overlap, rather than treating compliance as a separate team's problem bolted on after the fact.

## Follow-ups to expect

- **How would you prove least-privilege access to an auditor?** Show the IAM policy attached to the CI/CD service account and explain why each permission is there, ideally with a review process that catches scope creep.
- **What happens if your vulnerability scanner flags something in production code?** The pipeline should have a defined policy for blocking builds on high-severity findings, with a documented exception process for anything that gets waived.
- **How often should incident response runbooks be tested?** At least annually, per the source controls, though some teams tie testing to major infrastructure changes as well.

## The common wrong answer

Candidates usually describe ISO 27001 as an annual paperwork exercise handled entirely by a compliance team, or they recite generic security practices without connecting them to specific controls an auditor asks about. The weaker answers also miss that logs and PR history are the evidence itself, not supporting material for a separate compliance report.
