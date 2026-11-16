---
title: Argo CD Interview Questions and Answers
description: Argo CD interview questions for experienced engineers on sync, self-heal and prune, OutOfSync apps, app-of-apps, ApplicationSets, multi-cluster and secrets.
date: 2026-11-16
keywords: argo cd interview questions, argo cd interview questions and answers, argocd interview questions for experienced, argo cd scenario based interview questions, argocd outofsync, gitops interview questions
topic_id: K04
---

Argo CD interview questions usually start with a definition and end in an incident. "What does Argo CD do?" turns into "why does this app say OutOfSync when the pods are fine?", then "self-heal just reverted a fix someone made by hand during an outage, now what?". The questions below follow that path through sync, self-heal and prune, drift, sync waves and hooks, app-of-apps and ApplicationSets, multi-cluster setups and secrets. Defaults and commands are from the Argo CD 3.x docs. For where GitOps fits in a wider prep plan, see the [DevOps interview preparation roadmap](/blog/devops-interview-preparation-roadmap).

## Argo CD interview questions on the basics

### 1. How does Argo CD decide what to deploy, and how often does it check?

Every app is an `Application` resource: a source (repo, revision and path), a destination (cluster and namespace) and the project that limits both. The repo server renders the source into plain manifests, whether it holds Helm, Kustomize or plain YAML, and the application controller compares the result with what is running.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments
  namespace: argocd
spec:
  project: payments
  source:
    repoURL: https://github.com/acme/deploy.git
    targetRevision: main
    path: apps/payments/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: payments
```

By default the controller checks every 120 seconds plus up to 60 seconds of jitter, so a merged change can wait up to three minutes. A Git webhook removes that delay. If the API server is public, the docs recommend a webhook secret to stop floods of fake events.

## Why does an Argo CD app show OutOfSync?

### 2. The app shows OutOfSync but the pods look healthy. What does that tell you?

Sync status and health status are separate checks. Sync status asks whether the live objects match what Git renders. Health asks whether they work, using built-in checks for common kinds (a Deployment counts as healthy once its rollout has finished) and Lua checks for custom resources. Healthy and OutOfSync together is common: everything runs, and one field on one resource differs from Git.

Find the field before deciding anything:

```bash
argocd app diff payments                 # exit code 1 means a diff was found
argocd app diff payments --hard-refresh  # re-render, skipping the manifest cache
```

The usual causes:

- **Someone changed the live object** with `kubectl edit` or `kubectl scale`. That is real drift: put the change in Git or let a sync undo it.
- **A controller or mutating webhook rewrites the object** after it is applied. The diffing docs name the HPA controller, which reorders `spec.metrics`.
- **Git and an autoscaler both set replicas.** If the manifest says `replicas: 3` and the HPA has scaled to eight, the app is OutOfSync. The Kubernetes docs recommend removing `spec.replicas` from the manifest once an HPA manages it, and on a live workload they give migration steps, because simply dropping a previously applied `spec.replicas` can scale it down to one replica.
- **The render changes every time.** Helm functions such as `randAlphaNum` produce new output on each render, so Git never matches.
- **A resource was deleted from Git and prune is off.** The app stays OutOfSync until something deletes the object.

Status fields aren't on the list. Since 3.0, Argo CD ignores `status` differences on every resource by default; in 2.x the default covered only CustomResourceDefinition objects.

### 3. How do you make Argo CD accept a difference it should ignore?

First decide whether the difference is expected. If it's drift, fix Git or sync. If another controller owns the field and you can't drop it from the manifest, say a third-party chart that always sets replicas, tell Argo CD to ignore it:

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
    - group: admissionregistration.k8s.io
      kind: MutatingWebhookConfiguration
      jqPathExpressions:
        - .webhooks[]?.clientConfig.caBundle
  syncPolicy:
    syncOptions:
      - RespectIgnoreDifferences=true
```

`ignoreDifferences` on its own only changes the comparison, and a sync still writes the Git value over what the controller set. `RespectIgnoreDifferences=true` carries the rule into the sync, for resources that already exist. A third option, `managedFieldsManagers`, ignores every field owned by a named manager such as `kube-controller-manager`. Rules for every app go in `resource.customizations` in the `argocd-cm` ConfigMap.

The other lever is the diff strategy. The default is a three-way diff of live state, desired state and the `last-applied-configuration` annotation. Server-side diff, stable since 3.1, runs a server-side apply in dry-run mode and compares against the predicted result, so admission controllers take part in the calculation. Changes made by mutating webhooks are left out unless you add `IncludeMutationWebhook=true`. Enable it per app with the `argocd.argoproj.io/compare-options: ServerSideDiff=true` annotation, or globally with `controller.diff.server.side: "true"` in `argocd-cmd-params-cm` and a restart of the application controller.

## Sync, self-heal and prune

### 4. What do automated sync, self-heal and prune each do?

| Setting | What it does | Default |
|---|---|---|
| `automated` | Syncs when the app is OutOfSync because Git or the app's parameters changed | Off (manual sync) |
| `selfHeal` | Also re-syncs when live state drifts with no Git change, after a 5-second timeout | Off |
| `prune` | Deletes resources that are no longer in Git | Off |
| `allowEmpty` | Lets an automated sync with prune remove everything when the source renders empty | Off |

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
  retry:
    limit: 5
    backoff:
      duration: 10s
      factor: 2
      maxDuration: 3m
```

The usual follow-up is a failed sync. Automated sync makes one attempt per commit SHA and parameter set, and if that attempt fails it doesn't try the same commit again. The `retry` block is what retries a failed sync, with exponential backoff.

### 5. Self-heal reverted a fix someone applied with kubectl during an incident. What should happen?

Self-heal did its job: Git said one thing, the cluster another, and Argo CD put Git back. What's missing is a documented emergency procedure.

The durable path goes through Git: commit the fix or revert the bad change, and let the sync apply it. The [GitOps rollback question page](/questions/gitops-rollback-how-to-revert-a-bad-deploy) covers revert versus roll forward. If the live change can't wait for a merge, switch that one app to manual first, make the change, land it in Git, then switch automation back on:

```bash
argocd app set payments --sync-policy manual
# make the emergency change, then merge it to Git
argocd app set payments --sync-policy automated --self-heal --auto-prune
```

That works for a standalone Application. If an ApplicationSet generated the app, its controller patches the Application back to the template, which can switch automation on again mid-incident. Either change the template, or add `ignoreApplicationDifferences` for `/spec/syncPolicy` to the ApplicationSet ahead of time so a temporary toggle sticks. Confirm automation is off before touching the cluster.

`argocd app rollback` refuses to run while automated sync is on, and afterwards the app shows OutOfSync until Git catches up. Put the procedure in the incident runbook so nobody learns about self-heal during an outage.

Self-heal only reverts objects the app manages; a Deployment created by hand is invisible to it. Orphaned resource monitoring (`orphanedResources: {warn: true}` in the AppProject) flags namespaced objects no app owns. The post on [locking down Kubernetes RBAC](/blog/kubernetes-rbac-least-privilege-lockdown) makes the same point about bindings created out of band.

### 6. How do you run prune safely in production?

Prune is what makes Git the full record: delete a manifest and the object goes. The risk is a bad commit or broken overlay that deletes things you needed. The guardrails:

- Leave `allowEmpty` off, so a source that renders to nothing can't empty the app.
- Annotate objects that must not be pruned automatically with `argocd.argoproj.io/sync-options: Prune=false`, or `Prune=confirm` to require approval. Candidates are PVCs holding data, shared namespaces, and CRDs, since deleting a CRD deletes every custom resource of that type.
- Pruning and app deletion are separate. `Prune=false` doesn't stop a cascading delete of the whole Application. `Delete=false` keeps a resource, such as a PVC, when its app is deleted; `Delete=confirm` deletes it only after approval.
- `PruneLast=true` prunes only after every other wave has synced and is healthy, so the replacement is up first.
- `FailOnSharedResource=true` fails a sync if another Application already applied the same resource.
- Make deletions visible in review with a CI job that diffs the rendered manifests.

## How do you order a sync with sync waves and hooks?

### 7. A database migration has to finish before the new pods roll out. How do you set that up?

A sync runs in phases: PreSync, Sync, then PostSync once the synced resources are healthy. SyncFail runs if the sync fails, and PostDelete (2.10 and later) after an app's resources are deleted. Within a phase, Argo CD orders resources by wave (lower first, default 0, negatives allowed), then kind, then name. It applies one wave, waits until it is synced and healthy, then moves on.

A migration fits as a PreSync hook:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: payments-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: ghcr.io/acme/payments-migrate:1.42.0
          args: ["migrate", "up"]
```

If a PreSync hook fails, the sync stops and is marked failed, so the new pods never roll out. The points that come up next:

- **Hooks run on every sync**, not only when the migration changed, so it must be safe to run twice. They don't run during a selective sync.
- **Old pods keep serving** during the migration and the rollout, so the schema has to work with both versions. That is the expand and contract pattern.
- **BeforeHookCreation** is what Argo CD assumes when no policy is set. It deletes the previous Job just before creating the new one, so the last run's logs stay around until the next sync.

## App-of-apps or ApplicationSets?

### 8. When would you use app-of-apps, and what catches people out?

App-of-apps is a parent Application whose source is a directory or chart of Application manifests; syncing the parent creates the children. It suits bootstrapping a cluster's fixed platform set (ingress, cert-manager, monitoring), where every child is a reviewed file. Three catches:

- **Child health isn't reported by default.** Health assessment for Application resources was removed in 1.8, so a parent won't wait for wave -1 children to become healthy before creating wave 0. Restore it with a `resource.customizations.health.argoproj.io_Application` Lua check in `argocd-cm`.
- **Deletion needs a finalizer.** Add `resources-finalizer.argocd.argoproj.io` to each child so deleting it removes its resources, not just the Application object.
- **The parent's repo is an admin boundary.** Creating Applications in any project is an admin-level capability, so only admins should push to it.

### 9. How do ApplicationSets work, and how do you keep them safe?

An ApplicationSet is a template plus generators. Each generator produces parameter sets, and the controller renders one Application per set. Generators include List, Cluster, Git, Matrix and Merge, SCM Provider and Pull Request. This one deploys payments to every cluster labelled `env: prod`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: payments
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
    - clusters:
        selector:
          matchLabels:
            env: prod
  template:
    metadata:
      name: 'payments-{{.name}}'
    spec:
      project: payments
      source:
        repoURL: https://github.com/acme/deploy.git
        targetRevision: main
        path: apps/payments/prod
      destination:
        server: '{{.server}}'
        namespace: payments
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

Register a cluster with that label and its Application appears. The [ApplicationSets question page](/questions/argocd-application-sets-multi-cluster-deployment) covers matrix generators for per-environment config. The controls interviewers probe:

- **What the controller may change.** `applicationsSync` takes `create-only`, `create-update`, `create-delete` or the default `sync`. A controller-level `--policy` flag wins unless policy override is enabled.
- **What happens on removal.** When a cluster drops out of the generator, its Application is deleted and by default its workloads go too. `preserveResourcesOnDeletion: true` keeps them running.
- **Gradual rollout.** Progressive syncs, beta since 3.3 and off until enabled, use RollingSync to update groups of generated apps by label, with `maxUpdate` per group. RollingSync forces autosync off on those apps.
- **Who can create them.** Only admins, because an ApplicationSet can create Applications in any project. If `project` is templated from a generator, anyone who can write that generator's source can pick a looser project.

## How do you run Argo CD across many clusters?

### 10. Would you run one Argo CD for every cluster, or one per cluster?

| | One central Argo CD (hub) | Argo CD in each cluster |
|---|---|---|
| UI and RBAC | One UI, one set of projects | One per cluster |
| Credentials | Hub holds credentials for every cluster | Each instance touches only its own cluster |
| Network | Hub must reach every API server | Each cluster pulls from Git itself |
| If Argo CD is compromised | Attacker can reach every registered cluster | Attacker reaches one cluster |
| Operations | One install; shard the controller as it grows | Many installs to upgrade and monitor |

The compromise row is about Argo CD itself. A bad commit reaches every instance tracking its path, wherever Argo CD runs.

A common middle ground is one instance per environment or region, so production credentials never sit with dev. On a hub, clusters are Secrets labelled `argocd.argoproj.io/secret-type: cluster`; for EKS, use `awsAuthConfig` with IRSA or EKS Pod Identity rather than long-lived tokens. When one controller can't keep up, scale the application controller StatefulSet and set `ARGOCD_CONTROLLER_REPLICAS` to match, and clusters are spread across the replicas.

## How do you handle secrets and access in Argo CD?

### 11. How do you get secrets into the cluster without committing plaintext to Git?

The Argo CD docs strongly recommend letting the destination cluster populate secrets rather than having Argo CD inject them while rendering manifests. The options:

- **Sealed Secrets.** Commit an encrypted SealedSecret that only the controller in the cluster can decrypt.
- **External Secrets Operator or Vault Secrets Operator.** Commit a reference; the operator reads the value from the store and writes a Kubernetes Secret. The [External Secrets Operator question page](/questions/external-secrets-operator-sync-vault-to-kubernetes) walks through the Vault setup.
- **Secrets Store CSI Driver.** Mount values from the store into pods as a volume.

Plugins such as argocd-vault-plugin inject values during manifest generation, and the docs caution against it: Argo CD needs access to the secrets, generated manifests sit in plaintext in its Redis cache, and rotating a secret needs a sync.

### 12. If Git is the deploy authority, how do you lock Git and Argo CD down?

- **Protect the tracked branches** with required reviews and CODEOWNERS on production paths. Anyone who can merge there can deploy.
- **Keep real workloads out of the `default` project**, which permits any repo, any cluster and every kind. Give each team an AppProject that limits `sourceRepos`, `destinations` and cluster-scoped kinds (`clusterResourceWhitelist`), mirroring the per-team layout in [designing a shared Kubernetes cluster](/blog/kubernetes-multi-tenancy-shared-cluster-design).
- **Don't let workload projects target Argo CD's own namespace.** A project whose `destinations` include it effectively grants its Applications admin rights.
- **Recheck RBAC after a 3.0 upgrade.** `update` and `delete` on an Application no longer extend to its managed resources, and logs need an explicit `logs, get` permission.

## Interview questions this covers

- An Argo CD app shows OutOfSync but the pods are healthy. What does that mean, and how do you fix it?
- What do self-heal and prune do, and how do you run them safely in production?
- How do you make a database migration run before a rollout with sync waves and hooks?
- When do you use app-of-apps, and when ApplicationSets?
- How do you handle secrets with Argo CD without committing plaintext to Git?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

Senior GitOps rounds go further: structuring GitOps for dozens of clusters and teams, using it to satisfy audit requirements in a regulated environment, and running canaries that promote or abort themselves on metrics. [CI/CD & GitOps: Pipelines, GitOps & Progressive Delivery Interview Questions](/ebooks/modern-cicd-gitops) works through 50 senior-level questions with worked answers, including a chapter on GitOps and continuous deployment with Argo CD and Flux. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework.
