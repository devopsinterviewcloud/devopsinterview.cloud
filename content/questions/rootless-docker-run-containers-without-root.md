---
title: Rootless Docker - Run Containers Without Root
description: How to run Docker rootless so the daemon never needs root, including setup commands and the privileged-port limitation interviewers probe for.
date: 2026-10-22
updated: 2026-11-20
keywords: docker, devops interview questions, rootless docker, docker rootless mode tutorial, docker without root privileges, docker security best practices
category: docker
youtube: XYmt03WB5m4
---

A Docker daemon running as root means anything that can talk to that daemon can effectively root the host. Interviewers bring this up to see if you understand the actual attack surface of a container runtime, not just the buzzword "rootless."

## The answer interviewers want

By default, the Docker daemon runs as root, and a container breakout or a compromised daemon socket gives an attacker root on the host. Rootless Docker fixes this by running the daemon itself as a regular, unprivileged user. Your containers still build and run mostly as normal, but the daemon process has no root privileges to abuse in the first place.

To set it up, run `dockerd-rootless-setuptool.sh install` as your regular user. It creates a `rootless` CLI context and switches to it, so the `docker` CLI talks to your rootless daemon. Tools that don't read contexts still need `DOCKER_HOST` pointed at your user-level socket.

The detail most people miss: because the daemon has no root privileges, it can't bind to privileged ports by default, meaning anything below 1024. So if you're used to mapping `-p 80:80` or `-p 443:443`, that won't work out of the box under rootless mode. Either an admin grants RootlessKit `CAP_NET_BIND_SERVICE` or lowers `net.ipv4.ip_unprivileged_port_start`, or you plan your port mappings around it, usually by mapping to a high port on the host and putting a reverse proxy in front, or mapping to unprivileged ports directly in your app config.

With that constraint accounted for, rootless Docker gives you a daemon and container runtime that no longer need root to operate, which closes off one of the most common container escape paths.

## Rootful vs rootless at a glance

| | Rootful (default) | Rootless |
|---|---|---|
| Daemon runs as | root | Your user |
| Root inside a container is | UID 0 on the host, limited by dropped capabilities and seccomp | Your unprivileged user, through a user namespace |
| API socket | `/var/run/docker.sock` | `$XDG_RUNTIME_DIR/docker.sock` |
| Ports below 1024 | Work | Blocked unless you change the defaults |
| CPU and memory limits | Work | Need cgroup v2 with systemd |
| Not supported | Nothing extra | AppArmor, checkpoint, overlay networks, SCTP ports |
| Whoever gets the socket | Effectively has root on the host | Has your user account |

That last row is the whole point: [an exposed Docker socket](/questions/docker-socket-exposed-why-that-s-dangerous) on a rootful host is a full host takeover.

## Setting it up

These commands assume Docker Engine and the CLI are already installed from Docker's apt repository. If a rootful daemon is running, stop it with `sudo systemctl disable --now docker.service docker.socket` and remove its leftover socket with `sudo rm -f /var/run/docker.sock`, or the setup tool refuses to continue.

```bash
# Once, as an admin: install the helpers and check the subordinate ID ranges
sudo apt-get install -y uidmap docker-ce-rootless-extras
grep "^$USER:" /etc/subuid /etc/subgid   # each needs at least 65,536 IDs

# As your normal user
dockerd-rootless-setuptool.sh install
systemctl --user enable --now docker
sudo loginctl enable-linger "$USER"      # keep the daemon running after logout
docker info --format '{{.SecurityOptions}}'   # should include name=rootless
```

One thing trips people up after setup: with the default port driver, your app doesn't see the real client IP on published ports, which breaks IP allow-lists and means access logs no longer show who connected. Switching RootlessKit to the `slirp4netns` port driver keeps the source IP, at some cost in throughput.

## Why interviewers ask this

This question separates people who've memorized "run containers as a non-root user" from people who understand the daemon itself is the real privilege-escalation risk. They want to know if you can reason about attack surface, not just recite a Dockerfile `USER` directive. It also tests whether you've actually operated rootless mode and hit its real-world limitations, like the port restriction.

## Follow-ups to expect

- **How do you expose a rootless container on port 443 then?** You map to a high unprivileged port on the host and put a reverse proxy, load balancer, or `iptables`/`systemd` socket activation in front of it to forward traffic from 443.
- **Does rootless Docker change anything inside the container itself?** Mostly no, but root inside the container maps to your unprivileged host user, so anything that needs real host privileges fails, and networking and resource limits (cgroup v2 with systemd) behave differently. Test workloads under rootless mode first.
- **Is rootless mode the same as `userns-remap`?** No. With `userns-remap` the daemon still runs as root and only the containers are mapped to a range of unprivileged IDs. Rootless takes root away from the daemon too. Podman goes further and has no daemon at all; see [Docker vs Podman vs containerd](/questions/docker-vs-podman-vs-containerd-container-runtimes).
- **What's the actual security benefit here?** If the daemon or a container escapes, the blast radius is limited to a regular user's permissions instead of root, since the daemon was never running as root to begin with.

## The common wrong answer

Most candidates answer this with `USER appuser` in a Dockerfile and stop there. That only controls the user inside the container process; it says nothing about the daemon, which is still root-owned and still the bigger risk. Interviewers are listening for whether you mention the daemon itself, the setup tool, and the privileged-port tradeoff, not just container-level user switching.
