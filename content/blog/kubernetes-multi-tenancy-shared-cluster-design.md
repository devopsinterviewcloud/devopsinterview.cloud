---
title: Kubernetes Multi-Tenancy: Designing a Shared Cluster
description: Kubernetes multi-tenancy design for a shared cluster: tenancy models, namespace and RBAC layout, default-deny networking, quotas, admission policy and Capsule.
date: 2026-10-24
keywords: kubernetes multi-tenancy, multi-tenant kubernetes cluster design, kubernetes namespace isolation, kubernetes default deny network policy, capsule kubernetes multi-tenancy, kubernetes multi-tenancy interview questions
source_video_id: 5yIN10vSIJM
---

"We have twenty engineering teams and we want them all on one shared Kubernetes cluster. How do you design it so teams are isolated, cannot affect each other, and ops does not become a bottleneck?" That is the usual shape of the Kubernetes multi-tenancy question in platform engineering interviews, and it tends to arrive with no further constraints. Part of a good answer is asking what the interviewer left out, starting with how much the tenants trust each other. The rest is a layered design: namespaces and RBAC for API access, NetworkPolicies for traffic, quotas for capacity, admission policy to enforce it all, and automation so it stays that way.

The video version covers the same design if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/5yIN10vSIJM" title="Multi-Tenant Kubernetes Done Right" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## Soft vs hard Kubernetes multi-tenancy: which model do you need?

Pin down the tenancy model first, because every later decision depends on it. Soft multi-tenancy assumes tenants are cooperative, like teams in one company, and relies on logical separation: namespaces, RBAC and NetworkPolicies on shared nodes and a shared control plane. Hard multi-tenancy assumes tenants may be hostile to each other and needs much stronger isolation, which in practice means sandboxing or dedicated infrastructure on top of those controls. It is a spectrum rather than two settings, and different tenants on one platform can sit at different points.

What decides it is trust between tenants. Internal teams who share an employer and a security team mostly need protection from accidents: a runaway deployment, a pod with no memory limit. A SaaS product running customer-supplied code needs protection from attackers, and soft tenancy alone is not enough there. Every container on a node shares that node's Linux kernel, so a container escape exposes every tenant scheduled on it.

| Infrastructure choice | What it adds | Cost and ops burden | Fits |
|---|---|---|---|
| Shared nodes | Namespaces, RBAC, NetworkPolicy, quotas | Lowest: one cluster to upgrade and monitor | Internal teams who trust each other |
| Dedicated node pools | Node-level separation via taints and node selectors | Moderate: more pools, worse bin-packing | Noisy or sensitive internal tenants |
| Virtual control plane | A per-tenant API server, for example vCluster | Moderate: one more control plane per tenant | Tenants who need their own CRDs |
| Separate clusters | Everything | Highest: every cluster to patch and observe | Untrusted code, regulatory separation |

For the twenty-team question, the defensible answer is soft tenancy with strong defaults and a path to move specific tenants onto dedicated nodes or clusters when their threat model demands it.

## How should you lay out namespaces and RBAC for each team?

Namespaces are the primary isolation unit. A common layout is one namespace per team per environment: `payments-dev`, `payments-staging` and `payments-prod` rather than one `payments` namespace holding everything, so bindings, quotas and audit entries are scoped to something meaningful.

The platform team defines ClusterRoles as permission templates and grants them per namespace with RoleBindings. A RoleBinding that references a ClusterRole grants its permissions only inside the binding's namespace, so one definition serves every team:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: app-developer
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments/scale"]
  verbs: ["get", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: payments-developers
  namespace: payments-prod
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: app-developer
subjects:
- kind: Group
  name: payments-team
  apiGroup: rbac.authorization.k8s.io
```

`kubectl scale` needs the `deployments/scale` rule: it goes through the scale subresource, which RBAC treats as a separate resource, so patch rights on Deployments are not enough. Extend the template with what your teams actually deploy, one resource at a time.

Tenants never get cluster-scoped permissions or `cluster-admin`. RBAC's escalation rules already stop a tenant from binding a role with permissions they lack unless they hold `bind` on it, so the realistic risk is a platform engineer granting `cluster-admin` "temporarily" during an incident and never removing it. An admission policy that rejects creating or updating any RoleBinding or ClusterRoleBinding that references `cluster-admin`, unless the request comes from the platform's deploy identity, stops anyone handing one out directly, including by adding a subject to an existing binding; protected-branch review on the repository that identity deploys from is what puts the grant through Git review.

Deployment rights are a privilege path of their own that the `bind` checks do not cover. A workload can run as any ServiceAccount in its namespace and mount any Secret there, so keep privileged ServiceAccounts and shared credentials out of tenant namespaces. The [Kubernetes RBAC lockdown guide](/blog/kubernetes-rbac-least-privilege-lockdown) covers escalation verbs, ServiceAccounts and audit queries in depth.

## How do you isolate tenant network traffic with NetworkPolicies?

By default, any pod in a cluster can reach any other pod. The multi-tenant baseline is a default-deny NetworkPolicy in every namespace from the moment it exists, applied by the provisioning pipeline so no team has to remember it:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

Policies are additive, so allow rules go on top. Pods in the same namespace need one, an ingress and egress rule whose peer is an empty `podSelector`. DNS needs its own rule: with egress denied, every service lookup fails until you allow it explicitly.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: payments-prod
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

This assumes pods query the CoreDNS pods directly, and `k8s-app: kube-dns` is a common label but not universal. Check the labels and a pod's `/etc/resolv.conf` first: with NodeLocal DNSCache or another resolver path you need a different rule, often an `ipBlock` for the node-local address. Then add small allows for platform services, such as ingress from the ingress controller and from Prometheus, selecting those namespaces by `kubernetes.io/metadata.name`, an immutable label the control plane sets to each namespace's name.

NetworkPolicy is enforced by the network plugin, and on a plugin without support a policy silently does nothing. Calico and Cilium enforce it; Flannel on its own does not.

Tenants also must not be able to undo the baseline. The built-in `admin` and `edit` ClusterRoles include NetworkPolicy writes, and restoring a deleted default-deny is not enough, because a tenant who can write policies can add an allow-all next to it. Keep NetworkPolicy writes out of tenant roles. If teams need to manage their own rules, constrain what those rules may allow at admission, or put the cross-tenant boundary in cluster-scoped policies tenants cannot edit; Calico and Cilium both offer cluster-scoped policies that can enforce a deny a namespace-level allow cannot override.

Cilium's own CiliumNetworkPolicy adds L7 rules, so you can restrict a shared API by HTTP method and path as well as port, at the price of a resource that only works on Cilium.

## How do ResourceQuota and LimitRange prevent noisy neighbours?

Without resource controls, one team's bad deployment can starve everyone else on the same nodes. A ResourceQuota caps a namespace's total requests, limits and object counts; a LimitRange sets per-container defaults and maximums. They work as a pair:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: payments-prod
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    count/pods: "50"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: payments-prod
spec:
  limits:
  - type: Container
    default:
      cpu: 250m
      memory: 256Mi
    defaultRequest:
      cpu: 100m
      memory: 128Mi
    max:
      cpu: "4"
      memory: 4Gi
```

Once a namespace has a CPU or memory quota, every new pod must declare requests or limits for those resources or the API server can reject it. Without a LimitRange, that surfaces as ReplicaSets stuck on `FailedCreate` events. The LimitRange fills in defaults for containers that declare nothing, so their pods are admitted and still counted. The numbers are placeholders; size them from real usage, as the [Kubernetes cost optimization walkthrough](/blog/kubernetes-cost-optimization-200-node-cluster) describes.

PriorityClasses do less against eviction than is often assumed. Priority decides which pods the scheduler preempts when the cluster is full, and it is one factor in the kubelet's eviction order under node pressure, ranked after whether a pod is using more than it requested. The multi-tenancy risk runs the other way: a tenant can set `priorityClassName` to any PriorityClass you have created, including the high one meant for platform agents. Kubernetes can restrict that with ResourceQuota scope selectors plus an API server admission configuration file. On managed clusters, where you cannot pass API server flags, a policy that rejects high priority classes outside platform namespaces does the same job.

## Which admission policies does a multi-tenant cluster need?

Admission control checks every object against your standards before it is stored. Three layers are worth naming in an interview.

**Pod Security Admission** is built in. Labelling tenant namespaces with `pod-security.kubernetes.io/enforce: restricted` rejects privileged containers, host namespaces, hostPath volumes and containers allowed to run as root, which closes the easiest paths from a container to its node. Tenants cannot remove the label while their roles have no write access to Namespace objects.

**A policy engine** covers what Pod Security does not: approved registries, required labels, the `cluster-admin` rule above, and a ban on Service `externalIPs`, which CVE-2020-8554 showed a tenant who can create Services could use to intercept other traffic. Kyverno and OPA Gatekeeper are the usual choices. Gatekeeper templates have traditionally been written in Rego; Kyverno policies are Kubernetes resources, and its current policy types use CEL, the language of the built-in ValidatingAdmissionPolicy. A registry restriction looks like this:

```yaml
apiVersion: policies.kyverno.io/v1
kind: ValidatingPolicy
metadata:
  name: restrict-image-registries
spec:
  validationActions:
  - Deny
  matchConstraints:
    resourceRules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["pods", "pods/ephemeralcontainers"]
  validations:
  - message: "Images must come from registry.example.com."
    expression: >-
      object.spec.containers.all(c, c.image.startsWith('registry.example.com/')) &&
      object.spec.?initContainers.orValue([]).all(c, c.image.startsWith('registry.example.com/')) &&
      object.spec.?ephemeralContainers.orValue([]).all(c, c.image.startsWith('registry.example.com/'))
```

Matching the `pods/ephemeralcontainers` subresource matters, because `kubectl debug` adds containers through it, and a rule on `pods` alone never sees them. Since the policy matches Pods, a bad image fails when the ReplicaSet creates the pod rather than at `kubectl apply`; Kyverno's autogen option generates policies for Deployments and other controllers to move the failure earlier. Older Kyverno releases use the `kyverno.io/v1` ClusterPolicy, which current docs mark deprecated, so check what your version supports.

**Policy as code.** Keep policies in Git and apply them through the same GitOps review as the rest of the platform, rolling new rules out with `validationActions: [Audit]` before switching to `Deny`. Mutating policies that inject default labels or security contexts help too, if kept small and documented.

## When do tenants need dedicated nodes or separate clusters?

Soft tenancy shares the kernel. For internal teams worried about accidents, that is usually acceptable with Pod Security enforced. When it is not, there are several steps up.

**Dedicated node pools.** Taint the tenant's nodes and give the tenant's pods a matching toleration plus a node selector or affinity. That keeps noisy workloads off other tenants' nodes, and a container escape lands on a node running only that tenant's pods. It does not make an escape harmless: the node still holds kubelet credentials and runs platform DaemonSets, so a compromised node remains a foothold into the shared cluster. Taints also steer scheduling but enforce nothing. A tenant can add the toleration and selector to their own pod spec and land on another tenant's pool, so the assignment has to be enforced at admission, by a policy engine, a tenant controller such as Capsule, or the PodNodeSelector and PodTolerationRestriction plugins where you control the API server.

**Sandboxed runtimes.** A RuntimeClass pointing at gVisor or Kata Containers puts a user-space kernel or a lightweight VM between the pod and the host kernel, at some cost in performance and compatibility.

**Virtual control planes.** vCluster runs a per-tenant API server inside a namespace of the host cluster, so tenants can install CRDs and cluster-scoped objects without touching the host's. In its default mode their pods still run on the host's nodes, so it isolates the control plane, not the kernel.

**Separate clusters**, for untrusted code or regulatory separation. Cluster API makes creating and upgrading them declarative, but each cluster still has its own control plane and its own upgrades to run.

## Why does manual namespace provisioning break multi-tenancy?

A common way shared clusters decay is manual namespace provisioning. Someone runs `kubectl create namespace`, applies some RBAC, forgets the NetworkPolicy and the quota, and moves on. Months later nobody can say which namespaces have which controls.

Treat namespace creation like any other infrastructure change. A team opens a pull request against a platform repository, and after review a GitOps controller creates the namespace with its full baseline:

- the Namespace, with Pod Security labels and an owning-team label
- ResourceQuota and LimitRange
- the default-deny NetworkPolicy plus the DNS and same-namespace allows
- RoleBindings for the team's identity-provider groups

With self-healing or drift correction enabled, a baseline object someone deletes by hand comes back on the next sync.

The other slow failure is RBAC drift. People are added to groups for one-off access and never removed, and bindings outlive their projects, because RBAC expires nothing on its own. Bindings in Git and group-based access help; a regular access review, scheduled from day one, catches the rest.

## Should you use Capsule or build your own tenant layer?

Building the namespace controller, policy distribution and quota management yourself is a lot of undifferentiated work, so it is reasonable to say you would evaluate an existing project first.

Capsule provides an existing tenant layer. Its cluster-scoped Tenant resource groups namespaces under a set of owners and lets those owners create namespaces themselves, which plain RBAC cannot safely allow. Constraints set on the tenant apply to every namespace it owns:

```yaml
apiVersion: capsule.clastix.io/v1beta2
kind: Tenant
metadata:
  name: payments
spec:
  owners:
  - name: payments-team
    kind: Group
  namespaceOptions:
    quota: 5
```

`namespaceOptions.quota` caps how many namespaces the tenant can create. Capsule can also apply quotas, registry restrictions, node selectors and network policies per tenant, but that part of its API is changing: the [Capsule tenant docs](https://projectcapsule.dev/docs/tenants/) mark several older Tenant fields as legacy in favour of a rules-based model, so write those against the version you run.

The Hierarchical Namespace Controller (HNC), with RBAC and policies propagating from parent to child namespaces, used to be the other standard answer. Its upstream repository is now archived, so treat it as a design idea rather than something to deploy on a new platform.

## A checklist for the shared-cluster answer

1. Ask how much tenants trust each other, and pick namespace, node or cluster isolation from the answer.
2. A namespace per team per environment, ClusterRole templates bound per namespace, no `cluster-admin` for tenants.
3. Default-deny NetworkPolicy plus DNS and platform allows, on a CNI that enforces it.
4. ResourceQuota with LimitRange everywhere, and restricted access to high PriorityClasses.
5. Pod Security `restricted`, a policy engine for the rest, and policies in Git.
6. Dedicated nodes enforced at admission, then sandboxes, virtual control planes or separate clusters as needed.
7. Namespaces provisioned from Git, and access reviewed on a schedule.

## Interview questions this covers

- How would you design a shared Kubernetes cluster for twenty teams so they cannot affect each other?
- What is the difference between soft and hard multi-tenancy, and what decides which one you need?
- Why does a default-deny egress NetworkPolicy break DNS, and how do you fix it?
- Why does a namespace with a ResourceQuota also need a LimitRange?
- How do you stop a tenant from scheduling onto another tenant's dedicated nodes?

The [25 Kubernetes interview questions for 2026](/blog/kubernetes-interview-questions-2026) cover more of the scheduling, networking and debugging ground.

Multi-tenancy questions rarely stop at namespaces. Interviewers follow up into hostile tenants, container escapes, and how a SaaS tenancy model keeps unit economics sane. [Containers & Orchestration](/ebooks/container-orchestration-journey) has a chapter on identity, mTLS and multi-tenancy among its 52 worked questions, with follow-up chains and production war stories. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
