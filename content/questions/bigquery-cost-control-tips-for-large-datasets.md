---
title: BigQuery - Cost Control Tips for Large Datasets
description: How to control BigQuery costs on large datasets: partitioning, clustering, avoiding SELECT * and bytes-scanned billing explained.
date: 2026-10-22
keywords: gcp, devops interview questions, bigquery cost control, bigquery cost optimization interview questions, reduce bigquery costs large datasets, gcp interview questions
category: gcp
youtube: yhjJAguZOCk
---

A BigQuery bill that spikes out of nowhere on a billion-row table is one of the most common cost-control questions in GCP interviews. It tests whether you actually understand how BigQuery charges for queries, not just whether you can write SQL.

## The answer interviewers want

The first thing to correct is a common misconception. On on-demand pricing, the default, BigQuery doesn't bill by compute time. It bills by bytes processed per query, and cached results are free. Capacity pricing bills slot time, but scanning less saves slots too. Either way, bytes scanned shapes how you design tables and write queries.

If you're running `SELECT *` against a billion-row table, you're scanning every byte in every column whether you need it or not. That's the single biggest cost driver most engineers overlook. The fix starts with never selecting all columns. Only select the columns the query actually needs.

Beyond query hygiene, table design matters just as much:

- **Partition by date.** This lets BigQuery prune entire partitions before scanning, cutting the amount of data read instantly when queries filter on date ranges.
- **Cluster by your filter column.** Clustering sorts data within partitions so filtered queries skip irrelevant blocks too.
- **Use materialized views for expensive aggregations.** They store precomputed aggregation results, so repeat queries read the small view instead of re-scanning the full dataset each time. You still pay for the view's refreshes and storage.

Put together: partitioning and clustering reduce bytes scanned per query, and materialized views reduce how often you re-scan at all. The underlying principle interviewers want you to state plainly is that under on-demand pricing, it's not compute time wrecking the bill, it's full table scans from unfiltered, unpruned, over-selected queries.

## Why interviewers ask this

This question separates engineers who've only used BigQuery casually from ones who've had to own a cost center. Anyone can write a query that returns correct results; fewer people can explain why that query costs ten times more than it needs to. It also checks whether you think about data layout and access patterns up front, rather than reacting to a bill after the fact.

## Follow-ups to expect

**How do you find out which queries are costing the most?** You'd look at bytes scanned per query under on-demand pricing, or slot time under capacity pricing, and identify the heaviest offenders rather than guessing from runtime.

**What if a query genuinely needs most columns?** You still avoid `SELECT *` as a default habit, and lean harder on partition pruning and clustering so the volume of rows scanned stays small even if most columns are included.

**When do materialized views stop helping?** They help when queries can be answered from the precomputed data, and BigQuery can even rewrite compatible queries on the base table to use the view. If each query needs columns, joins, or groupings the view doesn't have, you're back to optimizing the scan itself.

## The common wrong answer

Candidates who haven't been burned by a BigQuery bill tend to answer this like a performance question, talking about indexes, compute scaling, or query tuning for speed. That misses the core mechanic entirely: on-demand BigQuery bills bytes scanned, not runtime or compute cycles, and a slow-but-narrow query can be far cheaper than a fast `SELECT *` over a huge table.
