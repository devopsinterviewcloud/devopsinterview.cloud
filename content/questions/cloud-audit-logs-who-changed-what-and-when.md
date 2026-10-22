---
title: Cloud Audit Logs - Who Changed What and When
description: How to answer DevOps interview questions on cloud audit logging: CloudTrail, Activity Log, data events, retention, and S3 object-level logging.
date: 2026-10-22
keywords: compliance, devops interview questions, cloud audit logs, aws cloudtrail interview questions, azure activity log monitoring, gcp cloud audit logs
category: compliance
youtube: nweqMJGGpA4
---

Every cloud breach postmortem starts with the same question: who touched this, and when? Interviewers ask this because audit logging sounds trivial until you find out your team only logged half the picture during an actual incident.

## The answer interviewers want

Audit logs capture every API call made against your cloud environment: who made it, when, and against which resource. Think of it as a security camera for your infrastructure. Every console click, every `aws` CLI command, every Terraform apply shows up as an event with an identity attached to it.

The baseline is enabling the platform's native service: `CloudTrail` on AWS, `Activity Log` on Azure. That gets you management-plane events, things like creating an IAM role, launching an instance, or changing a security group.

Where it gets real is storage and integrity. Logs need to live in a separate account from the one being audited, not sitting next to the resources they're watching. If an attacker or a rogue insider compromises the account, they shouldn't also be able to delete the evidence. On top of that: encrypt the logs at rest, and set an explicit retention period instead of relying on default settings, since compliance frameworks and incident investigations both need history that outlasts a 90-day default.

The gap most teams miss is data events. Management-plane logging tells you someone created a bucket. It does not tell you someone downloaded or deleted the file inside it. You have to explicitly enable S3 object-level logging (or the equivalent data-event logging on other platforms) or you are completely blind to file-level changes. That's usually the detail that separates a candidate who's configured this once from one who's actually had to use these logs during an investigation.

## Why interviewers ask this

This question is a cheap way to test whether you understand the difference between having a logging feature enabled and having a usable audit trail. Anyone can say "turn on CloudTrail." Fewer people mention the separate-account requirement, encryption, retention, or the data-events gap, which is exactly where real incidents go unsolved. It's also a proxy for whether you think about logs before an incident happens or only after.

## Follow-ups to expect

**What's the difference between management events and data events?** Management events cover control-plane actions like creating or modifying resources (IAM, networking, compute). Data events cover operations on the data itself, like object reads and writes in S3, which most teams don't enable by default.

**Why store audit logs in a separate account?** So that someone who compromises the monitored account can't also delete or tamper with the evidence of what they did.

**What happens if you rely on default retention settings?** You risk losing the history you need for a compliance audit or a delayed incident investigation, since defaults are often shorter than what regulators or postmortems require.

## The common wrong answer

Most candidates say "we enable CloudTrail" and stop there, treating it as a checkbox rather than a system. They skip the separate-account storage, skip retention policy, and almost never mention data events, which means their answer describes a logging feature, not an actual audit capability.
