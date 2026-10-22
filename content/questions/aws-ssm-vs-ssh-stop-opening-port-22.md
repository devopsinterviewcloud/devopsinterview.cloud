---
title: AWS SSM vs SSH - Stop Opening Port 22
description: Why interviewers ask SSM Session Manager vs SSH for EC2 access: no open port 22, no SSH keys, full CloudTrail audit logging.
date: 2026-10-22
keywords: aws, devops interview questions, AWS SSM vs SSH, AWS Session Manager vs SSH, close port 22 AWS, AWS Systems Manager interview questions
category: aws
youtube: hun-jGz-Pok
---

Open port 22 on an EC2 security group and you've put a front door out for attackers to find. This question shows up constantly in AWS and security-focused DevOps interviews because it tests whether you actually understand the access model you're running in production, not just whether SSH works.

## The answer interviewers want

AWS Systems Manager (SSM) Session Manager connects through the SSM agent running on the instance, which reaches out to AWS outbound. There's no inbound port 22 to open, no bastion host to maintain, and no SSH keys to issue, rotate, or lose track of.

In practice, the setup is simple: attach the SSM managed policy to the EC2 instance role, make sure the SSM agent is installed and running, then connect with:

```
aws ssm start-session --target <instance-id>
```

That's it. The part most candidates miss is the audit trail. Every session started through Session Manager is logged to CloudTrail automatically, and you can optionally stream session activity to S3 or CloudWatch Logs for a full record of what commands ran and when. SSH gives you none of that out of the box. So the short version: port 22 stays closed, there are zero keys to manage, and you get full audit logging by default. That combination is the answer that gets you the follow-up question.

## Why interviewers ask this

This question separates people who've only used SSH from people who've had to defend an access model to a security team or an auditor. It's really probing whether you think about attack surface (an open port 22 is a standing liability) and whether you understand that access without logging is a compliance gap waiting to be found during an incident review.

## Follow-ups to expect

**How do you handle access if the SSM agent isn't running or the instance loses outbound connectivity?** This is where you'd explain your fallback plan, since SSM depends entirely on the agent reaching AWS; if that path is broken, you lose the session mechanism entirely.

**Where does the session logging actually go, and who reviews it?** The answer is CloudTrail by default, with optional S3 or CloudWatch Logs delivery, and the follow-up expects you to connect that to whatever audit or compliance process your team runs.

**Does this replace SSH keys entirely across your fleet?** The strong answer is yes for EC2 instances with the managed policy and agent installed, since there's no key material to generate or rotate in this model at all.

## The common wrong answer

Most candidates say "SSM is more secure" and stop there, without naming the actual mechanism. They can't explain that the agent initiates an outbound connection instead of AWS needing an inbound port, and they forget the audit logging piece entirely, which is usually the detail interviewers are listening for.
