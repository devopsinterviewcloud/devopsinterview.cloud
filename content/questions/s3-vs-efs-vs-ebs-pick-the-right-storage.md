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

`EBS` is a hard drive. It attaches to one EC2 instance at a time (io1/io2 Multi-Attach is a niche exception) and gives you low latency, block-level storage. If your workload needs a single machine to read and write fast, like a database's data directory, this is the default choice.

`EFS` is a shared network drive. Multiple instances can mount it and read/write simultaneously, and it behaves like a real POSIX file system. Pick it when your app actually expects file system semantics, for example containers that need to share config files across replicas.

`S3` is object storage, not a file system. It's key-value at massive scale: you put an object in with a key, you get it back with that key. A general purpose bucket has no real directories or file locks, even though the console fakes a folder view. Directory buckets and the 2026 S3 Files feature change that, but you opt into those.

The detail a lot of candidates still get wrong: S3 has been strongly consistent since December 2020. Once a PUT, overwrite or DELETE returns success, the next GET or LIST sees it. Old blog posts still warn about eventual consistency, so it's worth saying out loud. What still needs care is two writers racing on the same key, and replication to another region, which is asynchronous.

And the trap to avoid out loud: S3 is not a database replacement. It's a staging and storage layer for objects, logs, backups, and static assets, not a transactional data store.

## Why interviewers ask this

They're checking whether you reason from workload shape to tool, rather than reciting a feature list you memorized. Anyone can say "S3 is cheap object storage." Fewer people can say why a shared config volume needs EFS specifically, or why a database's data files belong on EBS, not S3. This also screens for people who've actually hit consistency surprises in production versus people who've only read the docs.

## Follow-ups to expect

**"What happens if you try to run a database directly on S3?"** You lose transactional guarantees and consistent low-latency reads, which is exactly why S3 isn't a database substitute.

**"Why would a container platform need EFS instead of EBS?"** Because EBS only attaches to one instance, and containers scaling across multiple nodes need a volume all of them can mount and write to at once.

**"How does S3's consistency behavior affect a CI/CD pipeline?"** It doesn't, for the common case. Since S3 became strongly consistent, a deploy step can read an artifact as soon as the upload step gets a success response. What you still handle is two jobs writing the same key at once, and replication lag if you copy artifacts to another region.

## The common wrong answer

Most candidates answer with a price-and-durability comparison: S3 is cheap, EBS is fast, EFS is shared. That's a feature list, not a mental model, and it falls apart the moment the interviewer asks a follow-up about a specific workload. It also tends to miss the S3-as-database trap entirely, which is usually the point being tested.
