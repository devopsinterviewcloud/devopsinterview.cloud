---
title: DNS Resolution Failed - 5 Debug Steps
description: A systematic walkthrough for debugging DNS resolution failures in interviews: dig, resolv.conf, and port 53 checks.
date: 2026-10-22
keywords: networking, devops interview questions, dns resolution failed debug, dns troubleshooting steps devops, network debugging interview questions
category: networking
youtube: Pnj9YbrCtZ8
---

DNS resolution failures are one of those outages that look trivial until you're three layers deep and still guessing. Interviewers bring this up because it's a fast way to check whether you debug systematically or just start randomly restarting services.

## The answer interviewers want

Start with the basics and work your way up the stack instead of jumping straight to application logs.

First, check whether the DNS server itself is even responding. Use `dig` to query specific servers directly, for example `dig @8.8.8.8 example.com`, so you can tell whether the problem is the resolver you're pointed at or DNS in general.

Next, check `resolv.conf` to confirm which nameservers the host is actually configured to use. It's common to assume a client is hitting the nameserver you expect when it's actually pointed somewhere else entirely.

Then verify basic network connectivity to the DNS server with something like `telnet <server-ip> 53` to confirm you can even reach port 53. This separates "DNS is broken" from "the network path to DNS is broken," which are very different fixes.

The detail that trips people up: always check both UDP and TCP on port 53, not just one. DNS normally uses UDP for standard queries, but falls back to TCP for larger responses like zone transfers or big record sets. Some firewalls block one protocol but not the other, so a query can succeed with `dig +tcp` while plain UDP queries silently time out, or vice versa. If you only test one protocol, you can convince yourself DNS is fine when it's actually half-broken.

## Why interviewers ask this

This question isn't really about DNS trivia. It's about whether you have a repeatable debugging method: confirm the server responds, confirm the client is configured to ask the right server, confirm the network path is open, and confirm it's open for both transport protocols. Interviewers are listening for that order, not a list of commands fired off at random.

## Follow-ups to expect

**What if `dig` works from your laptop but not from the affected server?** That points away from the DNS server itself and toward something specific to that host, like its `resolv.conf` entries, local firewall rules, or the network path between that host and the nameserver.

**Why would UDP and TCP give different results for the same query?** Because some firewalls or security groups only block one protocol on port 53. A query that fits in a single UDP packet might succeed while a larger query forced over TCP gets silently dropped, so you have to test both explicitly rather than assuming one implies the other.

**How do you confirm it's a connectivity issue versus a DNS server issue?** Using `telnet` or an equivalent to port 53 tells you whether you can even reach the server; if that fails, don't waste time staring at DNS records.

## The common wrong answer

The usual mistake is jumping straight to "I'd check `/etc/hosts`" or "I'd flush the DNS cache" without first confirming the server is reachable at all. Candidates also tend to test only UDP, declare DNS healthy, and miss a TCP-specific firewall block that's the actual root cause.
