/**
 * Private PDF storage + signed-URL delivery (Supabase Storage).
 *
 * Upload the book PDFs to a PRIVATE bucket (default name "ebooks") and map each
 * product slug to its file path(s) below. Signed URLs expire quickly so links
 * emailed to a customer can't be shared forever.
 *
 * Only products with a real file are deliverable; unwritten books map to [] so a
 * paid download for them is impossible (and checkout for them should be disabled).
 */
import { createClient } from '@supabase/supabase-js'

const BUCKET = process.env.SUPABASE_EBOOKS_BUCKET || 'ebooks'

// slug -> storage path(s). A slug only belongs here once its PDF is actually
// UPLOADED to the private bucket with the exact filename below, otherwise checkout
// will succeed but the signed-URL download will fail.
//
// REQUIRED UPLOADS before the entries below can deliver (source -> bucket filename):
//   v2-cicd/book4-cicd-final.pdf                       -> cicd-gitops.pdf            (Book 4, now built)
//   interview-day-playbook/interview-day-playbook-final.pdf -> interview-day-playbook.pdf  (Playbook, now built)
//   v2-devops-mastery/book5-devops-mastery-final.pdf   -> advanced-devops.pdf         (Book 5, now built)
// All of Book 4, Book 5, and the Playbook are mapped here because their PDFs are built;
// UPLOAD all three before taking payment for them or the download will 404.
const FILE_MAP: Record<string, string[]> = {
  'cloud-interview-mastery': ['cloud-platforms.pdf'],
  'container-orchestration-journey': ['containers-orchestration.pdf'],
  // Book 3 (Infrastructure as Code) is built; upload infrastructure-as-code.pdf to the bucket.
  'infrastructure-automation-mastery': ['infrastructure-as-code.pdf'],
  // Book 4 (CI/CD & GitOps) — built. UPLOAD cicd-gitops.pdf to the bucket.
  'modern-cicd-gitops': ['cicd-gitops.pdf'],
  // Interview-Day Playbook (add-on) — built. UPLOAD interview-day-playbook.pdf to the bucket.
  'interview-day-playbook': ['interview-day-playbook.pdf'],
  // Book 5 (Advanced DevOps / Senior DevOps Handbook) — built. UPLOAD advanced-devops.pdf to the bucket.
  'senior-devops-handbook': ['advanced-devops.pdf'],
  // bundle delivers all five books:
  'complete-devops-mastery-bundle': ['cloud-platforms.pdf', 'containers-orchestration.pdf', 'infrastructure-as-code.pdf', 'cicd-gitops.pdf', 'advanced-devops.pdf'],
}

export function filesForSlug(slug: string): string[] {
  return FILE_MAP[slug] ?? []
}

export function storageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function client() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

/** Create short-lived signed URLs for every file of a product. */
export async function signedUrlsForSlug(slug: string, expiresInSeconds = 300): Promise<{ name: string; url: string }[]> {
  const paths = filesForSlug(slug)
  if (paths.length === 0) return []
  const supabase = client()
  const out: { name: string; url: string }[] = []
  for (const path of paths) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
    if (error || !data) throw new Error(`signed url failed for ${path}: ${error?.message}`)
    out.push({ name: path, url: data.signedUrl })
  }
  return out
}
