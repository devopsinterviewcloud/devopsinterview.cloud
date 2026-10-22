---
title: Why Your API Works in Postman But Breaks in the Browser
description: Postman succeeds but the browser's fetch call fails with the same API. Here's the CORS explanation interviewers expect, in plain terms.
date: 2026-10-22
keywords: networking, devops interview questions, api works in postman but not browser, cors error explained, postman vs browser api, cors preflight request
category: networking
youtube: _5RsbxbLOS4
---

A candidate says the API works fine in Postman, so the backend must be fine, and the browser must be broken somehow. That's the wrong instinct, and interviewers bring this up specifically because it separates people who understand CORS from people who've only ever fixed it by pasting a Stack Overflow header into their server config.

## The answer interviewers want

Postman and the browser are not equivalent clients. Postman isn't a browser, so it skips CORS entirely. It sends no `Origin` header and runs no preflight check. Browsers are the ones enforcing that policy, which is why a `fetch()` call from your frontend just dies with a CORS error while the exact same request succeeds in Postman.

The fix lives on the server, not the client. You need to:

- Return proper `Access-Control-Allow-Origin` headers
- Handle the `OPTIONS` preflight request correctly
- Whitelist your actual frontend domain instead of guessing

There's a trap most people don't know about until it bites them: setting a wildcard origin (`*`) together with `credentials: true` fails silently. Browsers reject that combination outright, no matter how correct the rest of your headers look. So the API wasn't broken, and Postman wasn't lying to you. The browser was simply enforcing rules that Postman never checks in the first place.

## Why interviewers ask this

This question checks whether a candidate understands that CORS is a browser-enforced security boundary, not a server bug. It also surfaces whether they know the difference between a request that fails to send (network error) and one that sends fine but gets its response blocked by the browser, which is exactly what happens with CORS failures. Someone who jumps straight to blaming the backend hasn't internalized where the enforcement actually happens.

## Follow-ups to expect

**Why does the preflight OPTIONS request happen at all?** The browser sends it ahead of the real request to ask the server which origins, methods, and headers are allowed, and only proceeds if the server responds correctly.

**What happens if you set `Access-Control-Allow-Origin: *` with credentials enabled?** It fails silently. Browsers explicitly reject wildcard origins paired with `credentials: true`, so you have to whitelist the specific frontend domain instead.

**Why does the request succeed in Postman but not in the browser?** Postman doesn't implement CORS at all. No `Origin` header, no preflight, no enforcement, so it can't reproduce a CORS failure even if one exists.

## The common wrong answer

Most candidates treat this as a backend logic bug and start describing things like checking database connections, server logs, or route handlers. That misses the point entirely. The backend code may be completely correct; the failure is about missing or misconfigured CORS headers, and about a browser security mechanism that tools like Postman simply don't exercise.
