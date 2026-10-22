---
title: AWS VPC Design - Subnets NAT and Security Groups
description: How to design a secure AWS VPC with public/private subnets and NAT gateways, and what interviewers listen for in your answer.
date: 2026-10-22
keywords: aws, devops interview questions, aws vpc design, aws vpc interview questions, aws subnets nat gateway security groups, devops interview questions aws
category: aws
---

A private-subnet workload that can't reach the internet is one of the most common AWS debugging scenarios, and it maps directly onto one of the most common AWS design questions: how do you lay out a VPC with public and private subnets and wire up NAT correctly. Interviewers use it because it's a compact way to check whether you actually understand network paths, not just terminology.

## The answer interviewers want

Think of a VPC like an office building. Public subnets face the street: they have a route to an internet gateway and get direct internet access. Private subnets are the internal offices. They don't talk to the internet directly; they need a NAT gateway to act as their proxy for outbound traffic.

In a production design:

- Put NAT gateways in the **public** subnets, not the private ones.
- Deploy **one NAT gateway per availability zone**. This gives you high availability, if one AZ has an issue, the other AZs still have their own working NAT path instead of all traffic funneling through a single NAT gateway in one zone.
- Route outbound traffic from each private subnet's route table to the NAT gateway in its own AZ (`0.0.0.0/0` -> nat-gateway-id).

The part candidates often don't mention: NAT gateways aren't free infrastructure glue, they cost money per hour, plus data transfer charges on top of that. For dev and test environments where cost matters more than uptime, you can use a NAT instance (a regular EC2 instance configured to do NAT) instead of a managed NAT gateway, to save money. But that tradeoff only belongs in dev. Never run a NAT instance in production, you lose the managed high availability and scaling that the NAT gateway service gives you.

## Why interviewers ask this

This question screens for whether you understand actual packet flow in a VPC, not just that "public subnets have internet and private ones don't." It also checks whether you think about availability and cost as design inputs, not afterthoughts, which is exactly the judgment call a senior engineer is expected to make when sizing infrastructure for a real account.

## Follow-ups to expect

- **What happens if you only deploy one NAT gateway for the whole VPC?** You save cost, but if that NAT gateway's AZ has a problem, every private subnet in every other AZ loses outbound internet access too, since they'd all be routing through it.
- **Why not just use a NAT gateway in dev as well?** You could, but NAT gateways bill per hour plus data transfer, so for non-production environments a NAT instance is a cheaper option when high availability isn't a priority.
- **Where does the NAT gateway itself live, public or private subnet?** It must sit in a public subnet, because it needs its own route to the internet gateway to forward traffic on behalf of the private subnets.

## The common wrong answer

The typical miss is describing public versus private subnets correctly but then placing the NAT gateway in the private subnet, or forgetting the one-per-AZ pattern entirely and treating a single NAT gateway as sufficient for the whole VPC. That answer sounds reasonable until the interviewer asks what happens during an AZ outage, and the single point of failure becomes obvious.
