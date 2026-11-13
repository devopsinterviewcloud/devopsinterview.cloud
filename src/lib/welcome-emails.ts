/**
 * The three emails that follow the free sample. The worked answers come from
 * book-contents.json (generated from the built books), and every count and price
 * from the catalog, so nothing here is written separately from the books.
 * Sent by /api/cron/welcome; see WELCOME_GAPS_DAYS for the spacing.
 */
import { bundle, bundleSavings, getContents, singleBooks, type BookExcerpt } from '@/lib/catalog'
import { splitTitle, topicLine } from '@/lib/book-style'

/** Signup sources whose form tells people the follow-up emails are coming. */
export const WELCOME_SOURCES = new Set(['home-free-sample', 'blog-sample', 'question-sample'])

/** Days to wait before email n+1, counted from the previous email (the sample is email 0). */
export const WELCOME_GAPS_DAYS = [2, 3, 4]

export const WELCOME_EMAIL_COUNT = WELCOME_GAPS_DAYS.length

export type WelcomeEmail = { subject: string; html: string; text: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const p = (s: string) => `<p style="margin: 0 0 16px 0;">${s}</p>`
const link = (href: string, label: string) => `<a href="${esc(href)}" style="color: #111111;">${esc(label)}</a>`
const button = (href: string, label: string) =>
  `<p style="margin: 24px 0;"><a href="${esc(href)}" style="display: inline-block; background-color: #111111; color: #ffffff; padding: 12px 22px; text-decoration: none; font-weight: 600;">${esc(label)}</a></p>`

function layout(title: string, bodyHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title></head>
<body style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #111111; max-width: 600px; margin: 0 auto; padding: 20px;">
${bodyHtml}
<div style="border-top: 1px solid #dddddd; margin-top: 32px; padding-top: 16px; font-size: 13px; color: #666666;">
  <p style="margin: 0 0 8px 0;">Questions about the books? Reply to this email.</p>
  <p style="margin: 0;">You're getting this because you asked for the free sample at devopsinterview.cloud. ${link(unsubscribeUrl, 'Unsubscribe')}</p>
</div>
</body>
</html>`
}

function footerText(unsubscribeUrl: string): string {
  return `\n\nQuestions about the books? Reply to this email.\nYou're getting this because you asked for the free sample at devopsinterview.cloud.\nUnsubscribe: ${unsubscribeUrl}`
}

const tagged = (appUrl: string, path: string, n: number) =>
  `${appUrl}${path}?utm_source=email&utm_medium=welcome&utm_campaign=welcome_${n}`

function excerptHtml(ex: BookExcerpt): string {
  return [
    `<h2 style="font-size: 20px; line-height: 1.35; margin: 24px 0 4px 0;">${esc(ex.question)}</h2>`,
    `<p style="margin: 0 0 20px 0; font-size: 13px; color: #666666;">${esc(ex.meta)}</p>`,
    `<h3 style="font-size: 16px; margin: 0 0 8px 0;">The 30-second answer</h3>`,
    p(esc(ex.answer30s)),
    `<h3 style="font-size: 16px; margin: 24px 0 8px 0;">Follow-ups to expect</h3>`,
    ...ex.followups.map((f) => p(`<strong>${esc(f.q)}</strong><br>${esc(f.a)}`)),
    p(`<strong>Recall hook:</strong> ${esc(ex.recallHook)} ${esc(ex.recallExpansion)}`),
  ].join('\n')
}

function excerptText(ex: BookExcerpt): string {
  return [
    ex.question,
    ex.meta,
    '',
    'The 30-second answer',
    ex.answer30s,
    '',
    'Follow-ups to expect',
    ...ex.followups.map((f) => `Q: ${f.q}\nA: ${f.a}\n`),
    `Recall hook: ${ex.recallHook} ${ex.recallExpansion}`,
  ].join('\n')
}

function workedAnswerEmail(
  n: number,
  slug: string,
  subject: string,
  intro: string,
  after: { html: string; text: string },
  appUrl: string,
  unsubscribeUrl: string,
): WelcomeEmail {
  const book = singleBooks.find((b) => b.slug === slug)!
  const contents = getContents(slug)!
  const name = splitTitle(book.title).name
  const bookUrl = tagged(appUrl, `/ebooks/${slug}`, n)
  const drill = 'A good drill: read the question, look away, and answer it out loud in 30 seconds. Then compare.'
  const bookLine = `In the book this question runs three pages: it adds a deep dive with a diagram, a decision framework and a table of pitfalls. ${name} has ${contents.questionCount} questions like it across ${contents.chapters.length} chapters.`

  const html = layout(
    subject,
    [
      p(esc(intro)),
      p(esc(drill)),
      excerptHtml(contents.excerpt),
      p(esc(bookLine)),
      button(bookUrl, `See the ${contents.questionCount} questions in ${name}`),
      after.html,
    ].join('\n'),
    unsubscribeUrl,
  )
  const text = [intro, '', drill, '', excerptText(contents.excerpt), '', bookLine, `See the ${contents.questionCount} questions: ${bookUrl}`, after.text]
    .join('\n')
    .concat(footerText(unsubscribeUrl))
  return { subject, html, text }
}

/** Email n (1-based) of the series. */
export function welcomeEmail(n: number, appUrl: string, unsubscribeUrl: string): WelcomeEmail {
  if (n === 1) {
    return workedAnswerEmail(
      1,
      'container-orchestration-journey',
      'Kubernetes canary deployments: a worked interview answer',
      "Since you asked for the free sample, here's one more question, this time from the Kubernetes book. Same format: a 30-second answer first, then the follow-ups an interviewer usually asks next.",
      { html: '', text: '' },
      appUrl,
      unsubscribeUrl,
    )
  }

  if (n === 2) {
    const questionsUrl = tagged(appUrl, '/questions', 2)
    const labsUrl = tagged(appUrl, '/labs', 2)
    return workedAnswerEmail(
      2,
      'infrastructure-automation-mastery',
      'Terraform state at scale: a worked interview answer',
      "State is where Terraform interviews tend to go past the basics, so here's how the Infrastructure as Code book answers one of the harder state questions.",
      {
        html: p(
          `If you'd rather practise than read, there are ${link(questionsUrl, 'shorter interview questions free on the site')}, grouped by topic, and an ${link(labsUrl, 'incident lab')} you can work through in the browser.`,
        ),
        text: `\nIf you'd rather practise than read, there are shorter interview questions free on the site, grouped by topic: ${questionsUrl}\nAnd an incident lab you can work through in the browser: ${labsUrl}`,
      },
      appUrl,
      unsubscribeUrl,
    )
  }

  // n === 3: the whole series, and the bundle.
  const s = bundleSavings()
  const bundleUrl = tagged(appUrl, `/ebooks/${bundle.slug}`, 3)
  const ebooksUrl = tagged(appUrl, '/ebooks', 3)
  const subject = "All five books, and what's in each"
  const intro = "This is the last of the welcome emails. You've now seen questions from three of the five books, so here's the whole series in one place."
  const books = singleBooks.map((b) => {
    const c = getContents(b.slug)!
    return { name: splitTitle(b.title).name, topic: topicLine(b.title), count: c.questionCount, chapters: c.chapters.map((ch) => ch.title) }
  })
  const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`
  const delivery = 'Each book is a PDF, emailed right after payment, and every order includes the Interview-Day Playbook free.'
  const price = `All five together are ${inr(s.bundleINR)} in India, against ${inr(s.separateINR)} bought one by one. Outside India they're $${s.bundleUSD.toFixed(2)}, against $${s.separateUSD.toFixed(2)}.`
  const single = `If you only need one topic, a single book is ${inr(singleBooks[0].priceINR)} or $${singleBooks[0].price.toFixed(2)}.`
  const outro = "After this you'll only hear from us when there's something new, like a new book."

  const html = layout(
    subject,
    [
      p(esc(intro)),
      `<ul style="margin: 0 0 16px 0; padding-left: 20px;">${books
        .map((b) => `<li style="margin-bottom: 10px;"><strong>${esc(b.name)}</strong> (${esc(b.topic)}): ${b.count} questions. Chapters: ${esc(b.chapters.join('; '))}.</li>`)
        .join('')}</ul>`,
      p(esc(delivery)),
      p(esc(price)),
      button(bundleUrl, 'See the five-book bundle'),
      p(`${esc(single)} ${link(ebooksUrl, 'Browse the books')}.`),
      p(esc(outro)),
    ].join('\n'),
    unsubscribeUrl,
  )
  const text = [
    intro,
    '',
    ...books.map((b) => `- ${b.name} (${b.topic}): ${b.count} questions. Chapters: ${b.chapters.join('; ')}.`),
    '',
    delivery,
    '',
    price,
    `See the bundle: ${bundleUrl}`,
    '',
    `${single} ${ebooksUrl}`,
    '',
    outro,
  ]
    .join('\n')
    .concat(footerText(unsubscribeUrl))
  return { subject, html, text }
}
