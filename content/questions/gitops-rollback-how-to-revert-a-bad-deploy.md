---
title: GitOps Rollback - How to Revert a Bad Deploy
description: How to roll back a bad GitOps deployment using git revert and ArgoCD sync, plus what interviewers listen for in the answer.
date: 2026-10-22
keywords: gitops, devops interview questions, gitops rollback, gitops rollback strategies, kubernetes rollback interview, devops rollback interview questions
category: gitops
---

A deploy just broke prod and the pager is going off. GitOps changes the usual rollback story, because you're not SSHing anywhere or manually reapplying old manifests. Interviewers ask this to see if you actually understand the GitOps model or if you just know the buzzword.

## The answer interviewers want

You don't roll back by touching the cluster directly. You roll back by fixing the source of truth, which is the git repo, and letting the GitOps controller do the rest.

The move is: `git revert <commit>` on the bad change, then `git push` to `main`. GitOps is built to watch that branch for drift between desired state and actual state. The moment it sees the revert land, it reconciles and syncs the cluster back to the last known-good state automatically. With ArgoCD specifically, that sync typically happens within seconds of the push, no manual intervention needed.

A practical habit that makes this faster under pressure: tag your releases. When prod is on fire and you need to find the last good commit, scrolling through commit history is slow and error-prone. A tag gives you an instant, unambiguous pointer to "this was working," so the revert target is obvious instead of guessed at.

## Why interviewers ask this

They're checking whether you treat git as the actual source of truth or whether you'd instinctively reach for `kubectl edit` or a manual patch under pressure, which defeats the whole point of GitOps and creates drift. They also want to see if you can stay calm and procedural during an incident instead of improvising. The tagging detail is a small signal of whether you've actually operated a GitOps pipeline versus just read about it.

## Follow-ups to expect

**What if the revert itself doesn't fix things, because the bad state was partly manual?** That's a sign something broke the GitOps contract, since the cluster state should only ever come from git. The fix is to find and remove whatever caused the drift, then let a fresh sync reconcile things again.

**How do you know the sync actually happened?** Check ArgoCD's application status for sync and health state, and confirm the live manifests match the reverted commit rather than assuming the push alone fixed anything.

**Why tag releases instead of just reading commit messages?** Commit messages get inconsistent under time pressure or across contributors, but a tag is a deliberate, stable marker of a verified good state, so it's faster and more reliable to roll back to during an actual incident.

## The common wrong answer

The common mistake is describing rollback as a cluster-side operation: rolling back a Kubernetes Deployment directly, re-running a Helm install, or patching objects by hand. That might technically fix the symptom, but it breaks the core GitOps principle that the cluster state must always match git. Next sync cycle, the automation can undo your manual fix and reintroduce the bad deploy, which is a worse incident than the one you started with.
