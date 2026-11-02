---
title: Kubernetes Networking Interview Questions and Answers
description: Kubernetes networking interview questions for experienced engineers: Services and kube-proxy, eBPF, CNI choices, NetworkPolicy, Gateway API and DNS failures.
date: 2026-11-02
keywords: kubernetes networking interview questions, kubernetes networking interview questions and answers, kubernetes networking interview questions for experienced, kubernetes networking scenario based interview questions, kubernetes network policy interview questions, kubernetes dns troubleshooting
topic_id: K02
---

Kubernetes networking interview questions start simple and end at the packet level. "How does a Service work?" becomes "so where does the ClusterIP live?", then "what changes if you remove kube-proxy?", then "why does DNS only time out under load?". The questions below follow that path, from the pod network through Services, NetworkPolicy, Gateway API and DNS to a debugging scenario.

## Kubernetes networking interview questions on the pod network

### 1. What does the Kubernetes network model require, and who implements it?

Every pod gets its own cluster-wide IP address, shared by all of its containers, which reach each other over localhost. Pods reach pods on any node directly, without proxies or NAT, and agents on a node such as the kubelet can reach every pod on that node.

Kubernetes implements very little of this itself. The container runtime sets up each pod's network namespace, and the pod network comes from a network plugin; on Linux, most container runtimes talk to it through CNI. kube-proxy is the default Service implementation, but some plugins ship their own. NetworkPolicy is enforced by the plugin or not at all: on a plugin without NetworkPolicy support, the API still accepts your policies and they have no effect.

### 2. How do you choose a CNI plugin?

Start from the decisions the plugins make differently, not from a brand name:

| Decision | Options | What it costs |
|---|---|---|
| How pod packets cross the network | Overlay (VXLAN and similar) or native routing (BGP, or addresses from the cloud VPC) | Overlay adds encapsulation overhead; native routing needs the network underneath to route pod CIDRs |
| NetworkPolicy enforcement | Calico and Cilium enforce it; flannel on its own does not | Without it, policies are accepted and ignored |
| Service data plane | kube-proxy, or the plugin's own, such as Cilium's kube-proxy replacement | A replacement moves Service debugging to the plugin's tools |

On EKS, the Amazon VPC CNI gives every pod a private IP from the VPC, so two limits show up early: network interface limits cap pods per node (prefix delegation raises them), and every pod consumes a subnet address (a secondary CIDR for pods, or IPv6, relieves that). The [AWS VPC interview questions](/blog/aws-vpc-interview-questions) post covers the subnet-sizing side.

## Services, kube-proxy and eBPF

### 3. How does traffic to a ClusterIP Service reach a pod?

The Service gets a virtual IP, and the EndpointSlice controller tracks the pods matching its selector, with each endpoint's readiness. kube-proxy on every node watches Services and EndpointSlices and programs the kernel to rewrite traffic for the ClusterIP and port to one backend pod. In iptables and nftables modes the backend is picked at random by default, or by session affinity if set, and no interface holds the ClusterIP: the packet is rewritten on the client's node before it leaves.

The backend is picked per connection, not per request. Connection tracking carries every later packet of that connection to the same pod, so long-lived HTTP/2 or gRPC connections stay pinned to whichever pods they first reached, and pods added by a scale-up get none of that traffic until clients reconnect. Balancing those needs client-side load balancing or a proxy that understands requests.

To check which mode kube-proxy runs in, ask it on the node:

```bash
curl -s http://localhost:10249/proxyMode
```

### 4. iptables, IPVS, nftables or eBPF: which Service data plane would you run?

Know where each one stands in 2026:

- **iptables** is still the default on Linux. kube-proxy writes a few rules per Service and per endpoint, and with tens of thousands of Pods and Services, updating them after a change can take a long time.
- **IPVS** is deprecated since Kubernetes 1.35, off by default from 1.40 and removed in 1.43. It never handled every edge case of the Services API, so skip it for new clusters.
- **nftables** replaces both, and the docs say a future release will make it the default. It needs kernel 5.13 or later and processes endpoint changes faster than iptables mode. Migration gotchas: NodePorts listen only on the node's primary IPs by default, and it adds no firewall accept rules for them.
- **eBPF**, through Cilium's kube-proxy replacement, handles ClusterIP, NodePort, LoadBalancer and externalIPs Services itself. Its socket-level load balancing picks a backend when a pod calls `connect()`, so the socket connects straight to the backend with no per-packet NAT. The costs: kube-proxy has to go (removing it on a live cluster breaks existing Service connections), and you debug Services with Cilium's tools.

Interviewers want a reason tied to the cluster in front of you, not a favourite tool. The free question on [Cilium vs kube-proxy](/questions/cilium-vs-kube-proxy-why-ebpf-wins) covers the eBPF case in more depth.

## NetworkPolicy and default deny

### 5. What happens when the first NetworkPolicy lands in a namespace?

By default, pods are non-isolated: all traffic in and out is allowed. A pod becomes isolated for ingress once any policy that selects it lists `Ingress` in `policyTypes`, and the same applies to egress. Once the plugin enforces it, new connections need an allow from some applicable policy, apart from reply traffic and ingress from the pod's own node; whether existing connections are cut is up to the implementation. Policies are additive, so the allowed set is the union of every policy that applies, order does not matter, and the core API has no deny rule. A connection needs both the source pod's egress and the destination pod's ingress to allow it.

A common baseline per namespace is default deny in both directions, plus a DNS exception:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: shop
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: shop
spec:
  podSelector: {}
  policyTypes: ["Egress"]
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

Default-deny egress also blocks queries to CoreDNS, so without the second policy, lookups through the kube-dns Service fail across the namespace. With NodeLocal DNSCache (question 9), the DNS rule needs adjusting. The control plane sets the `kubernetes.io/metadata.name` label on every namespace and it cannot be changed, which makes it the safe way to select a namespace by name. This [multi-tenant cluster design](/blog/kubernetes-multi-tenancy-shared-cluster-design) shows the same pattern across many teams.

### 6. Which NetworkPolicy mistakes show up in production?

- **The AND/OR YAML trap.** A `namespaceSelector` and a `podSelector` in the same `from` entry mean "pods with this label in these namespaces". Put a dash in front of the `podSelector` and they become two entries: any pod in those namespaces, or matching pods in the policy's own namespace. `kubectl describe networkpolicy` shows how Kubernetes parsed it.
- **Expecting to target a Service.** Policies select pods and namespaces by label, never Services by name, so changing the labels in a pod template quietly changes who can reach those pods.
- **Assuming features the API lacks.** Core NetworkPolicy has no logging of dropped connections, no explicit deny and no cluster-wide default. Calico and Cilium add their own policy resources for those.

The free question on [network policies that stop lateral movement](/questions/network-policies-stop-lateral-movement-in-3-rules) walks through the security reasoning.

## Ingress vs Gateway API

### 7. Should a new cluster use Ingress or Gateway API?

Gateway API. The Kubernetes docs recommend Gateway over Ingress and describe Ingress as frozen: it stays GA with no plans for removal, but gets no further changes. Ingress models host and path routing plus TLS. Anything more, such as header matching, traffic weighting or rewrites, lives in controller-specific annotations, which is what makes Ingress manifests hard to move between controllers.

Gateway API puts those features in typed fields and splits ownership across resources:

- **GatewayClass** names the controller that implements gateways, owned by the infrastructure or platform team.
- **Gateway** defines listeners (ports, hostnames, TLS certificates) and which namespaces may attach routes, owned by the cluster operator.
- **HTTPRoute** and **GRPCRoute** hold routing rules in the application team's namespace and attach to a Gateway through `parentRefs`.

That split is also a security boundary. A Gateway only accepts routes from other namespaces if its owner allows them on the listener, and a route pointing at a Service in another namespace needs a ReferenceGrant in the target namespace. Gateway API ships as CRDs, so install them first, directly or through your implementation.

The 2026 follow-up is ingress-nginx. In November 2025, SIG Network and the Security Response Committee announced that the community ingress-nginx controller would get only best-effort maintenance until March 2026, and no releases, bug fixes or security fixes after that. Existing installs keep running, which is exactly the risk: an unpatched edge proxy. A credible plan inventories the annotations on every Ingress, maps each to a Gateway API field or an implementation policy, runs the new gateway alongside the old one, then moves DNS. The kubernetes-sigs `ingress2gateway` tool converts manifests as a starting point.

## Kubernetes DNS failures

### 8. How does a pod resolve a Service name?

With the default `ClusterFirst` DNS policy, the kubelet writes each pod's `/etc/resolv.conf` with the cluster DNS Service as the nameserver, a search list, and `ndots:5`:

```text
nameserver 10.96.0.10
search shop.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```

CoreDNS answers behind a Service still named `kube-dns` for backward compatibility. A bare `payments` resolves only within the pod's own namespace; from another namespace you need `payments.shop` or the full `payments.shop.svc.cluster.local`.

`ndots:5` means any name with fewer than five dots is tried with each search domain before it is tried as written. For a glibc-based client, one lookup of `api.example.com` can become eight queries: A and AAAA for three search-domain names that return NXDOMAIN, then the real one. Two fixes: write external names with a trailing dot (`api.example.com.`), or lower `ndots` for pods that mostly call external hosts:

```yaml
spec:
  dnsConfig:
    options:
    - name: ndots
      value: "2"
```

`payments.shop` still uses the search list with `ndots:2`, but names with two or more dots are now tried as written first, so test anything that relies on the search list before rolling it out.

### 9. DNS lookups sometimes take five seconds. What is going on?

Five seconds is the glibc resolver's default timeout, so the number says a query went unanswered and the client waited before retrying. The usual causes:

- **The conntrack race.** The long-running Kubernetes issue "DNS intermittent delays of 5s" traced back to races in Linux connection tracking: a client sends its A and AAAA queries from the same UDP socket at the same moment, through the DNAT to the DNS Service, and one gets dropped. Kernel fixes narrowed the race but did not remove every variant.
- **A full conntrack table.** UDP entries linger until they time out (30 seconds by default), and a busy node logs `nf_conntrack: table full, dropping packet`.
- **CoreDNS under-provisioned.** Too few replicas for the query rate, which `ndots:5` multiplies, CPU throttling from tight limits, or slow upstream resolvers. CoreDNS's own Prometheus metrics show request rates, latency and errors.

For the conntrack causes, the Kubernetes docs point to NodeLocal DNSCache, a caching DaemonSet on every node. Pods query the cache on their own node, which skips DNAT and connection tracking on that hop, and the cache can send its misses to CoreDNS over TCP, whose conntrack entries disappear when the connection closes. The cache also takes load off CoreDNS, but capacity and upstream problems still need their own fixes. One catch: queries now go to an address on the node rather than to the CoreDNS pods, so check that egress policies still allow them. The free question on [Kubernetes DNS not resolving](/questions/kubernetes-dns-not-resolving-troubleshoot-coredns) covers the CoreDNS checks.

## Kubernetes networking scenario based interview questions

### 10. Calls from checkout to the payments Service time out. Walk me through it.

Start with the error. A resolution failure points at DNS or a missing namespace in the name. Connection refused means something answered with a reset, often a `targetPort` no container listens on. A timeout means packets are dropped somewhere: by policy, by the pod network, or at backends that never answer.

Then test from the caller itself. A throwaway pod has different labels, so NetworkPolicy treats it differently; an ephemeral container shares the checkout pod's network namespace and sees what it sees:

```bash
# Service IP, ports and selector; then each endpoint's conditions.ready
kubectl -n shop get svc payments -o yaml
kubectl -n shop get endpointslices -l kubernetes.io/service-name=payments -o yaml

# From inside the checkout pod: the ClusterIP first, then one pod IP directly
kubectl -n web debug -it checkout-7d9f8c6b5-x2x4q --image=busybox:1.36 -- \
  wget -qO- -T 3 http://10.96.45.12:8080/healthz
kubectl -n web debug -it checkout-7d9f8c6b5-x2x4q --image=busybox:1.36 -- \
  wget -qO- -T 3 http://10.0.42.17:8080/healthz
```

Read the results as a decision tree:

1. **No ready endpoints.** The selector doesn't match the pod labels, or readiness probes are failing. Find out why before going further.
2. **The pod IP works and the ClusterIP doesn't.** Check that the Service's `port` and `targetPort` map to the port the container listens on. If they do, suspect the Service data plane on the caller's node: kube-proxy or its replacement, and its logs.
3. **Neither works from checkout, both work from a pod in `shop`.** Check NetworkPolicy first, on checkout's egress and payments' ingress, then compare which nodes each test ran from.
4. **It fails only when the two pods are on different nodes.** The pod network between nodes: overlay traffic blocked by a cloud firewall or security group, or an MTU mismatch where small requests succeed and large responses hang.

For ephemeral containers on images with no shell, see this [Kubernetes production debugging walkthrough](/blog/kubernetes-production-debugging-walkthrough).

## Interview questions this covers

- How does a Kubernetes Service route traffic to pods, and what does kube-proxy actually do?
- When would you move kube-proxy to nftables mode, or replace it with Cilium's eBPF data plane?
- How do you roll out a default-deny NetworkPolicy without breaking DNS?
- Should a new cluster use Ingress or Gateway API, and what replaces ingress-nginx?
- Calls to a Service in another namespace time out. How do you troubleshoot it?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

Platform interviews go further: Calico tenant isolation that still allows shared services, intermittent ClusterIP failures after enabling IPv6, and when a service mesh replaces an API gateway. [Containers & Orchestration: Kubernetes Interview Questions](/ebooks/container-orchestration-journey) works through 52 senior-level questions with worked answers, including a chapter on networking and service mesh. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework.
