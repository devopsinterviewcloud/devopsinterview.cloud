---
title: Terraform Mono-Repo Design for 20 AWS Accounts
description: One Terraform repo for twenty AWS accounts: directory-per-account state, role assumption, changed-path CI, pinned modules, drift checks and bootstrapping.
date: 2026-09-10
keywords: terraform mono-repo, terraform multiple aws accounts, terraform workspaces vs directories, terraform state isolation, terraform drift detection, terraform interview questions
source_video_id: UkupNeFXGAo
---

"Your platform team manages twenty AWS accounts: dev, staging, prod and a handful of product-team sandboxes. All of the infrastructure is Terraform. Structure a single repository so that one engineer can safely deploy to one account without touching another. Walk me through the design." The prompt is deliberately open-ended. A strong answer is not about knowing a CLI flag; it shows how you reason about isolation, blast radius and team safety at a scale where a copy-paste mistake reaches production. There is also a tempting first answer, "use workspaces, one per account", and the follow-up questions probe whether you know where that holds and where it breaks: for deployments that need separate credentials and access controls, CLI workspaces alone are unsuitable.

The video version walks the same design if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/UkupNeFXGAo" title="Terraform Mono-Repo for 20 AWS Accounts" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## Why "one folder, twenty workspaces" fails

Be precise about what workspaces share, because the imprecise version ("they share state") is common and wrong. Each CLI workspace does get its own state file. With the S3 backend the default workspace is stored at the configured `key`, and every other workspace is stored in the same bucket under the `env:/` prefix, followed by the workspace name and then the key. A corrupted `sandbox` state does not corrupt `prod`.

What every workspace shares is everything around the state: the same backend configuration and bucket, the same provider blocks, the same variable declarations, and whatever credentials that shared configuration resolves to. You can vary values with `terraform.workspace` conditionals, but those conditionals live in the same root module, so a mistake in the shared parts reaches every environment. HashiCorp's own documentation says it plainly: workspaces within a working directory use the same backend, so they are not a suitable isolation mechanism when deployments need separate credentials and access controls. Add the fact that `terraform workspace select` is mutable state in the operator's shell, easy to forget in a second terminal during an incident, and you have the real problem.

The design therefore has to deliver three things:

1. **State isolation per account.** A locked, corrupted or mid-migration state in account A must not block or affect account B.
2. **Independent authentication per account.** Each account's Terraform runs with credentials scoped to that account, obtained by role assumption rather than long-lived keys.
3. **CI that scopes itself.** A pull request that touches one account plans and applies against that account, not all twenty.

## Repo layout: one root module per account

```
infra-repo/
├── modules/
│   ├── vpc/
│   ├── eks/
│   └── iam-baseline/
├── accounts/
│   ├── prod-111111111111/
│   │   ├── backend.tf
│   │   ├── providers.tf
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging-222222222222/
│   └── sandbox-eng-333333333333/
└── .github/workflows/terraform.yml
```

Two top-level directories carry the design. `modules/` holds reusable child modules: the VPC, the EKS cluster, the IAM baseline every account receives. They declare resources, variables, outputs and their `required_providers`, but they contain no `backend` block and no `provider` configuration blocks; the calling root module supplies those. `accounts/` holds one subdirectory per AWS account, named with a human-readable label plus the account ID so nobody has to remember which twelve-digit number is prod. Each account directory is a complete, independent Terraform root module with its own backend, its own provider configuration, its own tfvars and its own calls into the shared modules.

One detail to say out loud, because a common variant of this layout gets it wrong: there is no shared `globals/variables.tf`. Terraform only loads the `.tf` files in the root module's own directory, so a variable declared in a sibling directory is never read. Values that genuinely apply to every account belong in a small module that returns them as outputs, or in a common tfvars file that each pipeline passes with `-var-file`.

## Backend and provider per account

```hcl
# accounts/prod-111111111111/backend.tf
terraform {
  required_version = ">= 1.10, < 2.0"   # S3 native locking arrived in 1.10

  backend "s3" {
    bucket       = "tfstate-prod-111111111111"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
    # assume_role is supplied at init time from one of the two files below
  }
}

# accounts/prod-111111111111/backend.plan.hcl   (read state, hold the lock)
assume_role = { role_arn = "arn:aws:iam::111111111111:role/TerraformPlanRole" }

# accounts/prod-111111111111/backend.apply.hcl  (read and write state)
assume_role = { role_arn = "arn:aws:iam::111111111111:role/TerraformDeployRole" }

# accounts/prod-111111111111/providers.tf
variable "terraform_role_name" {
  type        = string
  description = "TerraformPlanRole for pull-request plans, TerraformDeployRole for applies from main"
}

provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = ["111111111111"]

  assume_role {
    role_arn     = "arn:aws:iam::111111111111:role/${var.terraform_role_name}"
    session_name = "terraform"
  }
}
```

The credential model is one chain with two rungs, and pull-request plans and applies from `main` use different roles at every rung. In CI, the workflow authenticates via OpenID Connect to one of two roles in a central tooling account: `GitHubActionsPlan` for pull-request runs and `GitHubActionsApply` for applies from `main`. Both trust policies restrict the token to this repository, and the apply role's additionally to the protected environment or branch its job runs under. Each account then carries a matching pair. `TerraformPlanRole` trusts the central plan role and has read-only infrastructure access plus read and lock access to state; `TerraformDeployRole` trusts only the central apply role and can change infrastructure and write state. The backend and the provider each assume the account role for the run, because the backend inherits nothing from the provider: without its own `assume_role` (an object attribute in the backend, unlike the nested block in the provider, and supplied here through a `-backend-config` file because backend blocks cannot read variables), `terraform init` would try to read the state bucket with the caller's ambient credentials, which have no rights in the target account. Humans do not get a third path. Applies are CI-only, and an engineer who needs a local plan uses an IAM Identity Center permission set that each `TerraformPlanRole` trust policy lists alongside the central plan role, so a laptop can plan but never apply.

The split exists because `terraform init` and `terraform plan` execute whatever HCL the pull request contains, including the providers it downloads, so pull-request code inherits the plan job's credentials. Those credentials must be unable to change infrastructure or overwrite state. What a plan still needs, and therefore what pull-request code can do, is read state and hold the lock; if the repository accepts pull requests from people who must not read state, gate the plan job behind an approval as well. Four more points here are interview material.

- **The state lives inside the account it describes.** The prod bucket is owned by the prod account, so IAM policies in the prod account, together with the bucket policy, decide who can read or write the prod state. Nothing outside the account is granted S3 access directly; the central roles only get `sts:AssumeRole` into each account.
- **Locking no longer needs DynamoDB.** `use_lockfile = true` uses S3 conditional writes to hold a `.tflock` object next to the state. Terraform 1.10 introduced it and 1.11 made it generally available; DynamoDB-based locking via `dynamodb_table` is deprecated. The S3 permissions are small: `s3:ListBucket` on the bucket, `s3:GetObject` and `s3:PutObject` on the state object, and `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject` on the `.tflock` object. Terraform never deletes the state file, so the plan role gets that whole set minus `s3:PutObject` on the state object. If you mention DynamoDB locking in an interview, present it as the previous approach.
- **`allowed_account_ids` is the wrong-account guard.** The provider refuses to run if the credentials resolve to any other account. It costs one line and catches the pasted-from-staging role ARN before a plan runs.
- **Be honest about what a directory is.** The directory is the configuration and state boundary: it makes the target explicit and removes the hidden workspace-selection step. It is not a security boundary. A pull request can contain any HCL its author likes, including a provider block that names another account's role, so the ceiling on what a run can do is set by IAM: which roles the central identity is trusted to assume, and what those roles are allowed to do.

## CI: plan and apply only the accounts a PR touched

Running plans against all twenty accounts on every pull request is slow and noisy, and a plan failure in an account the PR never touched is a false red build. Changed-path detection fixes that. A naive version has three bugs, so the excerpt below is longer than the one you would sketch on a whiteboard.

```yaml
# .github/workflows/terraform.yml (excerpt)
on:
  pull_request:
    paths: ["accounts/**", "modules/**"]

permissions:
  id-token: write   # required for OIDC
  contents: read

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      accounts: ${{ steps.changed.outputs.accounts }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # the default depth of 1 has no base branch to diff against
      - id: changed
        shell: bash
        run: |
          CHANGED=$(git diff --name-only "origin/${{ github.base_ref }}...HEAD")
          if grep -q '^modules/' <<<"$CHANGED"; then
            # a shared module changed: every account that consumes it needs a plan
            ACCOUNTS=$(ls -d accounts/*/ | cut -d/ -f2)
          else
            ACCOUNTS=$({ grep -E '^accounts/[^/]+/' <<<"$CHANGED" || true; } | cut -d/ -f2 | sort -u)
          fi
          # only roots that still exist can be planned; removing an account is a
          # separate teardown workflow, not a directory deletion
          ACCOUNTS=$(for a in $ACCOUNTS; do if [ -d "accounts/$a" ]; then echo "$a"; fi; done)
          JSON=$(printf '%s\n' $ACCOUNTS | jq -R . | jq -sc 'map(select(length > 0))')
          echo "accounts=$JSON" >> "$GITHUB_OUTPUT"

  plan:
    needs: detect-changes
    if: needs.detect-changes.outputs.accounts != '[]'   # an empty matrix fails the job
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false   # one account's failed plan must not cancel the others
      matrix:
        account: ${{ fromJson(needs.detect-changes.outputs.accounts) }}
    env:
      TF_VAR_terraform_role_name: TerraformPlanRole   # read-only chain for PR code
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.16.2   # the default is latest; pin and bump deliberately
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::999999999999:role/GitHubActionsPlan
          aws-region: us-east-1
      - run: terraform init -input=false -backend-config=backend.plan.hcl && terraform plan -input=false
        working-directory: accounts/${{ matrix.account }}

  # Apply lives in a separate workflow triggered on push to main. It runs inside a
  # protected environment, assumes GitHubActionsApply, sets TerraformDeployRole and
  # inits with backend.apply.hcl.
```

The three fixes:

- **Shallow checkouts have nothing to diff against.** `actions/checkout` fetches a single commit by default, so a diff against the base branch fails. Fetch the history and diff against the PR's base ref rather than a hardcoded `main`.
- **A module change touches no account directory.** With relative module sources, editing `modules/vpc` changes files only under `modules/`, so naive path filtering plans nothing and the breaking change surfaces on the next unrelated PR to each account. Fan out to every account when `modules/` changes, or maintain an explicit module-to-consumers map. Atlantis handles this with per-project `when_modified` globs that can reference module paths.
- **An empty matrix is a failed job.** GitHub Actions refuses to expand a matrix whose vector has no values, so a PR that only touched a stray file under `accounts/` would fail the plan job without the `if` guard.

Two smaller reproducibility points belong in the same breath: pin the Terraform version in CI, since `setup-terraform` installs the latest release when none is given, and commit each root's `.terraform.lock.hcl` with provider version constraints so a plan on Tuesday uses the same provider builds as the apply on Wednesday.

Approval tiers are configuration, not code. Put the apply job behind GitHub Environments: no reviewers for sandbox accounts, required reviewers plus a deployment-branch rule restricting deploys to `main` for staging and production. Check what your GitHub plan offers for private repositories before promising this in an interview, since required reviewers are not available on every plan. Atlantis covers the same ground with per-project `apply_requirements` such as `approved` and `mergeable`, and it plans only the projects whose files a PR modified, which is the changed-path logic above without the shell script.

## Versioning shared modules inside the same repo

A natural follow-up: the modules live in the repo, so how do twenty accounts adopt a module change at twenty different speeds?

```hcl
# Option A: relative path. Every account tracks the module at the current commit.
module "vpc" {
  source = "../../modules/vpc"
  cidr   = "10.0.0.0/16"
}

# Option B: pinned tag. Each account upgrades when its owners choose to.
module "vpc" {
  source = "git::https://github.com/org/infra-repo.git//modules/vpc?ref=vpc-v1.4.2"
  cidr   = "10.0.0.0/16"
}
```

Relative paths are simple and refactor-friendly, and they are the right default while the module set is young. Their cost is coupling: a breaking change to the VPC module becomes part of every account's configuration the moment it merges, and the CI fan-out above is what turns that from a surprise into twenty visible plans. Pinned tags decouple accounts from module changes: sandbox can move to the new tag the day it is cut while prod waits. Renovate's Terraform manager understands git-tag module sources and can open the upgrade PRs, with one caveat: all modules in one repo share a single tag namespace, so per-module prefixes such as `vpc-v1.4.2` and `eks-v2.0.0` need a Renovate rule that maps each module to its own tag pattern, or you version the whole module set together, or you publish modules to a registry. The costs are real too: `terraform init` now clones the repository once per pinned module instead of reading a local directory, the runner needs Git credentials for a repo it already has checked out, and someone owns tagging and release notes. Pinned tags for prod-tier accounts and relative paths for the sandboxes is a defensible middle ground.

## The pushback: "why not just workspaces?"

If this lands after you have explained the layout, answer in terms of failure modes rather than taste. Workspaces share one backend configuration and one set of provider blocks; per-workspace conditionals can vary the values, but they are not a credential or access-control boundary, and a mistake in the shared parts reaches every environment. Workspace selection is mutable state in the operator's shell (or the `TF_WORKSPACE` variable), which is exactly the kind of thing that goes wrong under pressure. Directories remove that hidden step: the configuration in front of you names the account it targets, and `allowed_account_ids` plus IAM stop a wrong-account run from succeeding.

Then give workspaces their due. Short-lived, near-identical environments inside a single account, such as a per-branch preview stack torn down when the PR closes, are what workspaces are good at. Account-level isolation across twenty accounts with different credentials is not.

## The gotcha: drift across twenty accounts goes unnoticed

With this many accounts, someone will change something in the console. A security engineer tightens a security group during an incident; a developer attaches an IAM policy to unblock a deploy. State and reality now disagree, and Terraform will not tell you until an unrelated PR triggers a plan for that account and the diff includes changes nobody proposed. The CLI does not schedule drift checks for you (HCP Terraform's health assessments do), so with plain Terraform you schedule them.

```bash
#!/usr/bin/env bash
# nightly-drift-check.sh: report tracked objects whose live values differ from state
set -u
export TF_VAR_terraform_role_name=TerraformPlanRole   # read-only chain is enough
ROOT=$(pwd)
mkdir -p "$ROOT/drift-logs"
drifted=()
errors=()
for dir in accounts/*/; do
  account=$(basename "$dir")
  (
    cd "$dir" || exit 1
    terraform init -input=false -no-color -backend-config=backend.plan.hcl >/dev/null &&
      terraform plan -refresh-only -detailed-exitcode -input=false -no-color \
        >"$ROOT/drift-logs/$account.log" 2>&1
  )
  case $? in
    0) echo "clean   $account" ;;
    2) echo "DRIFT   $account"; drifted+=("$account") ;;
    *) echo "ERROR   $account (init or plan failed)"; errors+=("$account") ;;
  esac
done
[ ${#drifted[@]} -eq 0 ] || printf 'drifted: %s\n' "${drifted[*]}"
[ ${#errors[@]} -eq 0 ] || { printf 'failed: %s\n' "${errors[*]}"; exit 1; }
[ ${#drifted[@]} -eq 0 ] || exit 2
```

Three details matter. First, `-detailed-exitcode` returns 0 for no changes, 1 for an error and 2 for changes present. On a plain `terraform plan`, exit 2 also fires for configuration that merged but was never applied, which is not drift; `-refresh-only` restricts the comparison to state versus what the providers currently report. Read the log rather than paging on the exit code alone, since output-only changes and provider normalisation can show up there too. Second, be clear about the limit: a refresh compares objects Terraform already tracks, so a resource somebody created by hand outside Terraform is invisible to it. Third, a failed `cd`, init or plan must be reported as an error rather than counted as clean, which is what the chaining and the separate error list are for. And because this is a read-only path, it runs on the plan chain; the deploy roles are never involved.

## Bootstrapping account twenty-one

The last operational question: how does a brand-new account get its first Terraform run? The state bucket has to exist before `terraform init` can use it, and the account roles have to exist before anything can assume them, and you want both created by code. There are two workable approaches.

The organisation-level answer: a new member account already contains a role the management account can assume, `OrganizationAccountAccessRole` for accounts created through AWS Organizations and `AWSControlTowerExecution` for accounts enrolled through Control Tower. A CloudFormation StackSet with service-managed permissions, or a Control Tower customization, then creates the state bucket and the Terraform role in every new account uniformly. Terraform never has to solve its own chicken-and-egg problem because the bootstrap happens before Terraform arrives.

The Terraform-only answer: a tiny bootstrap root module inside the account directory, run once with the local backend using the organization access role, that creates the bucket and the two roles, and is then migrated into that bucket under its own state key so it never collides with the account root's state.

```hcl
# accounts/sandbox-data-444444444444/bootstrap/main.tf
# Run once with the local backend. Then replace it with the s3 backend using
# key = "bootstrap/terraform.tfstate" and run:
#   terraform init -migrate-state -backend-config=backend.bootstrap.hcl
# where that file sets assume_role to the same OrganizationAccountAccessRole,
# because the backend authenticates separately from the provider below.
terraform {
  backend "local" {}
}

provider "aws" {
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::444444444444:role/OrganizationAccountAccessRole"
  }
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "tfstate-sandbox-data-444444444444"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Plus aws_iam_role and policy resources for TerraformPlanRole and
# TerraformDeployRole, each trusting its central CI role, so the account
# root can run without this access role.
```

Enable versioning on every state bucket: HashiCorp recommends it because it lets you recover a state object that was deleted or corrupted, although it does not roll back the infrastructure an apply changed. With S3 native locking there is no DynamoDB table to create, which is one fewer thing to end up subtly different between account seventeen and account eighteen. Whichever route you pick, write it down in the repo. The failure mode is not the bootstrap itself but discovering a year later that three accounts were bootstrapped by hand and nobody remembers how.

## The answer in one pass

1. Directories, not workspaces: one root module per account with its own backend, provider configuration and hardcoded role ARN, guarded by `allowed_account_ids`.
2. State lives in a bucket inside the account it describes, locked with `use_lockfile`, and the backend assumes the per-account role itself: the plan role for pull requests, the deploy role for applies.
3. CI authenticates via OIDC to a central plan or apply role and assumes the matching per-account role, so pull-request code can read infrastructure and state but change neither; it pins Terraform, diffs against the PR base with full history, fans out when `modules/` changes, guards against an empty matrix, and gates applies with environment protection or Atlantis apply requirements.
4. Shared modules are pinned by tag where accounts need to upgrade on their own schedule, with Renovate opening the PRs.
5. Drift detection is a scheduled `plan -refresh-only -detailed-exitcode` across every account, alerting on exit 2 and treating errors separately.
6. New accounts are bootstrapped uniformly, by a StackSet or Control Tower customization, or by a documented local-backend bootstrap root followed by a state migration.

Land that and the natural follow-up is Terragrunt, which exists to remove the repeated backend and provider configuration this design puts in twenty folders and adds dependency ordering between roots; be ready to explain what it buys and what it costs.

Multi-account layout is one of the design questions Terraform interviews go deep on, alongside state internals, module design, drift and day-2 operations. [Infrastructure as Code Mastery: Terraform & OpenTofu](/ebooks/infrastructure-automation-mastery) works through all of it with 50+ interview questions, worked answers and the production reasoning behind them. It is one of the five books in the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
