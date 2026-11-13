/**
 * @jest-environment node
 */
// The welcome emails take their answers and numbers from the built books and the
// catalog, carry an unsubscribe link, and keep to the site's prose rules.
import { welcomeEmail, WELCOME_EMAIL_COUNT } from './welcome-emails'
import { bundleSavings, getContents } from './catalog'

const unsub = 'https://example.com/unsubscribe?s=sub_1&t=tok'

test('there are three emails, each with an unsubscribe link and tagged links', () => {
  expect(WELCOME_EMAIL_COUNT).toBe(3)
  for (let n = 1; n <= 3; n++) {
    const e = welcomeEmail(n, 'https://example.com', unsub)
    expect(e.subject.length).toBeGreaterThan(10)
    expect(e.html).toContain('href="https://example.com/unsubscribe?s=sub_1&amp;t=tok"')
    expect(e.text).toContain(`Unsubscribe: ${unsub}`)
    expect(e.text).toContain(`utm_campaign=welcome_${n}`)
    // No em or en dashes in the prose (house style).
    expect(e.html + e.subject).not.toMatch(/[–—]/)
    expect(e.text).not.toMatch(/[–—]/)
  }
})

test("emails 1 and 2 carry the books' own worked answers", () => {
  const k8s = getContents('container-orchestration-journey')!.excerpt
  const iac = getContents('infrastructure-automation-mastery')!.excerpt
  expect(welcomeEmail(1, 'https://example.com', unsub).text).toContain(k8s.answer30s)
  expect(welcomeEmail(1, 'https://example.com', unsub).text).toContain(k8s.followups[2].a)
  expect(welcomeEmail(2, 'https://example.com', unsub).text).toContain(iac.answer30s)
})

test('email 3 prices come from the catalog', () => {
  const s = bundleSavings()
  const text = welcomeEmail(3, 'https://example.com', unsub).text
  expect(text).toContain(`₹${s.bundleINR.toLocaleString('en-IN')}`)
  expect(text).toContain(`₹${s.separateINR.toLocaleString('en-IN')}`)
  expect(text).toContain(`$${s.bundleUSD.toFixed(2)}`)
  expect(text).toContain(`$${s.separateUSD.toFixed(2)}`)
})
