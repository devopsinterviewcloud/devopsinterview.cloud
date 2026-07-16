---
title: 20 Terraform Interview Questions from Real Senior DevOps Interviews
description: Terraform and OpenTofu interview questions that actually get asked in 2026: state internals, locking, drift, modules, import, and the follow-ups that expose shallow answers.
date: 2026-07-16
keywords: terraform interview questions, terraform interview questions and answers, opentofu interview, iac interview questions, devops interview
---

Terraform interviews have a distinctive shape: almost every hard question is secretly a question about **state**. Providers, modules and HCL syntax are easy to learn on the job; what interviewers probe is whether you understand what Terraform believes about the world, where that belief lives, and what happens when it diverges from reality. Here are the questions that come up in real senior screens, with the answers that survive follow-ups.

## State: where every interview goes first

### 1. What is the state file, and why does Terraform need one at all?

State maps your configuration's resource addresses to real provider object IDs, and caches attributes. Without it, Terraform could not know that `aws_instance.web` *is* instance `i-0abc123`, so it could not plan updates or deletes. The follow-up is usually "couldn't Terraform just query the cloud instead?" Partially, and that is what import and refresh do, but tags and names are not reliable identity, and many resources have no queryable natural key. State is the identity layer.

### 2. Your team of six runs Terraform from laptops with local state. What goes wrong and how do you fix it?

Everything: divergent copies of the truth, overwritten changes, secrets in state sitting unencrypted on six laptops, no locking, no history. The fix is a remote backend (S3 with DynamoDB locking, or Azure Storage with blob leases, or Terraform Cloud/HCP), encryption at rest, and CI as the only place `apply` runs. Mentioning "humans get plan, only the pipeline gets apply" is the sentence that marks you senior.

### 3. What does state locking protect against, and what does it NOT protect against?

It prevents two concurrent operations from mutating the same state and corrupting it. It does not prevent logical conflicts: two workspaces or two stacks managing the same real resource will still fight each other, lock or no lock, because locking is per state file, not per cloud resource.

### 4. Someone deleted a resource in the console. What do plan and apply do now?

Terraform refreshes state, notices the object is gone, and plans to recreate it (configuration still declares it). The reverse case is the better follow-up: someone *changed* an attribute in the console. Terraform plans to revert it back to the configuration. If the console change was correct, you update the configuration to match, and this is the moment to say the word **drift** and describe running scheduled `terraform plan -detailed-exitcode` in CI to detect it before it surprises anyone.

### 5. How do you remove a resource from Terraform management without destroying it?

`terraform state rm` for the surgical version, or a `removed` block (Terraform 1.7+/OpenTofu) for the declarative, code-reviewed version. Bonus points for knowing the reverse direction too: `import` blocks (1.5+) let you adopt existing infrastructure with a plannable, reviewable diff, replacing the old imperative `terraform import` one-liner.

### 6. What is in the state file that makes it sensitive?

Every attribute of every resource, which includes database passwords, private keys and tokens that providers return. Treat state like a secrets store: encrypt it, restrict who can read the backend, and never commit it. If asked how to reduce the exposure: ephemeral resources and write-only attributes (recent Terraform/OpenTofu releases) keep certain secrets out of state entirely.

## Modules, structure and environments

### 7. How do you structure Terraform for dev, staging and prod?

There are two defensible answers and interviewers accept either if you defend it: separate root modules per environment composing shared child modules (maximum isolation, some duplication), or one root module with per-environment tfvars and separate state (less duplication, riskier blast radius). Workspaces alone as the environment mechanism is the answer that gets challenged: workspaces share the same backend and code path, which makes prod isolation weak.

### 8. What makes a good module, and what is over-modularisation?

A good module wraps a real architectural decision (your org's notion of "a service", "a VPC") with a small, opinionated variable surface. Over-modularisation is wrapping single resources in modules that add nothing but indirection, forcing every change through two files and a version bump. If you have inherited a repo with 40 one-resource modules, say so; the scar tissue is convincing.

### 9. How do you share values between two Terraform stacks?

`terraform_remote_state` data source reads another stack's outputs (tight coupling, read access to their entire state), or the publishing stack writes to SSM Parameter Store/Secrets Manager and consumers read via data sources (looser coupling, better access control). Naming the trade-off is the point of the question.

### 10. count vs for_each: when does count hurt you?

count identifies instances by index, so removing one element from the middle renumbers everything after it, and Terraform plans to destroy and recreate resources that did not logically change. for_each identifies by key, so removals are surgical. Rule of thumb worth saying out loud: count for "N identical things", for_each for "these named things".

## Execution, CI/CD and day-2 operations

### 11. Walk me through what terraform plan actually does.

Reads configuration, refreshes state against real provider APIs, builds a dependency graph, and computes the diff between desired and actual, producing a plan file. Two details that impress: the plan can be saved and applied verbatim later (`plan -out` then `apply plan.tfpl`), which is how CI guarantees what was reviewed is what runs; and refresh is why plan needs credentials even when nothing changed.

### 12. How should Terraform run in CI/CD?

Plan on pull request with the plan output posted for review; apply only on merge, from a locked-down runner with short-lived cloud credentials (OIDC federation, not static keys); state in a remote backend the runner alone can write. Add policy checks (OPA, Sentinel, or checkov/tfsec) between plan and apply. If you mention posting the plan as a PR comment so reviewers see the blast radius, you are describing a real pipeline, and it shows.

### 13. What does -target do and why is it dangerous as a habit?

It narrows the operation to selected resources and their dependencies. As a one-off escape hatch during an incident it is fine; as a habit it produces partial applies, so state stops reflecting the full configuration and the next full plan becomes a minefield of surprise changes.

### 14. A plan shows a destroy/recreate on a production database. What are your options?

First, understand why: some attribute changes force replacement. Then, in preference order: avoid the change if it is cosmetic; check whether the provider supports in-place update via a different attribute; use `lifecycle { prevent_destroy = true }` as the safety net that fails the plan; and for renames or refactors, `moved` blocks tell Terraform the resource is the same object at a new address so no replacement happens at all. Knowing `moved` blocks is the difference between a rename and an outage.

### 15. How do you upgrade a provider major version safely?

Pin versions explicitly, read the upgrade guide's breaking changes, upgrade in a non-prod stack first, run plan and inspect for unexpected diffs, then roll forward stack by stack. The keyword the interviewer is waiting for is the lock file (`.terraform.lock.hcl`), committed, so every machine and runner resolves identical provider builds.

## The 2026 questions

### 16. Terraform vs OpenTofu: what actually changed and what would you pick?

Terraform moved to the BUSL licence in 2023; OpenTofu is the Linux Foundation fork that stayed MPL open source and now ships its own features (state encryption arrived there first). For most internal use the licence change has no practical effect, and the tools remain drop-in compatible for mainstream workflows. A grown-up answer names the real decision inputs: legal comfort with BUSL, appetite for community vs vendor governance, and which ecosystem your platform tooling targets.

### 17. Terraform vs Ansible: why both?

Different jobs: Terraform declares infrastructure with a lifecycle (create, update, destroy, tracked in state); Ansible executes procedural configuration on existing machines without a state model. The classic pairing is Terraform to create the instances and Ansible (or cloud-init, or baked images) to configure them. Saying "we replaced Ansible with immutable images and user data" is also a fine answer if you can defend it.

### 18. How do you test Terraform?

Layered: fmt and validate as table stakes; static analysis (tflint, checkov) for policy; `terraform test` (native since 1.6) for module contract tests; and ephemeral-environment integration tests for the expensive truths. Honest seniors also say: most real confidence comes from small blast radii and reviewable plans, not test suites.

### 19. What are data sources and when do they beat hardcoding?

Data sources query existing infrastructure at plan time: the current AMI, the VPC built by another team, an IP range. They beat hardcoding whenever the value has an authoritative source that can change; they lose when they create hidden cross-team coupling that a pinned, versioned input would make explicit.

### 20. Describe a Terraform incident you caused or inherited.

Every senior has one: the state file someone deleted, the -target habit that hid a landmine, the for_each refactor that planned 200 replacements, the provider upgrade that changed defaults. Interviewers ask because the answer cannot be memorised. Prepare yours as a story: context, mistake, blast radius, fix, and the guardrail you added afterwards.

## Preparing properly

If these questions felt comfortable, you are interview-ready on Terraform basics and then some. If several answers surprised you, the gap is usually state internals and day-2 operations, which is exactly where interviews concentrate. [Infrastructure as Code Mastery: Terraform & OpenTofu](/ebooks/infrastructure-automation-mastery) works through all of this with 50+ interview questions, worked answers and the production reasoning behind them, and it ships as part of the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle) alongside books on Kubernetes, cloud platforms, CI/CD and SRE.
