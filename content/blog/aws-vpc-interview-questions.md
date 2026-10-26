---
title: AWS VPC Interview Questions for Experienced Engineers
description: AWS VPC interview questions for experienced engineers: subnets, route tables, NAT, VPC endpoints, peering vs Transit Gateway, and how to debug a broken path.
date: 2026-10-26
keywords: aws vpc interview questions, aws vpc interview questions for experienced, aws vpc scenario based interview questions, aws networking interview questions, vpc endpoint interview questions, transit gateway vs vpc peering
topic_id: K01
---

AWS VPC interview questions at the senior level rarely stop at "what is a subnet". The interviewer wants to know whether you can trace a packet: which route table it hits, which gateway it leaves through, which firewall layer drops it, and what the bill looks like when it gets there. The questions below run from addressing and routing through egress, endpoints and hybrid connectivity to a private-subnet troubleshooting scenario.

## AWS VPC interview questions on subnets and routing

### 1. How do you choose CIDR ranges for a new VPC?

Start from the organisation, not the VPC. Any range may one day need routing to another VPC or a data centre, and neither peering nor a plain Transit Gateway route connects overlapping ranges. So begin with an address plan kept in one central record, such as Amazon VPC IPAM.

Then size the subnets. An IPv4 subnet can be anywhere from /28 to /16, and AWS reserves five addresses in each: the first four (network, VPC router, DNS, future use) and the last. A /28 leaves 11 usable addresses. The follow-up to expect is EKS: with the default Amazon VPC CNI, every pod that does not use host networking takes its own subnet address, so a cluster can exhaust a /24 long before the nodes look busy.

### 2. What actually makes a subnet public?

Its route table. A subnet is public when its associated route table has a route to an internet gateway, usually for 0.0.0.0/0. For IPv4, an instance needs both the route and a public IPv4 address or Elastic IP, so an instance with only a private IPv4 address cannot reach the internet directly even in a public subnet. For IPv6, the instance needs its IPv6 address and a ::/0 route to the internet gateway.

### 3. A subnet has no explicit route table association. What does it use?

The main route table, which makes it a trap. If someone adds an internet gateway route to it, every subnet created later without an explicit association becomes public by accident. Leave the main route table with only the local route and associate every subnet explicitly.

When several routes match, the VPC picks the most specific (longest prefix match). That is how a gateway endpoint coexists with a default route: the S3 prefix list is more specific than 0.0.0.0/0, so S3 traffic for that Region goes to the endpoint.

### 4. Security groups or network ACLs: which one does the real work?

Security groups, almost always. They are stateful, contain only allow rules, and can reference other security groups, so "the app tier may reach the database on 5432" is one rule that survives instances coming and going. Network ACLs are stateless, apply to a whole subnet, support allow and deny, and are evaluated in rule-number order, lowest first.

Statelessness is what catches people. When an instance makes an outbound call, the NACL must also allow the reply to the client's ephemeral port. Many Linux kernels use 32768-61000, while NAT gateways, Elastic Load Balancing and Lambda use 1024-65535, which is why return-traffic rules usually open 1024-65535. Use NACLs as coarse guardrails and leave application policy to security groups.

## NAT and internet egress

### 5. How do you design NAT for a VPC that spans three Availability Zones?

For zonal NAT gateways the classic answer holds: one NAT gateway per AZ, each in a public subnet, with each private route table pointing 0.0.0.0/0 at the gateway in its own AZ. A single shared gateway saves money until its AZ fails and the healthy AZs lose outbound access too, and meanwhile you pay cross-AZ data transfer to reach it. The free [VPC design question on subnets, NAT and security groups](/questions/aws-vpc-design-subnets-nat-and-security-groups) covers that baseline.

The 2026 answer adds regional NAT gateways, launched in November 2025. One regional NAT gateway serves the whole VPC, needs no public subnet, and lets every private route table point at the same ID. In automatic mode it expands into an AZ when workloads appear there; in manual mode you manage the AZs and addresses yourself. Name the caveats: automatic expansion into a new AZ can take up to 60 minutes, during which that traffic is processed in another zone, and regional mode does not support private NAT.

### 6. Your NAT gateway costs more than the instances behind it. Where do you look?

Split the bill first. NAT gateways charge for the hours they are provisioned and per gigabyte processed, so idle capacity costs money too, but when the processing line dominates, bytes are the problem. The usual suspects are AWS services rather than the internet: S3, DynamoDB, ECR image pulls and CloudWatch logs. Flow logs summed in both directions and grouped by the remote address (`pkt-dstaddr` outbound, `pkt-srcaddr` for replies) show the top talkers.

The fixes are endpoints. S3 and DynamoDB gateway endpoints carry no additional charge and take that traffic off the NAT path. ECR pulls need interface endpoints for the ECR API and Docker registry, plus the S3 gateway endpoint, because ECR stores image layers in S3.

### 7. What does ErrorPortAllocation on a NAT gateway tell you?

That the gateway could not allocate a source port because too many connections are open. Each NAT gateway IPv4 address supports up to 55,000 simultaneous connections to each unique destination (IP, port and protocol). A fleet opening a fresh connection per request to one API hits that early. Add IP addresses to the gateway (up to 8 on a zonal gateway, 32 per AZ on a regional one) or, usually better, make the client reuse connections.

## VPC endpoints

### 8. Gateway endpoint or interface endpoint: how do you choose?

Know where each one stops working:

| | Gateway endpoint | Interface endpoint |
|---|---|---|
| Services | S3 and DynamoDB only | Most AWS services, plus PrivateLink services from other accounts |
| How traffic gets there | Route table entry using the service's prefix list | DNS resolves to private IPs of endpoint network interfaces |
| Cost | No additional charge | Per hour per AZ, plus per GB processed |
| Usable from on-premises, peered VPCs or a transit gateway | No | Yes, with DNS set up for it |
| Access controls | Endpoint policy, route table associations | Security groups, plus endpoint policies where the service supports them |

For services that support private DNS, enabling it on the endpoint (with `enableDnsSupport` and `enableDnsHostnames` on the VPC) makes AWS create a hidden private hosted zone, so the service's usual hostname resolves to the endpoint and existing SDK calls need no changes. Without it, the hostname resolves to public addresses and the route table decides the path, which is usually NAT. S3 can scope private DNS to queries from an inbound Resolver endpoint, so on-premises clients use the interface endpoint while VPC traffic stays on the free gateway endpoint. Endpoints are also what let [Session Manager replace SSH](/questions/aws-ssm-vs-ssh-stop-opening-port-22) for private instances with no NAT.

### 9. You added an S3 gateway endpoint and something broke. What happened?

Several things change at once:

- Bucket policies that rely on `aws:SourceIp` break, because that key is not available for requests through a VPC endpoint. Restrict by endpoint or VPC with `aws:SourceVpce` or `aws:SourceVpc`, and if client IPs matter, pair `aws:VpcSourceIp` with one of them.
- A restrictive endpoint policy can block buckets nobody thought about, such as those AWS services use for agents or drivers.
- A gateway endpoint only covers buckets in its own Region; other Regions still go through NAT.
- Creating or modifying the endpoint drops open TCP connections to S3, so long transfers fail once and need to retry.

## Connecting VPCs and on-premises networks

### 10. VPC peering, Transit Gateway or PrivateLink: how do you decide?

They solve different problems:

- **VPC peering** is a one-to-one link with no transit. If A peers with B and with C, B cannot reach C through A, nor use A's internet gateway, NAT gateway, VPN or gateway endpoint. CIDRs cannot overlap. A full mesh of n VPCs needs n(n-1)/2 connections, each with routes on both sides, which is why larger networks move to a hub.
- **Transit Gateway** is a regional router. VPCs, VPNs and Direct Connect gateways attach to it, its route tables decide who reaches whom, and it bills per attachment and per gigabyte. It routes on destination prefixes too, so two VPCs with the same CIDR need NAT between them.
- **PrivateLink** exposes one service, not a network. The provider fronts the service with a Network Load Balancer and an endpoint service; consumers create an interface endpoint in their own VPC. Only the consumer initiates connections, and overlapping CIDRs between the two VPCs do not matter.

Real networks mix them: Transit Gateway for layer-3 connectivity, PrivateLink for a shared internal API, peering where it is genuinely simpler. For organising the Terraform across those accounts, see this [Terraform layout for 20 AWS accounts](/blog/terraform-mono-repo-20-aws-accounts).

### 11. How do you stop dev VPCs from reaching prod over a shared Transit Gateway?

With Transit Gateway route tables. An attachment is associated with at most one TGW route table, which decides where traffic entering through it can go, and separately can propagate its routes into any number of tables, or none, which decides who can reach it. A common layout:

- A prod table for prod attachments, with propagations from prod, shared services and on-premises.
- A dev table built the same way for dev.
- A shared-services table that receives propagations from both.

Prod and dev never propagate into each other's tables, so there is no route, and blackhole routes stop a broad static route leaking through. Two follow-ups: each VPC still needs routes in its own subnet route tables pointing at the transit gateway, and an attachment for a stateful inspection appliance needs appliance mode so both directions of a flow stay in the same AZ.

### 12. How do you connect a data centre to AWS, and what happens when a link fails?

Site-to-Site VPN is the fast start. Each connection has two tunnels in different AZs; configure both, because a tunnel can be down for maintenance. A standard tunnel carries up to 1.25 Gbps; Large Bandwidth Tunnels reach 5 Gbps on VPNs attached to a transit gateway or Cloud WAN. Direct Connect gives a dedicated private path, but it does not encrypt traffic by default: add MACsec where the connection supports it, or run IPsec VPN over it. A common pattern is Direct Connect primary and VPN backup, with BGP choosing between them and a scheduled failover test.

DNS is the part people forget. The Route 53 Resolver cannot be queried from outside the VPC, so hybrid DNS uses Resolver endpoints: inbound for on-premises clients resolving private names, outbound with forwarding rules for VPC workloads resolving on-premises domains.

## AWS VPC scenario based interview questions: debugging a broken path

### 13. An instance in a private subnet can't reach an external API. Walk me through it.

Name the failure first. A DNS error points at resolution, although reaching a custom resolver is itself a network path. A refused connection means a packet reached something that answered with a reset. A connect timeout means the SYN got no answer: dropped, never routed, or sent to a host too overloaded to reply, and the VPC layers are the first suspects. The free question on [connection refused vs timeout](/questions/connection-refused-vs-timeout-different-fixes) covers that split. It is the same discipline as reading the exit code first in this [Kubernetes production debugging walkthrough](/blog/kubernetes-production-debugging-walkthrough).

Then check each layer:

1. The subnet's route table, explicit or main. Does 0.0.0.0/0 point at a NAT gateway that serves this AZ? A route whose NAT gateway was deleted shows a `blackhole` state.
2. The NAT gateway. Is it `available`? For a zonal gateway, does its own subnet route 0.0.0.0/0 to an internet gateway?
3. The instance's security group outbound rules. Replies are allowed automatically.
4. The network ACLs on the instance's subnet and, for a zonal gateway, the NAT gateway's subnet, in both directions, including inbound ephemeral ports.
5. The far end. Third-party APIs often allowlist source IPs, and the request arrives from the NAT gateway's public address.

These commands cover step 1 and the gateway's state without the console:

```bash
# Routes in the subnet's explicitly associated route table
aws ec2 describe-route-tables \
  --filters Name=association.subnet-id,Values=subnet-0abc1234 \
  --query 'RouteTables[].Routes[]'

# Empty output above means the subnet uses the main route table
aws ec2 describe-route-tables \
  --filters Name=vpc-id,Values=vpc-0123abcd Name=association.main,Values=true \
  --query 'RouteTables[].Routes[]'

aws ec2 describe-nat-gateways --nat-gateway-ids nat-0def5678 \
  --query 'NatGateways[].[State,SubnetId]'
```

For a zonal gateway, run the route table query again with the NAT gateway's subnet ID to confirm its route to the internet gateway.

Reachability Analyzer models your configuration rather than sending packets, and when the path is blocked it names the component responsible:

```bash
aws ec2 create-network-insights-path \
  --source i-0abc1234 --destination igw-0def5678 \
  --protocol tcp --destination-port 443

aws ec2 start-network-insights-analysis \
  --network-insights-path-id nip-0123abcd

aws ec2 describe-network-insights-analyses \
  --network-insights-analysis-ids nia-0456efgh \
  --query 'NetworkInsightsAnalyses[].[NetworkPathFound,Explanations]'
```

Flow logs show what actually happened. The pattern worth recognising is an ACCEPT for the outbound request and a REJECT for the reply. Security groups allow replies on a tracked connection, so a network ACL is the first suspect; confirm it against the NACL rules, because packets arriving after a connection has closed can also be rejected. In the default format:

```text
2 123456789012 eni-0aaa1111 10.0.12.34 203.0.113.10 41822 443 6 3 180 1761470000 1761470060 ACCEPT OK
2 123456789012 eni-0aaa1111 203.0.113.10 10.0.12.34 443 41822 6 3 180 1761470000 1761470060 REJECT OK
```

Two caveats. Flow logs do not record traffic to the Amazon-provided DNS server or instance metadata, and they never contain query names, so use Route 53 Resolver query logging for DNS problems. And if the dropping NACL is on the NAT gateway's subnet, the REJECT appears on the NAT gateway's interface, so check both.

## VPC design checklist

- One central address plan, with no overlaps between VPCs or with on-premises.
- Main route table with the local route only; every subnet associated explicitly.
- NAT per AZ, or a regional NAT gateway, so steady-state traffic does not cross zones to reach NAT.
- S3 and DynamoDB gateway endpoints everywhere; interface endpoints where volume justifies them.
- Transit Gateway route tables per environment, appliance mode on inspection attachments.
- Hybrid DNS through Resolver endpoints, and a tested failover for on-premises links.

## Interview questions this covers

- How would you design a VPC with public and private subnets across three Availability Zones?
- What is the difference between a gateway endpoint and an interface endpoint, and when would you pay for one?
- VPC peering, Transit Gateway or PrivateLink: which would you use to connect 50 VPCs and a data centre?
- An instance in a private subnet can't reach the internet. How do you troubleshoot it?
- Why does a NAT gateway bill keep growing, and how do you bring it down?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

Cloud networking questions in real interviews go further: a network that scales to hundreds of VPCs, resilient connectivity between a data centre and the cloud, and Lambda functions reaching private APIs without NAT gateways. [Cloud Platforms: AWS, Azure & GCP Interview Questions](/ebooks/cloud-interview-mastery) works through 50 senior-level questions with worked answers, including a chapter on cloud networking and security. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework.
