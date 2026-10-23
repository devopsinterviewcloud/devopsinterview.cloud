---
title: Azure DevOps Pipelines - YAML Templates
description: How to avoid copy-pasted YAML across Azure DevOps pipelines using reusable templates, parameters, and extends - and where template expressions break.
date: 2026-10-22
keywords: azure, devops interview questions, azure devops yaml templates, azure devops pipeline templates interview, yaml template azure devops tutorial, azure devops interview questions
category: azure
youtube: Q7A8gIsxm1g
---

A team I know ran forty pipelines that were all 90% identical YAML, copy-pasted and drifting out of sync. This question shows up constantly because it separates engineers who've only ever clicked through the pipeline UI from ones who've actually maintained a fleet of pipelines at scale.

## The answer interviewers want

YAML templates are reusable pipeline components, basically the equivalent of functions for your CI/CD. Instead of repeating the same stages, jobs, or steps in every pipeline file, you pull the shared logic out into a separate template file.

The pattern is: create a template file, define `parameters` in it for the things that change between pipelines (image name, environment, variable values, whatever varies), then reference that template from your main pipeline YAML using `extends` (or `template:` for steps/jobs/stages). The main pipeline becomes a thin wrapper that passes in parameter values, and the actual logic lives in one place.

The part that catches people off guard: template expressions (the `${{ }}` syntax) only work in specific sections of the YAML, not everywhere. You can't just sprinkle them anywhere you want conditional logic or parameter substitution. They're evaluated at compile time, before the pipeline runs, so they're limited to places where that makes structural sense - not runtime variables, not every arbitrary field. Knowing that distinction is what separates someone who's read the docs from someone who's actually hit the error message.

## Why interviewers ask this

They want to know if you've actually maintained pipelines past the point where copy-paste works, which is usually somewhere around pipeline number five. It also tests whether you understand compile-time versus runtime behavior in the pipeline, which is a common source of confusing failures. And it's a cheap way to filter out candidates who've only built one-off pipelines versus people who've had to scale them across a team or org.

## Follow-ups to expect

**How do you share templates across multiple repositories, not just within one?** You'd typically reference a template from another repo in your source control setup, so the shared logic lives in a central repo and consuming pipelines pull it in rather than duplicating it locally.

**What goes wrong when teams over-template everything?** Templates with too many parameters turn into their own maintenance burden, where every change requires touching the template, the parameter list, and every caller - you lose readability in exchange for reuse.

**How would you debug a template expression that isn't evaluating the way you expect?** Check whether it's in a section where compile-time expressions are actually supported, since that's the most common cause of a template silently not doing what you expect.

## The common wrong answer

Most candidates say "just use variable groups" or "use a variables file" and stop there, which solves sharing values but not sharing structure. The gap is not realizing that templates let you reuse entire stages, jobs, and step sequences, not just variable values, and missing the compile-time versus runtime distinction that explains why expressions don't work everywhere in the file.
