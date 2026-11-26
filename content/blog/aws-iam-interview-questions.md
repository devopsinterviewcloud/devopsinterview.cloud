---
title: AWS IAM Interview Questions on Roles, SCPs and Boundaries
description: AWS IAM interview questions for experienced engineers: policy evaluation, least privilege, role chaining, boundaries vs SCPs and short-lived credentials.
date: 2026-11-26
keywords: aws iam interview questions, aws iam interview questions and answers for experienced, aws iam scenario based interview questions, aws assume role interview questions, permission boundary vs scp, aws iam least privilege interview questions
topic_id: K06
---

AWS IAM interview questions sound easy until the follow-ups start. "What's a role?" becomes "who can assume it, for how long, and what stops them passing it to a Lambda function with admin rights?" The questions below follow that path: how AWS evaluates a request, taking an existing role down to least privilege, assume-role chains and cross-account access, permission boundaries and SCPs, and moving a company off long-lived access keys. They finish with an AccessDenied scenario on a request the role's policy clearly allows.

## AWS IAM interview questions on how a request is evaluated

### 1. Walk me through how AWS decides whether a request is allowed.

A request from an IAM user or role starts as an implicit deny. (The account root user is the exception: it has broad access by default, though organization policies, explicit denies and service rules such as KMS key policies still limit it.) AWS collects the policies that apply, and the [IAM evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html) checks them in this order:

1. An explicit deny in any applicable policy. One is enough, and the answer is Deny.
2. Resource control policies (RCPs) from AWS Organizations.
3. Service control policies (SCPs).
4. Resource-based policies, such as a bucket policy or a role's trust policy.
5. Identity-based policies attached to the user or role.
6. Permissions boundaries.
7. Session policies passed when a role session was created.

Interviewers probe which of these grant and which only limit. Identity-based and resource-based policies grant access. RCPs, SCPs, boundaries and session policies never grant anything. SCPs and RCPs cap everything in their scope, while boundaries and session policies cap identity-based permissions, with one resource-policy exception covered next.

### 2. Identity-based or resource-based policy: when is one allow enough?

For most resources inside one account, an allow in either is enough. A bucket policy that names an IAM user can let that user read objects even if no identity policy, or the user's boundary, mentions S3. Roles carry a catch: a resource-based policy that names a role ARN is still limited by an implicit deny in the role's boundary or session policy, while one that names the exact role session ARN is not.

Two exceptions apply even in one account. Assuming a role always needs the role's trust policy to allow it, and an identity policy can't stand in for it. KMS keys are the other: IAM policies only take effect for a key if its key policy allows them, which the default key policy does by trusting the account. Across accounts, both sides have to agree: the caller's identity policy must allow the action, and the resource policy must allow the caller.

### 3. Users, groups or roles: when should a person have an IAM user?

Rarely. People should sign in through federation with temporary credentials, usually IAM Identity Center connected to the company identity provider, and workloads should use roles. IAM users are for the few tools that can't do anything else.

A group isn't a principal, so you can't name one in a trust policy or a bucket policy. The root user needs a plan too. With [centralized root access](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html), the management account can delete root credentials from member accounts and still run the handful of tasks that need root, such as removing a bucket policy that denies every principal.

## Least privilege on a real AWS account

### 4. How do you take an existing role down to least privilege?

Start from evidence of use, not from the policy text. IAM gives you three sources:

- **Last accessed information** shows when the role last tried each service, denied attempts included, and individual management actions for some services. Action-level data excludes data events such as S3 object reads, so check those in CloudTrail data-event logs, which are off by default.
- **IAM Access Analyzer policy generation** reads up to 90 days of the role's CloudTrail activity and drafts a policy from it. Treat it as a draft: outside its list of action-level services it identifies only the service, and a quarterly job that didn't run inside the window won't appear.
- **Unused access findings** from Access Analyzer flag unused roles, access keys, passwords and permissions on an ongoing basis.

Then tighten with resources and conditions, not just actions: specific ARNs, `aws:PrincipalOrgID` on resource policies so only principals in your organization get in, and tag-based (ABAC) conditions where per-team roles would otherwise multiply. Finally, gate changes in CI. Access Analyzer policy validation catches errors and risky patterns, and its `CheckNoNewAccess` custom check compares a changed policy against the current one, so a pull request that widens access fails before it merges. Custom checks are charged per call. The free question on [IAM least privilege done right](/questions/aws-iam-best-practices-least-privilege-done-right) covers the start-from-zero argument.

### 5. What's wrong with allowing iam:PassRole on every resource?

PassRole is how a principal hands a role to a service: a Lambda execution role, an EC2 instance profile, an ECS task role. If an admin role trusts `lambda.amazonaws.com`, a developer who can pass any role, create functions and invoke them can create one that runs as that role, escalating without touching an IAM policy. Scope PassRole to role ARNs, ideally under a path, and pin the service it may go to:

```json
{
  "Effect": "Allow",
  "Action": "iam:PassRole",
  "Resource": "arn:aws:iam::111122223333:role/app/orders-*",
  "Condition": {
    "StringEquals": { "iam:PassedToService": "lambda.amazonaws.com" }
  }
}
```

## AWS assume-role and cross-account interview questions

### 6. What has to be true for a role in account B to be assumed from account A?

Two policies, one on each side. The role's trust policy in B names a principal from A, and that principal needs an identity policy in A allowing `sts:AssumeRole` on the role's ARN. Trusting the whole of account A hands the decision to A's administrators. Name a specific role ARN when B should decide, and know the gotcha: IAM stores that role by its unique ID, so if it's deleted and recreated, the trust policy no longer matches it.

A session lasts one hour by default, and you can request anything from 15 minutes up to the role's maximum session duration, which can be set between 1 and 12 hours.

### 7. What is role chaining, and why does it cut your session to an hour?

Role chaining is using one role session's credentials to assume another role. A pipeline that authenticates to a role in a tooling account and then assumes a deploy role in each workload account is chaining. AWS caps a chained session at one hour regardless of the target role's maximum session duration, and a request for longer fails. It's a common reason a long Terraform apply fails after an hour with expired credentials. The fix is to get the target role's credentials straight from the federated identity, for example OIDC trust on the target role itself, which isn't chaining. Raise that role's maximum session duration and request the longer session explicitly, through `DurationSeconds` or your CI credentials step's equivalent setting. The [Terraform mono-repo design for 20 AWS accounts](/blog/terraform-mono-repo-20-aws-accounts) shows a two-rung chain like this in practice.

Two things survive a chain: session tags marked transitive, and a source identity, which can't be changed once set. Set it from a value the caller can't choose, such as the username your identity provider asserts, and at every hop allow `sts:SetSourceIdentity` alongside `sts:AssumeRole`, in both the caller's permissions policy and the target role's trust policy. CloudTrail then records it on later actions, so an action in the third account traces back to whoever started the chain.

### 8. What is the confused deputy problem, and how does an external ID fix it?

A SaaS vendor assumes a role in each customer's account. If your trust policy only checks that the vendor's account is calling, another customer can give the vendor your role ARN and have the vendor read your data for them. An external ID closes that gap. The vendor generates a unique value for each customer, and your trust policy requires it:

```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::444455556666:root" },
  "Action": "sts:AssumeRole",
  "Condition": { "StringEquals": { "sts:ExternalId": "customer-7f3a9c" } }
}
```

The value has to come from the vendor and be unique among its customers. If customers pick their own, two can pick the same one. AWS services acting on your behalf raise the same problem, which is why a resource policy that grants a service principal should also check `aws:SourceArn` or `aws:SourceAccount`.

## Permission boundary vs SCP interview questions

### 9. Permission boundary, SCP or RCP: which one stops what?

| | Permissions boundary | SCP | RCP |
|---|---|---|---|
| Attached to | One IAM user or role | Organization root, OU or account | Organization root, OU or account |
| Limits | That principal's identity-based permissions | Users and roles in member accounts, root user included | Access to resources in member accounts |
| Principals outside the organization | Not applicable | Not affected | Affected |
| Management account | Applies | Not affected | Not affected |
| Service-linked roles | Not applicable | Not affected | Not affected |
| Grants permissions | No | No | No |

The row to talk through is principals outside the organization. An SCP can't stop an external account that reads your bucket through an over-broad bucket policy, because SCPs only restrict your own principals. An RCP can, which is why RCPs sit at the centre of a data perimeter: deny S3 access unless `aws:PrincipalOrgID` matches yours, with an exception for AWS service principals (`aws:PrincipalIsAWSService`). RCPs only cover supported services, so check the list before relying on one. The free question on [SCPs as guardrails for a multi-account organization](/questions/aws-organization-scps-guardrails-for-multi-account) covers the SCP side.

### 10. How do you let developers create IAM roles without handing them admin?

Delegate with a permissions boundary. The developer may create a role only with a specific boundary, and attach or update policies only on roles that already carry it:

```json
{
  "Sid": "CreateRolesOnlyWithBoundary",
  "Effect": "Allow",
  "Action": ["iam:CreateRole", "iam:AttachRolePolicy", "iam:PutRolePolicy"],
  "Resource": "arn:aws:iam::111122223333:role/app/*",
  "Condition": {
    "StringEquals": {
      "iam:PermissionsBoundary": "arn:aws:iam::111122223333:policy/AppBoundary"
    }
  }
}
```

Around that sit explicit denies on removing or replacing a role's boundary and on changing the boundary policy itself (`iam:CreatePolicyVersion`, `iam:SetDefaultPolicyVersion`, `iam:DeletePolicyVersion`, `iam:DeletePolicy`), with PassRole scoped to the same `app/` path. Whatever the developer attaches, the role's identity-based permissions can't exceed the boundary. One limit: the boundary doesn't follow a session into another role it assumes.

## Moving to short-lived credentials

### 11. You inherit hundreds of long-lived access keys. How do you get rid of them?

Inventory first. The credential report lists every user's keys with when each was last used, and for which service and Region. Then sort the keys by who uses them, because each kind has its own replacement:

| Who uses the key | Replacement |
|---|---|
| Engineers on laptops | IAM Identity Center with `aws sso login` |
| CI pipelines | OIDC federation to a role |
| EC2 instances | Instance profiles |
| Pods on EKS | EKS Pod Identity or IRSA |
| Servers outside AWS | IAM Roles Anywhere with X.509 certificates |
| A vendor's SaaS | Cross-account role with an external ID |

Move one consumer at a time and deactivate each old key before deleting it, since deactivation can be undone and deletion can't. Then stop new keys appearing, with an SCP that denies `iam:CreateAccessKey` outside a named exception and unused-access findings to catch what slips through. A leaked key is its own drill: see [AWS keys leaked on GitHub and the 5-minute fix](/questions/aws-keys-leaked-on-github-5-minute-fix).

### 12. How does a GitHub Actions workflow get AWS credentials without a stored secret?

Through OIDC. Register `https://token.actions.githubusercontent.com` as an IAM OIDC identity provider with the audience `sts.amazonaws.com`, give the job `id-token: write` permission, and the job exchanges its signed token for role credentials through `AssumeRoleWithWebIdentity`. The trust policy decides which workflows get in:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:acme/payments:environment:production"
  }
}
```

IAM now [rejects a GitHub trust policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html) with no `sub` condition or a `sub` that is only a wildcard, but a loose `StringLike` pattern still passes: `repo:acme/*` admits every repository in that organization that uses the older subject format. Pin `sub` to one repository plus a branch or protected environment, in the format that repository actually sends. The example uses the older format; repositories created after July 15, 2026, or opted into immutable subject claims, include numeric IDs, as in `repo:acme@123456/payments@456789:environment:production`. The [DevSecOps pipeline walkthrough](/blog/devsecops-pipeline-from-scratch) shows where the credential step sits among the other gates.

### 13. IRSA or EKS Pod Identity: how should pods get AWS credentials?

Both give a pod its own role; they differ in where trust lives:

- **IRSA** needs an IAM OIDC provider for each cluster, and each role's trust policy names that cluster's provider and service account. Using the role in a new cluster means editing its trust policy.
- **EKS Pod Identity** trusts the service principal `pods.eks.amazonaws.com` once, and you map a namespace and service account to the role through an EKS API association. The same role works in a new cluster without trust changes, and the session tags it adds (cluster name, namespace, service account) support ABAC.

Pod Identity needs the Pod Identity Agent on Linux EC2 nodes and doesn't run on Fargate, Windows nodes or self-managed clusters, so IRSA stays for those. Whichever you pick, require IMDSv2 with a hop limit of 1 so pods outside the host network can't borrow the node's instance role. The Kubernetes half of the same problem is in [locking down Kubernetes RBAC](/blog/kubernetes-rbac-least-privilege-lockdown).

## AWS IAM scenario-based interview question: AccessDenied

### 14. A role gets AccessDenied, and its policy clearly allows the action. Where do you look?

Read the error first. Many services name the policy type that denied the request:

```text
User: arn:aws:sts::111122223333:assumed-role/deploy/ci is not authorized to perform:
s3:PutObject on resource: "arn:aws:s3:::acme-artifacts/build.zip" with an explicit
deny in a service control policy
```

If several policy types deny, the message names only one, so fixing it can surface the next. Then walk the layers:

- **Organization policies.** SCPs and RCPs anywhere on the account's path to the root, not just the OU it sits in.
- **Boundary and session policy.** A pipeline that passes a session policy on AssumeRole can be narrower than the role.
- **Resource policies.** A bucket policy that denies requests not arriving through a specific VPC endpoint, or a KMS key policy: writing to a bucket with SSE-KMS also needs permission on the key.
- **Conditions.** `aws:SourceIp` isn't available on requests through a VPC endpoint, so an IP allow-list breaks once traffic moves to one.

## AWS IAM review checklist

- No long-lived access key without a named owner and a documented exception.
- Trust policies name roles, not whole accounts, unless you mean to delegate; vendor roles require an external ID.
- PassRole scoped by ARN and `iam:PassedToService`.
- A boundary on every role developers can create, SCPs for organization-wide limits, RCPs for the data perimeter.

## Interview questions this covers

- How does AWS evaluate a request across identity policies, resource policies, boundaries and SCPs?
- What is the difference between a permissions boundary, an SCP and an RCP?
- How does cross-account role assumption work, and what is role chaining?
- How would you move a team off long-lived IAM access keys?
- A role gets AccessDenied even though its policy allows the action. How do you troubleshoot it?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

Cloud identity rounds go further: SSO and identity federation for engineers across AWS, Azure and GCP, or giving an external system deploy access to GCP and Azure without sharing credentials. [Cloud Platforms: AWS, Azure & GCP Interview Questions](/ebooks/cloud-interview-mastery) works through 50 senior-level questions with worked answers, including a chapter on cloud networking and security. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework.
