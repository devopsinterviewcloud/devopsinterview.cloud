---
title: Debugging a Kubernetes Production Incident, Step by Step
description: A production Kubernetes incident debugged end to end: CrashLoopBackOff, OOMKilled, the stale ConfigMap trap, and ephemeral containers for distroless images.
date: 2026-08-05
keywords: kubernetes troubleshooting, crashloopbackoff fix, kubernetes debugging, kubectl debug commands, oomkilled kubernetes, kubernetes interview questions
---

It is 3AM. PagerDuty goes off. The payment service is down in production, and the first thing you type into the terminal says more about your seniority than anything on your CV. "Walk me through how you would debug it" is one of the most common senior DevOps and SRE interview questions precisely because it cannot be memorised: interviewers are listening for a repeatable mental model, not a list of commands.

This post walks one realistic incident end to end, the way you would narrate it in an interview or actually run it during an outage. If you prefer watching it as a live terminal walkthrough, the video version covers the same incident:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/EbGMrpZi7IE" title="K8s Production Debug: Live Incident Walk" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## The incident

Your team deployed a new version of the payment service 45 minutes ago. Three replicas, but only one pod is serving traffic. Users are hitting 503s. You have kubectl access to the prod cluster, no dashboards pre-loaded, and no runbook for this specific failure. Go.

## Step 1: start wide, not deep

The first rule of production debugging: start at the cluster level, not the pod level. Engineers who jump straight into the logs of the first broken pod they see routinely spend 20 minutes on the wrong pod.

```
$ kubectl get pods -n prod
NAME                       READY   STATUS             RESTARTS   AGE
payment-7d9f8b6c4-xk2lp    1/1     Running            0          44m
payment-7d9f8b6c4-r8tnv    0/1     CrashLoopBackOff   7          44m
payment-7d9f8b6c4-9wqmz    0/1     CrashLoopBackOff   3          44m
```

This one view already tells a story. The restart counts mean the containers are coming up and dying repeatedly, which is a different failure from a pod that never scheduled at all. And each status points down a different road: `ImagePullBackOff` means the image tag does not exist or registry credentials are wrong; `Pending` means scheduling or resource starvation; `CrashLoopBackOff` means the container starts and then exits. Know which road you are on before you start walking.

## Step 2: read the exit code before reading a single log line

`kubectl describe pod` is where the real story lives, and most people scroll straight past the most valuable field in its output: **Last State**. It shows what happened on the previous run, before the restart.

```
$ kubectl describe pod payment-7d9f8b6c4-r8tnv -n prod
...
Last State:     Terminated
  Reason:       Error
  Exit Code:    1
  Finished:     Mon, 03 Aug 2026 03:12:46 +0000
Restart Count:  7
Events:
  Warning  BackOff   2m (x6 over 10m)   kubelet   Back-off restarting failed container
```

Exit code 1 is a generic application failure: the process itself decided to exit. Exit code 137 means the process was killed with SIGKILL, and the usual suspects are the OOM killer or a forced termination after the grace period expired; it is the `Reason: OOMKilled` field and the accompanying events, not the number alone, that confirm memory. The distinction matters because the two problems in our incident need completely different fixes, and the exit code narrows the search dramatically before you have read a single log line.

## Step 3: pull logs from the container that already died

Here is the first trap. If you run `kubectl logs` against a crash-looping pod, you often get the logs of the freshly restarted container, which has not failed yet, so the output looks clean. You need the previous, dead container:

```
$ kubectl logs payment-7d9f8b6c4-r8tnv -n prod --previous | grep -iE "error|fatal|panic"
ERROR failed to acquire db connection: dial tcp 10.0.1.55:5432: connect: connection refused
ERROR max retries exceeded, shutting down
panic: runtime error: invalid memory address or nil pointer dereference
main.initDBPool(0xc0001a4000)
```

That is the smoking gun for the crashing pod: the new release changed the database connection pool code and it cannot reach the database it was configured for. Two other places people forget to look:

- **Init containers.** They run before the app container and can fail quietly. `kubectl logs <pod> -c <init-container-name>` shows them.
- **All replicas at once.** With ten replicas you rarely know which pod to watch. [stern](https://github.com/stern/stern) streams colour-coded logs from every pod matching a selector (`stern payment -n prod`), so the misbehaving replica identifies itself.

## Step 4: resource forensics for the OOMKilled pod

The second broken pod is dying with `Reason: OOMKilled` and exit code 137. The decisive evidence is in `kubectl describe`: the termination reason next to the limits block. `kubectl top pod -n prod` adds corroboration from live usage, with two caveats worth saying out loud in an interview: it needs the Metrics Server installed, and its readings lag by up to a minute, so a brief startup spike (exactly our failure mode) may never appear in it.

```
$ kubectl describe pod payment-7d9f8b6c4-9wqmz -n prod | grep -A4 Limits
    Limits:
      memory:  256Mi
    Requests:
      memory:  128Mi
```

The new release loads a larger in-memory cache on startup, crosses 256Mi, and the kernel kills it. The triage question interviewers want you to ask out loud: is this a legitimate new requirement (raise the limit) or a leak introduced by this build (roll back)? Raising limits blindly is the classic wrong answer; it masks leaks until the node itself runs out of allocatable memory, at which point the blast radius is every pod on that node instead of one deployment.

## Step 5: confirm the timeline, then stop the bleeding

Before acting, verify that the deploy actually caused this:

```
$ kubectl get events -n prod --sort-by=.metadata.creationTimestamp
$ kubectl rollout history deployment/payment -n prod
REVISION  CHANGE-CAUSE
7         <none>
8         <none>
```

A detail that reads as real experience: `CHANGE-CAUSE` is empty unless your deploy tooling sets the `kubernetes.io/change-cause` annotation, so in most clusters you correlate revisions with images via `kubectl rollout history deployment/payment --revision=8` instead. Either way, revision 8 went out 44 minutes ago, exactly when the failures started. `kubectl rollout undo deployment/payment -n prod` starts the rollback to the previous revision; watch it complete with `kubectl rollout status`, since the actual recovery time depends on image pulls and readiness probes. The framing matters in interviews: rollback is a deliberate decision to restore service while the fix lands, not a panic button. Say it that way.

## The gotcha that quietly eats debugging time: stale ConfigMap values

Environment variables injected from ConfigMaps or Secrets are baked in at pod startup. Updating the ConfigMap does nothing to running pods; they keep the old values until they restart. The failure mode is maddening because every individual check looks correct:

```
$ kubectl get configmap payment-config -n prod -o jsonpath='{.data.DB_HOST}'
10.0.1.99        # the new, correct value

$ kubectl exec payment-7d9f8b6c4-xk2lp -n prod -- env | grep DB_HOST
DB_HOST=10.0.1.55   # what the running pod actually has
```

Checking what the running process actually sees, rather than what the manifest says it should see, resolves an outsized share of "but the config is right" incidents. (Volume-mounted ConfigMaps normally do update in place after a delay, with one exception: `subPath` mounts never receive updates. And env vars never do, while apps rarely re-read files without a restart anyway.)

## Ephemeral containers: debugging images that have no shell

Production images are increasingly distroless or heavily slimmed: no shell, no curl, nothing to `kubectl exec` into. The old workaround was rebuilding the image with debug tools and redeploying, and hoping the bug still reproduced. Ephemeral containers (stable since Kubernetes 1.25) end that:

```
$ kubectl debug -it payment-7d9f8b6c4-xk2lp -n prod --image=busybox --target=payment
/ # wget -qO- localhost:8080/health
{"status":"ok","db":"disconnected","version":"1.8.0"}
```

`kubectl debug` injects a temporary busybox container into the running pod. It always shares the pod's network namespace, so local ports and connectivity are testable immediately; seeing the target's processes via `--target` additionally requires process namespace sharing support from the container runtime, which is the norm on current containerd but worth stating as an assumption. Either way, you get real tools inside a shell-less pod without touching the application container or rebuilding the image.

## The playbook

1. Cluster-wide view first: `kubectl get pods` and read statuses plus restart counts.
2. Exit codes and termination reasons from `describe` choose the debugging path: 1 is an app-level failure, 137 is SIGKILL, and `Reason: OOMKilled` confirms memory.
3. `kubectl logs --previous` for containers that already died; remember init containers.
4. Compare limits against live usage before deciding raise-versus-rollback.
5. Verify the timeline with events and rollout history, then roll back deliberately.
6. Check what running pods actually have in their environment, not what the ConfigMap says.
7. `kubectl debug` with ephemeral containers when there is no shell to exec into.

Interviewers are not scoring the commands. They are scoring whether a structured model shows up under pressure, because that is exactly what 3AM tests.

If you want this depth across the whole container stack, with 100+ worked questions, follow-up chains and production war stories for Docker and Kubernetes, that is what [Container Orchestration Journey: Docker to Kubernetes](/ebooks/container-orchestration-journey) covers. It is one of the five books in the [Complete DevOps Mastery Bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
