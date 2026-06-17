import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
globalThis.WebSocket ??= ws

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const { data, error } = await s.storage.from(process.env.SUPABASE_EBOOKS_BUCKET || 'ebooks').list()
if (error) {
  console.log('KEY CHECK FAILED:', error.message)
  process.exit(1)
}
console.log('KEY OK — bucket holds:', data.map((f) => f.name).sort().join(', '))
