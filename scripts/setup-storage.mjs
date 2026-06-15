/**
 * One-shot Supabase storage setup for the ebook store.
 *
 *   1. Creates the PRIVATE bucket (SUPABASE_EBOOKS_BUCKET, default "ebooks").
 *   2. Uploads the 6 book PDFs with the EXACT filenames that src/lib/storage.ts
 *      maps slugs to (upsert: true, so re-running is safe / idempotent).
 *
 * Run from devopsinterview.cloud/ with creds loaded from .env:
 *   node --env-file=.env scripts/setup-storage.mjs
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (the sb_secret_... key).
 */
import { createClient } from '@supabase/supabase-js'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import ws from 'ws'

// supabase-js v2 eagerly constructs a Realtime client that needs a global
// WebSocket; Node 20 has none. We only use Storage here, but the constructor
// still runs, so polyfill it. (Harmless once on Node 22+ where it's native.)
globalThis.WebSocket ??= ws

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = process.env.SUPABASE_EBOOKS_BUCKET || 'ebooks'

if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.')
  process.exit(1)
}

// Source PDF on disk  ->  bucket filename (must match FILE_MAP in src/lib/storage.ts).
const REPO = resolve(process.cwd(), '..') // devopsinterview.cloud/ -> repo root
const UPLOADS = [
  ['Interview e-books/v2-cloud-platforms/book1-cloud-platforms-final.pdf', 'cloud-platforms.pdf'],
  ['Interview e-books/v2-containers/book2-containers-final.pdf', 'containers-orchestration.pdf'],
  ['Interview e-books/v2-iac/book3-iac-final.pdf', 'infrastructure-as-code.pdf'],
  ['Interview e-books/v2-cicd/book4-cicd-final.pdf', 'cicd-gitops.pdf'],
  ['Interview e-books/v2-devops-mastery/book5-devops-mastery-final.pdf', 'advanced-devops.pdf'],
  ['Interview e-books/interview-day-playbook/interview-day-playbook-final.pdf', 'interview-day-playbook.pdf'],
]

const supabase = createClient(URL, KEY, { auth: { persistSession: false } })

// 1. Create the private bucket (idempotent).
const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: false })
if (bucketErr && !/already exists/i.test(bucketErr.message)) {
  console.error(`Bucket create failed: ${bucketErr.message}`)
  process.exit(1)
}
console.log(`Bucket "${BUCKET}" ready (private).`)

// 2. Upload each PDF.
let ok = 0
for (const [src, dest] of UPLOADS) {
  const abs = resolve(REPO, src)
  try {
    const info = await stat(abs)
    const body = await readFile(abs)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, body, { contentType: 'application/pdf', upsert: true })
    if (error) throw new Error(error.message)
    console.log(`  uploaded ${dest}  (${(info.size / 1048576).toFixed(1)} MB)`)
    ok++
  } catch (e) {
    console.error(`  FAILED ${dest}: ${e.message}`)
  }
}
console.log(`\nDone: ${ok}/${UPLOADS.length} PDFs uploaded to "${BUCKET}".`)
process.exit(ok === UPLOADS.length ? 0 : 1)
