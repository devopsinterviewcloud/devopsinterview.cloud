import { getAllPosts } from '@/lib/blog'

export const dynamic = 'force-static'

const SITE = 'https://devopsinterview.cloud'

/**
 * llms.txt: a curated markdown summary of the site for AI assistants
 * (https://llmstxt.org/). The store copy is hand-written; the Blog section is
 * generated from the same source as the pages so it never goes stale.
 * (This route replaced the static public/llms.txt so the blog list stays live.)
 */
export function GET() {
  const posts = getAllPosts()

  const body = `# DevOpsInterview.Cloud

> Senior-level DevOps and Cloud interview preparation ebooks. 250+ real interview questions across five books, each answered the way a senior engineer actually would, including the tradeoffs and the follow-up questions an interviewer will probe. PDF format, instant email delivery, prices auto-convert by region.

## Books (₹899 / $9.99 each)

- [Cloud Interview Mastery: AWS, Azure & GCP](${SITE}/ebooks/cloud-interview-mastery): 50 senior-level multi-cloud questions — architecture, compute/storage, networking, security, IAM, cost/FinOps, serverless, DR/HA.
- [Container Orchestration Journey: Docker to Kubernetes](${SITE}/ebooks/container-orchestration-journey): 52 questions — scheduling, cluster networking/service mesh, container & supply-chain security, RBAC, stateful workloads, observability, operators, platform engineering.
- [Infrastructure as Code Mastery: Terraform & OpenTofu](${SITE}/ebooks/infrastructure-automation-mastery): state management, module design, drift, testing, policy-as-code, GitOps delivery, multi-cloud (Pulumi, CDK, Crossplane).
- [Modern CI/CD & GitOps: Pipelines, Argo CD & Progressive Delivery](${SITE}/ebooks/modern-cicd-gitops): 50 questions — pipeline architecture, GitOps with Argo CD/Flux, canary/blue-green, supply-chain security (SBOM, Sigstore, SLSA), DORA.
- [Senior DevOps & SRE Handbook: Observability, Reliability & Security](${SITE}/ebooks/senior-devops-handbook): 50 questions — metrics/logs/traces, OpenTelemetry, SLOs & error budgets, incident command, zero-trust, AIOps, chaos engineering.

## Bundle and bonus

- [Complete DevOps Mastery Bundle (all 5 books)](${SITE}/ebooks/complete-devops-mastery-bundle): ₹2,999 / $31.99 — save 33% versus buying the books separately.
- The Interview-Day Playbook (7-day & 24-hour prep plan, STAR worksheets, system-design scaffold, negotiation basics) is included FREE with every purchase.

## Blog (free interview prep articles)

${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description.slice(0, 180)}`).join('\n')}

## Key pages

- [Browse all ebooks](${SITE}/#ebooks)
- [Frequently asked questions](${SITE}/#faq)
- [Contact](${SITE}/contact)
- [Refund policy](${SITE}/refunds)
- [Terms of service](${SITE}/terms)
- [Privacy policy](${SITE}/privacy)

## Notes

- Audience: engineers preparing for mid-to-senior DevOps, Cloud, SRE, and Platform Engineering interviews.
- Delivery: instant digital download links emailed after payment. Payments via Razorpay (India/INR) and PayPal (international/USD).
- Contact: devopsinterview.cloud@gmail.com
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
