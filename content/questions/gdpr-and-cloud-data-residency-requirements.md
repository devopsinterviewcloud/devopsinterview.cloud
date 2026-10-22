---
title: GDPR and Cloud - Data Residency Requirements
description: How GDPR data residency works in cloud environments, why provider compliance isn't yours, and how interviewers test this.
date: 2026-10-22
keywords: compliance, devops interview questions, gdpr cloud data residency, gdpr data residency requirements, cloud compliance gdpr interview, eu data residency rules
category: compliance
---

A team ships a feature, EU customer data ends up replicated to a us-east-1 bucket, and three months later legal is asking questions about GDPR exposure. This scenario is a favorite in compliance-focused DevOps interviews because it exposes a common blind spot: engineers assume the cloud provider's compliance certifications cover them automatically.

## The answer interviewers want

GDPR requires that EU personal data stays within the EU, or moves only to countries the EU has deemed "adequate," or is transferred under a valid legal mechanism. Think of it like a digital border: data can't just hop countries without permission attached to it.

In practice, this means configuring region constraints at the infrastructure level so data physically lands and stays where it's supposed to. You'd use something like AWS Local Zones or pin resources to Azure regions located in the EU, and you don't treat that as a one-time setup. You audit data flows regularly, because replication, backups, CDNs, logging pipelines, and third-party SaaS integrations can all quietly move data across borders without anyone noticing.

The detail that catches people out: the cloud provider being compliant does not mean your workload is compliant. AWS or Azure holding ISO certifications or GDPR-aligned infrastructure says nothing about how you've configured your account, your buckets, your replication rules, or your logging destinations. You are the data controller. Under GDPR, the controller is the one who decides how and why data is processed, and that responsibility doesn't transfer to the provider just because you're using their infrastructure. If data ends up in the wrong region because of a misconfigured bucket policy or a default backup setting, that's on you, not on AWS.

## Why interviewers ask this

This question screens for whether a candidate understands the shared responsibility model beyond security basics. A lot of engineers can recite "shared responsibility" for patching and network controls but haven't extended that thinking to data governance. Interviewers want to see that you treat compliance as something you actively engineer and audit, not something you inherit by picking a reputable cloud vendor.

## Follow-ups to expect

**How would you detect a data residency violation before an auditor does?** Set up regular audits of data flows, including backups, replication targets, and logging destinations, since these are the paths most likely to leak data across borders unnoticed.

**What's the difference between the cloud provider's compliance and your compliance?** The provider's certifications cover their infrastructure; you're still the data controller responsible for how your specific configuration routes and stores personal data.

**What controls would you put in place beyond picking an EU region?** Region constraints on where resources can be provisioned, paired with ongoing audits, since a correct initial setup can drift as new services or integrations get added.

## The common wrong answer

The typical failure is saying "we use an EU region, so we're GDPR compliant" and stopping there. That answer ignores backups, cross-region replication, third-party integrations, and logging pipelines that can silently move data outside the EU even when the primary infrastructure is correctly placed. It also conflates provider-level certifications with your own configuration responsibility, which is exactly the gap interviewers are probing for.
