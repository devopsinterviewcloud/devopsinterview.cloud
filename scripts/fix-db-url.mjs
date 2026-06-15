/**
 * Percent-encode the password inside DATABASE_URL in .env so Prisma can parse it.
 * Non-destructive preview by default; pass --write to apply.
 * Host has no '@', so the password is everything between the first ':' after the
 * user and the LAST '@'.
 */
import { readFile, writeFile } from 'node:fs/promises'

const ENV = new URL('../.env', import.meta.url)
const text = await readFile(ENV, 'utf8')
const line = text.split('\n').find((l) => l.startsWith('DATABASE_URL='))
if (!line) { console.log('No DATABASE_URL line found.'); process.exit(1) }

const raw = line.replace(/^DATABASE_URL=/, '').replace(/^"|"$/g, '')
const m = raw.match(/^(postgresql:\/\/[^:/]+:)([\s\S]*)(@[^@]+)$/)
if (!m) { console.log('Could not parse DATABASE_URL shape.'); process.exit(1) }
const [, prefix, password, tail] = m

const mask = (s) => (s.length <= 2 ? '**' : s[0] + '*'.repeat(s.length - 2) + s[s.length - 1])
const specials = [...new Set(password.split('').filter((c) => !/[A-Za-z0-9]/.test(c)))]
const looksEncoded = /%[0-9A-Fa-f]{2}/.test(password)
const encoded = encodeURIComponent(password)

console.log('password length :', password.length, '  masked:', mask(password))
console.log('special chars   :', specials.length ? specials.join(' ') : '(none)')
console.log('already encoded?:', looksEncoded ? 'maybe (contains %XX) — NOT touching' : 'no')
console.log('needs encoding? :', encoded !== password ? 'YES' : 'no (problem is elsewhere)')

if (process.argv.includes('--write')) {
  if (looksEncoded) { console.log('\nRefusing to double-encode. Re-paste the RAW password and rerun.'); process.exit(1) }
  if (encoded === password) { console.log('\nNothing to encode; not writing.'); process.exit(0) }
  const fixed = text.replace(line, `DATABASE_URL="${prefix}${encoded}${tail}"`)
  await writeFile(ENV, fixed)
  console.log('\n.env updated: password percent-encoded in DATABASE_URL.')
}
