---
title: mTLS vs TLS vs IPSec - Encryption in Transit
description: mTLS vs TLS vs IPSec compared for DevOps interviews: how each encrypts traffic, where to use them, and the cert management catch.
date: 2026-10-22
updated: 2026-11-20
keywords: networking, devops interview questions, mtls vs tls vs ipsec, encryption in transit interview, network security protocols
category: networking
youtube: scrol7F7hDQ
---

Encryption-in-transit questions show up a lot in networking and security rounds because they separate people who've memorized acronyms from people who've actually deployed these protocols. Knowing the one-line definition of TLS, mTLS, and IPSec is the easy part. Knowing when to reach for each one, and what it costs you operationally, is what interviewers are actually testing.

## The answer interviewers want

Start with what each protocol actually does, then move to where you'd use it.

`TLS` encrypts traffic from client to server. It's a one-way trust model: the client verifies the server's certificate, but the server doesn't verify the client's identity through the same mechanism.

`mTLS` (mutual TLS) adds mutual authentication on top of that. Both sides present certificates, and both sides verify each other before the connection is trusted.

`IPSec` operates at the network layer, not the application layer. It encrypts traffic at a lower level in the stack, independent of whatever protocol is riding on top of it.

That maps to three distinct use cases:

- **TLS** for web traffic, standard client-to-server connections like browsers hitting an API or a load balancer.
- **mTLS** for service mesh, where every service needs to prove its identity to every other service it talks to, not just encrypt the pipe.
- **IPSec** for site-to-site VPNs, where you're encrypting traffic between networks rather than individual application connections.

The detail most candidates skip: mTLS requires certificate management on both sides of the connection, not just the server. That means issuing, rotating, and revoking client certificates at scale, which is why service meshes (Istio, Linkerd) usually bundle a certificate authority to automate it. Without that automation, mTLS becomes an operational burden fast.

## Side by side

| | TLS | mTLS | IPSec |
|---|---|---|---|
| Layer | Usually on top of TCP (QUIC builds TLS 1.3 into UDP), below the application | Same as TLS | Network layer, on IP packets |
| Who proves identity with a certificate | The server | Both sides | Both ends of the tunnel, with certificates or a pre-shared key |
| What's protected | One connection for one application | One connection for one application | IP traffic between two hosts or networks that matches its policies, whatever the application protocol |
| Typical use | Browsers and API clients calling a public endpoint | Service-to-service traffic in a mesh, partner and banking APIs | Site-to-site VPNs, cloud VPN gateways |
| The hard part | Renewing server certificates on time | Issuing and rotating a certificate for every client | Matching config on both ends, MTU and NAT traversal |

## Seeing the difference

`openssl s_client` shows it in one command each:

```bash
# TLS: only the server presents a certificate
openssl s_client -connect api.example.com:443 -servername api.example.com </dev/null

# mTLS: the client presents one too
openssl s_client -connect partner-api.example.com:443 -servername partner-api.example.com \
  -cert client.crt -key client.key </dev/null
```

Leave out `-cert` and `-key` against a server that requires a client certificate and the handshake fails; with TLS 1.3 you'll usually see a `certificate required` alert. `curl` takes the same files with `--cert` and `--key`.

In a mesh nobody runs this by hand. In Istio, one resource makes mTLS mandatory for a namespace:

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: payments
spec:
  mtls:
    mode: STRICT
```

Roll it out in `PERMISSIVE` mode first, which accepts both plain text and mTLS, and switch to `STRICT` once every client is in the mesh. Istio and Linkerd both issue short-lived workload certificates, valid for 24 hours by default, and rotate them automatically. That takes care of workload certificates. The root and intermediate certificates the mesh signs with still expire, and they need their own rotation plan. Whether a mesh is worth running just for this is its own question: [do you actually need Istio?](/questions/service-mesh-explained-do-you-actually-need-istio)

## Why interviewers ask this

This question filters for people who understand the trust model behind each protocol, not just the acronym. Anyone can say "mTLS is more secure." Interviewers want to hear that you know *why*, that it's about mutual identity verification, and that you understand the operational tax that comes with it, specifically certificate lifecycle management.

## Follow-ups to expect

**"Why would you choose mTLS over plain TLS inside a service mesh?"** Because internal services need to verify each other's identity, not just encrypt the connection, since a compromised pod on the network shouldn't be able to impersonate another service.

**"What happens if certificate rotation fails in an mTLS setup?"** Services start rejecting each other's connections because their certs no longer validate, which is why mesh platforms automate rotation rather than relying on manual cert management.

**"How does IPSec differ from a TLS-based VPN?"** IPSec works at the network layer and encrypts traffic independent of the application protocol, while TLS-based VPN solutions still operate higher up the stack.

## The common wrong answer

Most candidates recite the definitions correctly, TLS is one-way, mTLS is mutual, IPSec is network layer, but then say "we'd use mTLS everywhere for better security" without mentioning the certificate management overhead. That answer signals you've read the marketing material but haven't run mTLS in production, where cert rotation and revocation at scale is the actual hard part.
