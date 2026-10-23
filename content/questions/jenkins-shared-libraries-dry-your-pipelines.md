---
title: Jenkins Shared Libraries - DRY Your Pipelines
description: How Jenkins Shared Libraries use vars/ and src/ to avoid duplicated Jenkinsfiles, and why pinning to a Git tag matters.
date: 2026-10-22
keywords: cicd, devops interview questions, jenkins shared libraries, jenkins shared library tutorial, jenkins pipeline interview questions, cicd interview questions
category: cicd
youtube: zz1QgsuhxIc
---

A team maintaining dozens of Jenkinsfiles eventually hits the same wall: every pipeline has copy-pasted stages, and a fix in one repo never makes it to the other twenty. Interviewers bring this up because it separates people who've only written a single Jenkinsfile from people who've actually maintained Jenkins at scale.

## The answer interviewers want

There are three pieces to a Jenkins Shared Library, and interviewers want you to name all three without prompting.

First, reusable steps go in `vars/`. Each file in there is a Groovy script that becomes a callable step in any Jenkinsfile, like a custom DSL function.

Second, anything more complex than a simple step, actual logic, classes, helper methods, goes in `src/` as proper Groovy classes. This is where you put code that needs structure, not just a flat script.

Third, you register the library in Jenkins' global configuration, then pull it into a pipeline with `@Library` at the top of the Jenkinsfile, for example `@Library('my-lib')`.

The part most teams skip: pin the library to a Git tag, not `main`. Write `@Library('my-lib@v1.2')` instead of leaving it floating on the default branch. If every pipeline references `main`, one bad commit to the shared library breaks every single pipeline in the company at the same time. Version pinning turns a company-wide outage into a problem scoped to whichever teams explicitly opt into the new tag.

## Why interviewers ask this

This question checks two things at once: do you understand how to structure reusable CI code, and do you think about blast radius before something breaks. A candidate who only mentions shared libraries in the abstract hasn't operated one under real load. The version-pinning detail is the tell that separates people who've been burned by this from people reciting documentation.

## Follow-ups to expect

**How do you roll out a breaking change to a shared library across many teams?** Cut a new tag, update a few low-risk pipelines to the new version first, and let other teams bump their `@Library` reference on their own schedule instead of forcing it on everyone at once.

**What's the practical difference between `vars/` and `src/`?** `vars/` holds simple callable steps meant to be used directly in a Jenkinsfile, while `src/` holds actual Groovy classes for logic that's too complex or stateful to live in a flat script.

**Where do you register a shared library so Jenkins knows about it?** In Jenkins' global configuration, where you point at the Git repo and give it a name that `@Library` calls reference.

## The common wrong answer

Most candidates get the first half right, they'll mention shared libraries and maybe even `vars/` and `src/`, and stop there. They never bring up pinning to a tag, which means in practice they'd either leave every pipeline tracking `main` or not think about it until a bad commit takes down the whole org's builds at once.
