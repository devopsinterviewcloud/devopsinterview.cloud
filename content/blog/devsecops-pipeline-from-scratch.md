---
title: DevSecOps Pipeline from Scratch: Gates That Block Bad Code
description: Build a DevSecOps pipeline from scratch: secrets scanning, Semgrep SAST, Trivy dependency and image scans, Cosign signing and Kyverno admission gates.
date: 2026-10-24
keywords: devsecops pipeline, build devsecops pipeline from scratch, sast sca container scanning, kyverno image signature verification, cosign image signing, devsecops interview questions
source_video_id: njqv0sqVie0
---

"We want to shift security left. Walk me through how you would build a DevSecOps pipeline from scratch for a Kubernetes-based microservices stack." Naming tools does not answer it. The interviewer wants to know why each layer of the pipeline exists, what it catches, what it misses, and where it blocks a change instead of warning about it. This post builds that answer layer by layer, with configuration you can adapt.

The video version covers the same pipeline if you prefer to watch it:

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1.5rem 0">
  <iframe src="https://www.youtube-nocookie.com/embed/njqv0sqVie0" title="DevSecOps Pipeline: Build It From Scratch" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe>
</div>

## Why do security scans fail to block releases?

A familiar failure goes like this. A team runs a dependency scanner in CI for months. It reports hundreds of findings, none of them fail a build, and the results go out as a weekly report that developers never open. Then a known critical CVE in a transitive dependency gets exploited, and the scanner had been flagging it for weeks.

Scanning without enforcement is expensive logging. What an interviewer wants to hear is what actually stops a known-bad change from reaching production. Each layer below has a job, a set of blind spots and a specific enforcement point.

## What are the layers of a DevSecOps pipeline?

| Layer | Where it runs | What it catches | Enforcement point |
|---|---|---|---|
| Secrets detection | Pre-commit hook, then CI | Keys, tokens and passwords in commits | Required CI check |
| SAST | Every pull request | Injection flaws and insecure patterns in your own code | Required CI check |
| SCA | Every pull request | Known CVEs in direct and transitive dependencies | Required CI check |
| Image scanning and signing | After the build | CVEs in OS packages and app dependencies inside the image | Build fails; only passing images get signed |
| Admission control | Kubernetes API server | Unsigned images, privileged or root pods | The API server rejects the pod |

The layers overlap on purpose. SAST reads the code you wrote, including how it calls libraries, but it does not check those libraries for known CVEs. SCA knows the libraries but not your logic. Image scanning sees the OS packages in the base image, which neither of the first two looks at. Admission control is the only layer that still applies when someone skips CI and runs `kubectl apply` by hand.

## How do you add secrets scanning and SAST to pull requests?

Secrets detection starts on the developer's laptop with a pre-commit hook; gitleaks ships one (`id: gitleaks` in `.pre-commit-config.yaml`). Treat the hook as a convenience. Anyone can skip it with `git commit --no-verify`, so the enforcing copy of the scan runs in CI.

This workflow runs Semgrep and gitleaks as parallel jobs on every pull request:

```yaml
name: pr-security
on: pull_request
permissions:
  contents: read
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Semgrep (new findings only)
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
        run: |
          pipx install semgrep==1.181.0
          semgrep scan --config p/owasp-top-ten --error --baseline-commit "$BASE_SHA"
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - name: Gitleaks (commits in this PR)
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          curl -sSfLO https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
          echo "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb  gitleaks_8.30.1_linux_x64.tar.gz" | sha256sum -c -
          tar -xzf gitleaks_8.30.1_linux_x64.tar.gz gitleaks
          ./gitleaks git --redact --log-opts="$BASE_SHA..$HEAD_SHA" .
```

What to point out when you walk through it:

- **A red check only blocks if it is required.** Mark both jobs as required status checks in branch protection or a ruleset. Otherwise the failure is a warning label and you are back to expensive logging.
- **`--error` is what makes Semgrep a gate.** `semgrep scan` exits 0 on findings by default; `--error` makes it exit 1. The old `returntocorp/semgrep-action` wrapper is deprecated, so the job installs the CLI directly.
- **`--baseline-commit` reports only new findings.** A team adopting Semgrep on an old codebase is not blocked by years of existing debt. That debt still needs tracking, just not in the merge gate.
- **`fetch-depth: 0` is the simplest reliable choice.** The checkout default of a single commit has neither the base commit Semgrep compares against nor the commit range gitleaks walks.
- **Gitleaks scans each commit, not only the final files.** `gitleaks git` with `--log-opts` reads every commit in the range, so a key added in one commit and deleted in the next is still caught, and it exits 1 on a leak. The CLI needs no license key or repository secrets, so it also runs on pull requests from forks. If a secret does reach a shared branch, rotate it; rewriting history does not un-leak it.
- **Pin what the gate runs.** The workflow pins the Semgrep version and checks the gitleaks download against a known SHA-256. In production, also pin actions to full commit SHAs, and keep in mind that a registry ruleset like `p/owasp-top-ten` can change between runs unless you vendor it.

These two jobs cover mistakes developers introduce. Vulnerable libraries are the next layer.

## How do you scan dependencies and container images with Trivy?

Trivy handles both SCA and image scanning. Pointed at the repository, `trivy fs` reads lockfiles, so transitive dependencies pinned there are covered. It needs no build, so it can run in parallel with SAST:

```bash
trivy fs --scanners vuln --severity CRITICAL --exit-code 1 --ignore-unfixed .
```

After the build, `trivy image` scans what actually ships: the OS packages from the base image plus the application dependencies inside it. The order of the next steps matters. Cosign signs an image that already exists in a registry, so the push comes before signing, and you sign the immutable digest rather than a tag that can be moved. `set -euo pipefail` makes the script stop at the first failing command, so a failed scan never reaches the push:

```bash
set -euo pipefail
IMAGE="registry.example.com/myapp:${GIT_SHA}"
docker build -t "$IMAGE" .

# Gate: fail on CRITICAL CVEs that have a fixed version
trivy image --exit-code 1 --severity CRITICAL --ignore-unfixed "$IMAGE"

# Push only after the scan passes, then sign the pushed digest
docker push "$IMAGE"
DIGEST=$(docker inspect --format '{{index .RepoDigests 0}}' "$IMAGE")
cosign sign --yes --key env://COSIGN_PRIVATE_KEY "$DIGEST"
```

`cosign generate-key-pair` encrypts the private key, so the job also needs `COSIGN_PASSWORD` in its environment; store both as protected CI secrets. `--yes` only skips the confirmation prompt.

Each Trivy flag needs a reason you can defend:

- `--exit-code 1` is the gate. Without it, Trivy exits 0 even when it finds vulnerabilities, and without `set -e` the script carries on regardless.
- `--ignore-unfixed` reports only vulnerabilities that have a fixed version, so the build only fails on problems an upgrade can solve. That keeps the gate actionable, but the unfixed findings still need an owner. Run a second, non-blocking scan that writes a full JSON report and track those findings outside the gate.

Image scanning covers userspace packages. Containers share the host's kernel, so kernel vulnerabilities get fixed by patching nodes, not by rebuilding images.

The base image decides how much there is to scan in the first place. Non-debug distroless images contain no shell and no package manager, which removes a lot of attack surface and makes scan reports much shorter. `gcr.io/distroless/static-debian13` only suits statically linked binaries, such as a Go service built with `CGO_ENABLED=0`; interpreted languages need the matching distroless runtime image, pinned by digest. The [multi-stage build and distroless guide](/blog/docker-image-optimization-multi-stage-builds) covers those trade-offs.

## How do you block unsigned images at Kubernetes admission?

Signing is only useful if something checks the signature. The admission layer rejects pods whose images from your registry lack a valid signature from the pipeline key, which also catches an image someone built on a laptop and pushed by hand.

Be precise about what a passing check proves. A Cosign signature shows that the holder of the private key signed that exact digest. It only means "this image passed the scan" if the key is available exclusively to the protected CI job that runs the gate. If you need the scan result itself to be verifiable, publish it as a signed attestation and verify that too.

As of Kyverno 1.19, `ClusterPolicy` is deprecated, and `ImageValidatingPolicy` replaces its `verifyImages` rules:

```yaml
apiVersion: policies.kyverno.io/v1
kind: ImageValidatingPolicy
metadata:
  name: require-signed-images
spec:
  validationActions: [Deny]
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
      - apiGroups: ['']
        apiVersions: ['v1']
        operations: ['CREATE', 'UPDATE']
        resources: ['pods']
  matchImageReferences:
    - glob: 'registry.example.com/*'
  attestors:
    - name: cosign
      cosign:
        key:
          data: |
            -----BEGIN PUBLIC KEY-----
            (contents of cosign.pub)
            -----END PUBLIC KEY-----
  validations:
    - expression: >-
        (images.containers + images.?initContainers.orValue([]))
        .map(image, verifyImageSignatures(image, [attestors.cosign]))
        .all(e, e > 0)
      message: image is not signed with the pipeline key
```

The details that decide whether this is a real gate:

- **`validationActions: [Deny]` is the point.** With `[Audit]` the pod is admitted and the violation only shows up in a report, which is the scanning-without-enforcement problem moved into the cluster. Starting in Audit to find what would break is a sensible rollout, as long as there is a date for switching to Deny.
- **Init containers are verified too.** The expression runs the signature check on init container images as well as `images.containers`.
- **Tags get pinned to digests.** By default (`mutateDigest`), Kyverno rewrites a matched image tag to the digest it resolved, so the node runs the digest that was checked even if someone moves the tag afterwards.
- **Other registries are not checked at all.** `matchImageReferences` limits the policy to images under your registry, so an unsigned image from Docker Hub never reaches the signature check. Pair this with a policy that only allows images from your registry.
- **Some namespaces are exempt.** The default Helm install excludes `kube-system` and Kyverno's own namespace from its webhooks, so pods created there are never checked. Keep pod creation in those namespaces limited to cluster admins.
- **Ephemeral containers take a separate path.** Containers added with `kubectl debug` arrive through the `pods/ephemeralcontainers` subresource, which a `pods` match does not cover. Restrict who can use that subresource with RBAC.
- **Test it against your real registry.** Kyverno reads signatures from the registry itself, so a private registry needs a `credentials` block: a supported cloud credential provider, or a registry secret in the Kyverno namespace. Cosign 3 also writes signatures in the newer Sigstore bundle format by default, so confirm your Kyverno version verifies what your Cosign version writes. Then prove the gate: deploy an unsigned image and watch it get rejected.

Signature checks say nothing about how a pod runs. For non-root containers, no privileged mode, no privilege escalation and dropped capabilities, the built-in Pod Security Admission `restricted` profile is the simplest gate:

```bash
kubectl label namespace production pod-security.kubernetes.io/enforce=restricted
```

`restricted` does not require a read-only root filesystem. If you want that, add a Kyverno or OPA Gatekeeper rule for `readOnlyRootFilesystem: true`. Gatekeeper handles pod and registry rules like these well, but it does not verify Cosign signatures on its own; that needs an external data provider such as Ratify. Admission policy works alongside access control, which the [Kubernetes RBAC least-privilege guide](/blog/kubernetes-rbac-least-privilege-lockdown) covers, and the [shared-cluster multi-tenancy design](/blog/kubernetes-multi-tenancy-shared-cluster-design) shows how these policies fit a cluster with many teams.

## How do you keep security scans from slowing down CI?

Every layer adds time to a pull request, and a slow pipeline gets bypassed. The main levers:

- **Run independent layers in parallel.** SAST, secrets scanning and `trivy fs` need nothing but the source. Only the image scan waits for the build.
- **Cache the Trivy database.** It is rebuilt every six hours, so downloading it on every run is wasted time. Persist a directory between runs and point Trivy at it with `--cache-dir`.
- **Keep SAST diff-aware.** A gate that fails on findings the pull request did not introduce trains developers to ignore it. `--baseline-commit` keeps the report to new findings.
- **Agree the severity threshold as a team.** Blocking only on CRITICAL lets serious HIGH findings through. Blocking on HIGH and above creates friction, because plenty of HIGH CVEs sit in transitive dependencies with no reachable exploit path. Decide it together, with an exceptions process, rather than leaving it to whoever writes the workflow.

## What does a DevSecOps pipeline miss after deployment?

**Images that were clean when they shipped.** A scan is a point-in-time result. New CVEs are disclosed against packages your image already contains, and the image never picks up upstream base image patches until you rebuild it. If the base is pinned by digest, rebuilding alone changes nothing: bump the digest when upstream publishes a patched build (a dependency bot such as Renovate can open those pull requests), then rebuild. With a mutable tag, `docker build --pull` fetches the current base. Either way, keep scanning what is actually running. Trivy Operator runs in the cluster, scans the images your workloads use and stores the results as `VulnerabilityReport` resources. Reports expire after a TTL (24 hours by default) and are regenerated, which is how newly disclosed CVEs show up:

```bash
kubectl get vulnerabilityreports -n production -o wide
```

**Secrets that never touch the repository.** The secrets and SAST jobs above only see what is in the repository. A database password in a Helm values file kept outside the repo, or pasted into a ConfigMap, is invisible to them. That needs a different control: keep secrets in Vault or a cloud secrets manager, sync them into Kubernetes Secrets with the External Secrets Operator, and enable encryption at rest for Secrets in etcd.

**Gates nobody has tested.** Make each gate fail at least once on purpose: open a pull request containing a dummy credential that matches a gitleaks rule, push an unsigned image and try to run it. A gate you have never seen block anything may still be in Audit mode.

## Why generate an SBOM for every image?

A software bill of materials lists the packages in an image, as far as the generator can detect them; vendored or statically compiled code can slip past. Syft generates one in CycloneDX or SPDX format, and Cosign attaches it to the image as a signed attestation. The older `cosign attach sbom` route is deprecated.

```bash
syft "$DIGEST" -o cyclonedx-json > sbom.cdx.json
cosign attest --yes --key env://COSIGN_PRIVATE_KEY \
  --type cyclonedx --predicate sbom.cdx.json "$DIGEST"
```

The payoff comes when the next Log4Shell-class vulnerability is disclosed. Instead of searching every repository for log4j, you ask the stored SBOMs which images contain `log4j-core`, and at which versions:

```bash
jq -r '.components[] | select(.name == "log4j-core") | .version' sbom.cdx.json

# Match an SBOM against current vulnerability data without pulling the image
grype sbom:./sbom.cdx.json
```

One file at a time does not scale, so store SBOMs centrally. OWASP Dependency-Track is built for this, and it answers the question across every image at once.

## DevSecOps pipeline checklist

- Gitleaks as a pre-commit hook for convenience and as a required CI check for enforcement.
- Diff-aware Semgrep with `--error` on every pull request, as a required check.
- `trivy fs` on dependencies, in parallel with SAST.
- `trivy image --exit-code 1` after the build, then push and sign the digest with Cosign.
- An `ImageValidatingPolicy` in Deny mode, an allowed-registries policy, and Pod Security Admission `restricted`.
- Base image updates that trigger rebuilds, plus in-cluster rescanning of running images.
- An SBOM attestation for every image, stored where you can query it.

## Interview questions this covers

- Walk me through a DevSecOps pipeline you would build from scratch for Kubernetes microservices.
- What is the difference between SAST, SCA and image scanning, and what does each one miss?
- How do you stop unsigned images from running in a cluster, and what does a valid signature actually prove?
- An image passed its scan three weeks ago. Is it still safe to run?
- A critical CVE is disclosed in a popular library. How do you find out which production images are affected?

For more practice at this depth, try the [Kubernetes interview questions for 2026](/blog/kubernetes-interview-questions-2026) or browse [all the DevOps interview ebooks](/ebooks).

Pipeline security questions in real interviews go several follow-ups deeper: the supply chain threat model, gating releases on SBOM scans, and rolling DevSecOps out without making the security team the bottleneck. [CI/CD & GitOps](/ebooks/modern-cicd-gitops) works through 50 questions with worked answers, including chapters on pipeline and supply-chain security (SBOM, Sigstore and SLSA) and on DevSecOps and compliance as code. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a day-of checklist and behavioural answer frameworks.
