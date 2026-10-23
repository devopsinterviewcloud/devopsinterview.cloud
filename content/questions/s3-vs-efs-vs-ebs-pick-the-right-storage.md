---
title: S3 vs EFS vs EBS - Pick the Right Storage
description: When to pick S3, EBS, or EFS in a DevOps interview: the mental model interviewers want, not a feature checklist.
date: 2026-10-22
keywords: aws, devops interview questions, s3 vs ebs vs efs, aws storage interview questions, aws interview questions 2026, s3 vs efs vs ebs explained
category: aws
youtube: lUpgLryeDqA
---

A classic interview trap: someone mentions using S3 like a database, and the interviewer quietly writes that down. This question isn't really about memorizing AWS storage specs. It's about whether you have a working mental model for picking storage, because that same reasoning shows up in system design, cost reviews, and incident postmortems.

## The answer interviewers want

Think of it as three different tools with three different shapes.

`EBS` is a hard drive. It attaches to one EC2 instance at a time and gives you low latency, block-level storage. If your workload needs a single machine to read and write fast, like a database's data directory, this is the default choice.

`EFS` is a shared network drive. Multiple instances can mount it and read/write simultaneously, and it behaves like a real POSIX file system. Pick it when your app actually expects file system semantics, for example containers that need to share config files across replicas.

`S3` is object storage, not a file system. It's key-value at massive scale: you put an object in with a key, you get it back with that key. There's no concept of directories or file locks underneath, even though the console fakes a folder view.

The detail most candidates miss: S3 has eventual consistency implications for rapid read-after-write. If you write an object and immediately try to read it back in a tight loop, you can't always assume the read reflects the write right away. That matters for pipelines that write artifacts and then immediately try to consume them.

And the trap to avoid out loud: S3 is not a database replacement. It's a staging and storage layer for objects, logs, backups, and static assets, not a transactional data store.

## Why interviewers ask this

They're checking whether you reason from workload shape to tool, rather than reciting a feature list you memorized. Anyone can say "S3 is cheap object storage." Fewer people can say why a shared config volume needs EFS specifically, or why a database's data files belong on EBS, not S3. This also screens for people who've actually hit consistency surprises in production versus people who've only read the docs.

## Follow-ups to expect

**"What happens if you try to run a database directly on S3?"** You lose transactional guarantees and consistent low-latency reads, which is exactly why S3 isn't a database substitute.

**"Why would a container platform need EFS instead of EBS?"** Because EBS only attaches to one instance, and containers scaling across multiple nodes need a volume all of them can mount and write to at once.

**"How does S3's consistency behavior affect a CI/CD pipeline?"** A build step that uploads an artifact and a deploy step that reads it immediately could hit a window where the read doesn't yet reflect the write, so pipelines need to account for that rather than assume instant visibility.

## The common wrong answer

Most candidates answer with a price-and-durability comparison: S3 is cheap, EBS is fast, EFS is shared. That's a feature list, not a mental model, and it falls apart the moment the interviewer asks a follow-up about a specific workload. It also tends to miss the S3-as-database trap entirely, which is usually the point being tested.
