---
title: Loki vs Elasticsearch - Cheaper Log Storage
description: Why Elasticsearch log bills explode and how Loki's label-based indexing cuts cost. A common DevOps and SRE interview question.
date: 2026-10-22
keywords: observability, devops interview questions, loki vs elasticsearch, cheaper log storage kubernetes, loki logging interview questions, elasticsearch cost optimization
category: observability
youtube: UfDgHZ1MIUs
---

Your Elasticsearch cluster is on fire financially and nobody can explain why. This question shows up constantly in SRE and platform interviews because it's not really about Loki or Elasticsearch, it's about whether you understand what indexing costs you at scale.

## The answer interviewers want

The Elasticsearch bill gets insane because Elasticsearch does full-text indexing on every single log line. Every word in every log becomes searchable, which means every word gets written into an index. That indexing overhead, not the raw log volume, is what explodes your storage and your compute costs.

Loki takes the opposite approach. Instead of indexing the content of your logs, it only indexes a small set of labels, things like `job` or `namespace`. The actual log content gets compressed into chunks and dumped into cheap object storage like S3. You're not paying to index raw text anymore, you're paying for cold storage plus a tiny label index.

In a typical production setup, you ship logs with Promtail or Alloy, those chunks land in S3, and you query with LogQL instead of running full-text search against raw strings. LogQL first filters by label, then greps through the matching chunks, which is why keeping the label index small matters so much.

Here's the part that trips people up: if you label by something high-cardinality, like user ID or request ID, Loki's index explodes exactly the same way Elasticsearch's did. The fix only works if you keep labels low cardinality. So the real lesson is that the original Elasticsearch bill was never about log volume. It was about indexing every word of every line. Loki didn't make logging free, it just moved where the indexing cost lives.

## Why interviewers ask this

They want to know if you understand indexing tradeoffs rather than just reciting "Loki is cheaper than Elasticsearch." Anyone can name-drop a tool migration. Fewer candidates can explain the underlying mechanism: what gets indexed, what gets stored cold, and why that distinction drives cost. This also tests whether you've actually operated a logging pipeline versus read a blog post about one.

## Follow-ups to expect

**What happens if you add a high-cardinality label to Loki?** The label index grows the same way Elasticsearch's full-text index did, and you lose the cost advantage you migrated for.

**How does a LogQL query actually work under the hood?** It filters by label first to narrow down which chunks to read, then searches the content of those chunks, rather than searching all log text directly like Elasticsearch does.

**What's the operational pipeline look like in production?** Promtail or Alloy ship logs, compressed chunks land in object storage like S3, and the label index stays small and queryable.

## The common wrong answer

Candidates usually say "Loki is cheaper because it uses object storage instead of a search cluster" and stop there. That's true but incomplete, and it misses the actual mechanism. It also leads people to assume Loki is cost-safe by default, when in reality a careless high-cardinality label can recreate the exact same indexing bill they were trying to escape.
