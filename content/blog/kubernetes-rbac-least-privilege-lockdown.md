---
title: Locking Down Kubernetes RBAC in a Multi-Tenant Cluster
description: Design least-privilege Kubernetes RBAC with Roles vs ClusterRoles, ServiceAccount lockdown, audit commands, and the verbs that open privilege-escalation paths.
date: 2026-08-08
keywords: kubernetes rbac, roles vs clusterroles, kubernetes serviceaccount security, kubectl auth can-i, kubernetes least privilege, kubernetes rbac interview questions
source_video_id: G5rsrDLoESE
---

A new product team is onboarding onto your shared cluster. Their developers need to deploy to their own namespace, their CI pipeline needs to roll deployments and run database migrations, and the security auditor wants proof that no tenant identity can touch another team's workloads. Design it. This scenario shows up in interviews for the same reason it shows up in real platform work: it cannot be answered by reciting object names. It tests whether you can turn four RBAC primitives into a working permission model, and whether you know the handful of places where a copy-pasted ClusterRoleBinding hands someone the whole cluster.

The video version walks the same design if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/G5rsrDLoESE" title="Kubernetes RBAC: Lock Down Your Cluster" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## The four objects, and where identities actually come from

RBAC in Kubernetes is four kinds of object. A **Role** is a list of allowed verbs on resources, scoped to one namespace. A **ClusterRole** is a cluster-scoped object with the same rule format; its rules can target cluster-scoped resources like nodes and PersistentVolumes as well as namespaced ones, and where those rules apply depends on how it is bound. A **RoleBinding** grants a Role (or, importantly, a ClusterRole) to subjects, with effect limited to the RoleBinding's namespace; the subjects need not live in that namespace (users and groups are not namespaced at all, and a ServiceAccount subject can be referenced from any namespace). A **ClusterRoleBinding** grants a ClusterRole to subjects across the entire cluster.

The subjects are users, groups, and ServiceAccounts, and the distinction matters more than most candidates realise. Users and groups are not Kubernetes objects at all: an authenticator maps each presented credential to a username and group memberships, from the subject fields of a client certificate or from the claims in an OIDC token issued by your identity provider. ServiceAccounts are the identities Kubernetes itself creates and manages, and they are what pods and CI pipelines use to talk to the API server.

## The pattern most candidates miss: ClusterRole plus RoleBinding

A RoleBinding can reference a ClusterRole, which grants that ClusterRole's permissions only inside the RoleBinding's namespace. That turns ClusterRoles into reusable permission templates. You define a developer role once and stamp it into each team's namespace with a per-namespace binding, so there is no duplicated YAML drifting apart between teams:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-developer
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "patch", "update"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
```

The discipline that goes with the pattern: a ClusterRoleBinding only for identities that genuinely need cluster-wide access, such as cluster operators and a small set of controllers. Binding the built-in `cluster-admin` ClusterRole cluster-wide bypasses everything else in this post, and every one of those bindings is something you will have to explain to an auditor.

## Wiring up the team namespace

For the new team, create their namespace and one RoleBinding in it that points the reusable ClusterRole at their group:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: payments-dev-binding
  namespace: team-payments
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: namespace-developer
subjects:
- kind: Group
  name: payments-devs
  apiGroup: rbac.authorization.k8s.io
```

The group name matches whatever group claim your identity provider puts in the token. Joiners and leavers are then handled in the IdP, with no Kubernetes changes at all, and the binding itself is a small, reviewable file in Git. Everyone in `payments-devs` can deploy and read pods in `team-payments`, and nothing in this binding grants anything anywhere else. RBAC is additive across bindings, though: a second binding somewhere else can widen what the group can do, which is why the audit section below exists.

## ServiceAccounts and the default-account trap

Every pod that does not specify a ServiceAccount runs as the `default` one in its namespace, and by default that account's token is mounted into the pod whether the workload needs API access or not. Under RBAC the `default` ServiceAccount starts with nothing beyond the basic discovery permissions granted to all authenticated principals, but the moment someone grants it more (usually to unblock one workload in a hurry), every pod in the namespace silently inherits the grant. Two rules prevent that:

- Every workload that needs API access gets its own dedicated ServiceAccount.
- The `default` ServiceAccount gets `automountServiceAccountToken: false`, so pods that never asked for API access do not carry a credential. A pod can still set the same field on its own spec, which takes precedence, so this is a default rather than an enforcement mechanism; enforcement of what pods may do comes from the admission layer covered below.

For the team's CI pipeline, that looks like:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payments-ci
  namespace: team-payments
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ci-deployer
  namespace: team-payments
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "patch", "update"]
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: payments-ci-binding
  namespace: team-payments
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ci-deployer
subjects:
- kind: ServiceAccount
  name: payments-ci
  namespace: team-payments
```

The Job rule exists because this pipeline runs its database migrations as Kubernetes Jobs; if yours does not, drop it. Also give the pipeline short-lived credentials, either time-limited TokenRequest tokens (`kubectl create token`) or a federated external identity, rather than a long-lived ServiceAccount token Secret, which Kubernetes itself discourages.

Assume the CI credential leaks eventually, and be precise about the blast radius. Patching deployments and creating Jobs are both workload creation, which Kubernetes documents as a privilege-escalation path in its own right: the stolen credential can run an arbitrary image, mount any Secret in the namespace, and run pods as any ServiceAccount in the namespace. The credential's direct API permissions stop at `team-payments`, but what a malicious workload reaches from there depends on the other layers: pod networking, cloud metadata endpoints and workload identity, node hardening, and whatever the namespace itself holds. Containment therefore rests on keeping high-privilege ServiceAccounts and shared secrets out of tenant namespaces, on the network and admission controls covered below, and on admission policies if you need to restrict which images or ServiceAccounts a Job may use.

## Auditing a cluster you inherited

The built-in tooling answers most audit questions. `kubectl auth can-i` checks a single permission, `--list` dumps everything the current identity can do (with the caveat that the list can be incomplete depending on the authorizers in play, which is worth stating rather than trusting it blindly), and `--as` impersonates another identity, provided your own identity has impersonation rights:

```bash
# Everything the CI ServiceAccount can do in its namespace
$ kubectl auth can-i --list \
  --as=system:serviceaccount:team-payments:payments-ci \
  -n team-payments

# Spot-check cross-namespace access: should come back "no"
$ kubectl auth can-i get pods \
  --as=system:serviceaccount:team-payments:payments-ci \
  -n team-checkout

# Every subject bound to cluster-admin
$ kubectl get clusterrolebindings -o json | jq '.items[]
  | select(.roleRef.name=="cluster-admin")
  | {name: .metadata.name, subjects: .subjects}'
```

Two caveats before treating those answers as proof. First, `--as` with a ServiceAccount name does not automatically include the groups that account would carry in real requests, such as `system:serviceaccounts` and `system:serviceaccounts:team-payments`; permissions granted to those groups only show up if you add them explicitly with `--as-group`. Second, a `no` from `can-i` proves exactly one verb-resource-namespace combination. Stronger RBAC evidence for an auditor is an enumeration of every binding that references the identity and its groups, with `can-i` spot checks on top; even that is a point-in-time view of RBAC alone, so it sits alongside the authorizer configuration, the real group claims coming from the IdP, and the audit log rather than standing in for them.

The cluster-admin query is usually the fastest way to find trouble in an inherited cluster. Expect the built-in binding for the `system:masters` group plus a small, explainable set of operator or break-glass identities; a long list of humans and pipeline accounts is a finding. For a fuller picture, [rakkess](https://github.com/corneliusweig/rakkess) renders an access matrix per subject, and [rbac-tool](https://github.com/alcideio/rbac-tool) (from Alcide, now part of Rapid7) can visualise bindings and flag risky grants across the cluster.

## The bind and escalate verbs

Kubernetes has escalation-prevention rules built into the RBAC API: you can only create or update a role binding if you already hold every permission in the referenced role at the binding's scope, or if you hold the `bind` verb on that role. Likewise, creating or updating a role that contains permissions you do not yourself hold requires the `escalate` verb. Both verbs target the `roles` and `clusterroles` resources, and both are deliberate bypasses of the safety rails.

That makes them a quiet escalation path when combined with write access to the corresponding objects. A subject who can create ClusterRoleBindings and holds unrestricted `bind` on ClusterRoles can grant `cluster-admin` cluster-wide to any identity, including their own; the same combination with namespaced RoleBindings hands over everything in that namespace. A subject with `escalate` plus write access on roles can author permissions they were never granted. There is a legitimate use: `bind` constrained with `resourceNames` to a specific, limited role is how you delegate that one role safely. Unrestricted `bind` and `escalate`, and wildcards generally, are the red flags, so scan for them and then read what the scan finds instead of treating every hit as an incident:

```bash
# ClusterRoles with wildcard resources
$ kubectl get clusterroles -o json | jq '.items[]
  | select(.rules[]?.resources[]? == "*")
  | .metadata.name'

# ClusterRoles granting bind or escalate
$ kubectl get clusterroles -o json | jq '.items[]
  | select(.rules[]?.verbs[]? == "bind" or .rules[]?.verbs[]? == "escalate")
  | .metadata.name'
```

These queries cover ClusterRoles only, and the same problems hide in namespaced Roles, in wildcard verbs and apiGroups, and in non-resource URLs, so a real audit repeats the pattern across those too.

Aggregation is the other way permissions grow without anyone editing a role. The rules of the built-in `admin`, `edit` and `view` ClusterRoles are aggregation-controlled: a controller populates them from every ClusterRole carrying a label like `rbac.authorization.k8s.io/aggregate-to-edit: "true"`. Operators and CRD-based add-ons routinely ship ClusterRoles with those labels, which means installing one can silently expand what `edit` grants in every namespace that binds it. After installing an operator, diff the contents of the aggregated roles against what they held before.

## Where RBAC stops

RBAC governs the Kubernetes API server and nothing else. It does not restrict traffic between pods, it does not stop a privileged container from reaching the node, and it has no opinion about what runs inside a container. For this scenario's threat model, tenant isolation rests on three layers: RBAC for API access, NetworkPolicies for pod-to-pod traffic, and Pod Security Admission (or a policy engine like OPA Gatekeeper or Kyverno) to stop privileged pods from being created in the first place. Stricter tenancy requirements add more: resource quotas, storage isolation, node isolation or sandboxed runtimes, and at the far end dedicated clusters per tenant. The mistake to avoid is treating RBAC as the whole security story and skipping the rest.

## Making least privilege the default

Three habits turn all of the above from a one-off cleanup into a steady state:

1. **Bake it into provisioning.** Namespace creation should apply the default-ServiceAccount lockdown automatically, so new workloads start safe and opt in to API access:

```bash
$ kubectl patch serviceaccount default \
  -n team-payments \
  -p '{"automountServiceAccountToken": false}'
```

2. **Keep RBAC in Git.** Applying bindings through a reviewed pipeline means every permission change has a commit and an approver behind it. Be careful not to oversell this in an interview: a GitOps reconciler manages the resources it is told about, and an out-of-band ClusterRoleBinding that was never in Git will not be automatically reverted, and may not even be reported, unless you have configured drift or orphan detection to cover it. Git gives you provenance; catching out-of-band changes is the next habit's job.

3. **Alert on ClusterRoleBinding writes.** Watch updates and patches as well as creations, since adding a subject to an existing binding grants just as much as creating a new one. This requires API server auditing to be configured with a policy that captures RBAC writes; managed providers can expose the audit stream through their logging services (often behind an explicit control-plane logging toggle), and self-managed API servers log nothing until you set a policy. Once the events flow, tools such as Falco can consume them via the Kubernetes audit event source; note that Falco's shipped rule set covers specific cases like bindings to `cluster-admin`, so alerting on all ClusterRoleBinding writes means a small custom rule. These writes should be rare, deliberate and reviewed; an unexpected one is either a mistake or an attack, and both deserve a page.

## The model to present

1. ClusterRoles as reusable permission templates, granted per namespace via RoleBindings.
2. Subjects are IdP groups for humans, dedicated ServiceAccounts for workloads; joiners and leavers are an IdP change, not a cluster change.
3. `automountServiceAccountToken: false` on default ServiceAccounts; every API-consuming workload gets its own account with minimal verbs.
4. Audit by enumerating bindings per subject, with `kubectl auth can-i --list` and impersonation (including `--as-group`) as spot checks; enumerate `cluster-admin` bindings and hunt for unrestricted `bind`, `escalate` and wildcards in both ClusterRoles and Roles.
5. Watch aggregated ClusterRoles after installing operators.
6. RBAC plus NetworkPolicy plus Pod Security Admission, since each layer covers what the others cannot. And because workload creation is itself an escalation path, keep high-privilege ServiceAccounts and shared secrets out of tenant namespaces.

Walking those six points through the multi-tenant scenario covers the design question, the audit question and the trade-off question in one pass, and it names the residual risks explicitly.

RBAC is one chapter of the Kubernetes story real interviews go deep on, alongside networking, scheduling, debugging and scaling. [Container Orchestration Journey: Docker to Kubernetes](/ebooks/container-orchestration-journey) covers that full arc with 100+ worked questions, follow-up chains and production war stories. It is one of the five books in the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
