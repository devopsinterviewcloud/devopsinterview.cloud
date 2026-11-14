---
title: Dependency Confusion Attack - How It Works and Prevention
description: How dependency confusion attacks hijack private package names on public registries, and how to prevent them in interviews.
date: 2026-10-22
keywords: devsecops, devops interview questions, dependency confusion attack, devsecops interview questions, dependency confusion prevention, package manager security
category: devsecops
youtube: 7-6iRTQ49_Q
---

A dependency confusion attack exploits how package managers resolve names across public and private registries. It became famous after a researcher demonstrated it could hijack internal packages at dozens of major companies, so interviewers use it to check whether you understand your own build pipeline's trust boundaries.

## The answer interviewers want

Dependency confusion works like this: your company has an internal package, say `internal-auth-utils`, published only on a private registry for internal builds. An attacker figures out that name (often from a leaked `package.json`, a public GitHub repo, or a job posting) and publishes a package with the same name on a public registry like npm or PyPI, but with a much higher version number.

If your build can see both registries, like pip with `--extra-index-url` or a proxy that merges your private feed with the public one, it can pull the attacker's package instead of your real one, because those setups pick the highest version they find across all sources. That malicious package runs in your build or production environment with whatever access your pipeline has.

Prevention comes down to three things:

- **Use scoped packages** on npm (like `@yourcompany/auth-utils`) for everything internal, and map that scope to your private registry in `.npmrc` so those names never resolve against the public one.
- **Route internal names to the private registry only**, through a single trusted proxy or per-package source mapping. Listing the private registry first isn't enough: pip, for one, checks every index and picks the best version.
- **Pin exact versions in production** (`1.4.2`, not `^1.4.2` or `*`) so a higher-numbered malicious package can't silently win during a build.

On top of that, claim your company's scope or org name on the public registry where you can (an npm org, for example) so nobody else can register it. Don't count on empty placeholder packages: PyPI treats those as name squatting and removes them.

## Why interviewers ask this

This question tests whether you understand supply chain risk beyond "scan your dependencies for CVEs." It's really about whether you've thought through how your build system resolves package names and sources, which is a config detail most engineers never look at until something goes wrong. It also signals whether you think about security as a pipeline design problem, not just a tooling checkbox.

## Follow-ups to expect

- **How would you detect if this already happened to you?** Audit build logs for packages pulled from unexpected registries or sources, and check for any internal package names that resolve to a public registry at all.
- **What's the risk if you only pin versions but don't control registry sources?** A pinned version still won't protect you if the public registry also has that exact name and version, since a resolver that can see both has no reason to prefer yours. Pin hashes too, and limit where each package can come from.
- **Why do scoped packages help specifically?** Scopes let you bind a namespace to a registry in the package manager config, which removes the ambiguity that makes name collision possible in the first place.

## The common wrong answer

Candidates usually describe this as "just a version of typosquatting" and answer with generic advice like "use a lockfile" or "scan for malware," without explaining the actual mechanism: that it's about which source your resolver trusts for a given name, not a naming trick, and that a lockfile only helps if it was generated from the right source in the first place.
