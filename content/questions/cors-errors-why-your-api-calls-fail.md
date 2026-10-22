---
title: CORS Errors - Why Your API Calls Fail
description: CORS errors explained for DevOps interviews: why browsers block cross-origin API calls, how to fix headers, and how to debug preflight requests.
date: 2026-10-22
keywords: networking, devops interview questions, cors errors explained, cors api calls failing, cors interview questions, api cors error fix
category: networking
youtube: BvklDZxFqF4
---

An API that works fine in Postman but fails in the browser is one of the most common "it worked on my machine" moments in web development. Interviewers bring up CORS because it sits at the intersection of browser security and backend configuration, and a lot of engineers can recite the acronym without actually knowing how to fix it.

## The answer interviewers want

CORS (Cross-Origin Resource Sharing) exists to prevent malicious sites from stealing data through requests made on a user's behalf. The browser enforces this, not the server and not Postman, which is why the request succeeds outside the browser but gets blocked inside it. The browser blocks cross-origin requests unless the server explicitly allows them.

The fix lives on the backend: you add response headers that tell the browser which origins, methods, and headers are permitted. The key ones are `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`. Without these, the browser refuses to hand the response back to your JavaScript code even if the server processed the request fine.

For anything beyond a simple GET, the browser sends a preflight request first. This is an `OPTIONS` call the browser fires automatically before the real request, asking the server "are you going to allow this?" If the server doesn't respond to that `OPTIONS` call with the right headers, the actual request never goes out.

To debug it, open browser dev tools and check the Network tab. Look for the `OPTIONS` request, check its response headers, and compare them against what the browser is asking for. That's usually enough to spot whether the `Allow-Origin`, `Allow-Methods`, or `Allow-Headers` values are missing or don't match what the frontend is sending.

## Why interviewers ask this

This question checks whether you understand that CORS is a browser-enforced security boundary, not a server bug. Interviewers want to see if you can separate "the server is broken" from "the server isn't telling the browser what it's allowed to do," and whether you have an actual debugging workflow instead of just pasting a wildcard header and hoping.

## Follow-ups to expect

- **What's the difference between a simple request and one that triggers a preflight?** Simple requests (basic GET/POST with standard headers) skip preflight; anything with custom headers, non-standard methods, or certain content types triggers the browser to send an `OPTIONS` check first.
- **Why does it work in Postman but not the browser?** Postman isn't a browser and doesn't enforce the same-origin policy, so it ignores CORS headers entirely and just sends the request.
- **How would you debug a failing preflight in production?** Open the Network tab, find the `OPTIONS` call, and check whether the response headers actually match the origin, method, and headers the real request is trying to use.

## The common wrong answer

Candidates often say "just add `Access-Control-Allow-Origin: *` and it'll work," treating CORS as an annoying error to silence rather than a security control to configure correctly. That answer misses the preflight mechanism entirely and signals that the candidate has copy-pasted a fix before without understanding why it was needed.
