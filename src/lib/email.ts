import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined')
}

const resend = new Resend(process.env.RESEND_API_KEY)

interface Ebook {
  id: string
  title: string
  coverUrl: string
  format: string[]
  fileUrl: string
}

interface SendDownloadEmailProps {
  email: string
  ebooks: Ebook[]
  orderId: string
}

export async function sendDownloadEmail({
  email,
  ebooks,
  orderId,
}: SendDownloadEmailProps) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Generate download links for each ebook
    const downloadLinks = ebooks.map(ebook => ({
      ...ebook,
      downloadUrl: `${appUrl}/download/${ebook.id}?orderId=${orderId}`,
    }))

    const html = generateDownloadEmailHtml({
      ebooks: downloadLinks,
      orderId,
    })

    const text = generateDownloadEmailText({
      ebooks: downloadLinks,
      orderId,
    })

    const { data, error } = await resend.emails.send({
      // Must be an address on a Resend-verified domain (NOT a @gmail address).
      from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
      // Replies go to the real inbox.
      replyTo: process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com',
      to: [email],
      subject: 'Your DevOpsInterview.Cloud Download Links',
      html,
      text,
    })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Email sending error:', error)
      throw error
    }

    return data
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending download email:', error)
    throw error
  }
}

function generateDownloadEmailHtml({
  ebooks,
  orderId,
}: {
  ebooks: Array<Ebook & { downloadUrl: string }>
  orderId: string
}) {
  const ebooksList = ebooks
    .map(
      ebook => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <img src="${ebook.coverUrl}" alt="${ebook.title}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px;" />
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${ebook.title}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280;">Formats: ${ebook.format.join(', ')}</p>
          <a href="${ebook.downloadUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 500;">Download Now</a>
        </div>
      </div>
    </div>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DevOpsInterview.Cloud Download</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1f2937; margin-bottom: 8px;">Thank You for Your Purchase!</h1>
    <p style="color: #6b7280; margin: 0;">Your ebooks are ready for download</p>
  </div>

  <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 16px 0; font-size: 20px;">Your Downloads</h2>
    ${ebooksList}
  </div>

  <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">Important Notes:</h3>
    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
      <li>Download links are valid for 72 hours</li>
      <li>You can download each file multiple times within this period</li>
      <li>Save the files to your device for permanent access</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 8px 0;">Need help? Contact our support team:</p>
    <p style="margin: 0;">
      <a href="mailto:devopsinterview.cloud@gmail.com" style="color: #3b82f6;">devopsinterview.cloud@gmail.com</a>
    </p>
  </div>

  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    <p>Order ID: ${orderId}</p>
    <p>&copy; 2026 DevOpsInterview.Cloud. All rights reserved.</p>
  </div>
</body>
</html>
  `
}

function generateDownloadEmailText({
  ebooks,
  orderId,
}: {
  ebooks: Array<Ebook & { downloadUrl: string }>
  orderId: string
}) {
  const ebooksList = ebooks
    .map(
      ebook => `
${ebook.title}
Formats: ${ebook.format.join(', ')}
Download: ${ebook.downloadUrl}
`
    )
    .join('\n')

  return `
Thank You for Your Purchase!

Your ebooks are ready for download:

${ebooksList}

IMPORTANT NOTES:
- Download links are valid for 72 hours
- You can download each file multiple times within this period
- Save the files to your device for permanent access

Need help? Contact our support team at devopsinterview.cloud@gmail.com

Order ID: ${orderId}

© 2026 DevOpsInterview.Cloud. All rights reserved.
  `
}

/**
 * Contact-form delivery: forwards a website enquiry to the support inbox.
 * `from` must be the Resend-verified domain; the sender's address goes in
 * replyTo so you can reply to the customer directly from your inbox.
 */
export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const to = process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com'
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="margin: 0 0 16px 0;">New contact-form message</h2>
  <p style="margin: 4px 0;"><strong>Name:</strong> ${esc(name)}</p>
  <p style="margin: 4px 0;"><strong>Email:</strong> ${esc(email)}</p>
  <p style="margin: 4px 0;"><strong>Subject:</strong> ${esc(subject)}</p>
  <div style="margin-top: 16px; padding: 16px; background:#f9fafb; border-radius: 8px; white-space: pre-wrap;">${esc(message)}</div>
</body>
</html>`
  const text = `New contact-form message

Name: ${name}
Email: ${email}
Subject: ${subject}

${message}`

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
    replyTo: email,
    to: [to],
    subject: `[Contact] ${subject} — from ${name}`,
    html,
    text,
  })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Contact email error:', error)
    throw error
  }
  return data
}

/**
 * Lead-magnet delivery: emails the free Cloud Interview Mastery sample (8 real
 * questions, one per chapter) to a new subscriber. The sample is served as a
 * static asset from /samples so this works even before Supabase storage is wired.
 */
export async function sendSampleEmail({ email }: { email: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const sampleUrl = `${appUrl}/samples/cloud-interview-mastery-sample.pdf`
  const bundleUrl = `${appUrl}/ebooks/complete-devops-mastery-bundle`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your free DevOps interview sample</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 28px;">
    <h1 style="color: #1f2937; margin-bottom: 8px;">Your free sample is ready</h1>
    <p style="color: #6b7280; margin: 0;">8 real interview questions, one from every chapter of Cloud Interview Mastery</p>
  </div>
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="${sampleUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Download the free sample (PDF)</a>
  </div>
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 0 0 8px 0;">Each question is answered the way a senior engineer actually would: the full answer, the tradeoffs, the follow-up an interviewer will probe, and a recall hook.</p>
    <p style="margin: 0;">This is 8 of the 50 questions in the full book. The complete edition runs 188 pages, and the <a href="${bundleUrl}" style="color: #3b82f6;">5-book bundle</a> covers 250+ senior-level questions across the whole path from cloud to production reliability.</p>
  </div>
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 8px 0;">Questions? Just reply to this email.</p>
    <p style="margin: 0;"><a href="mailto:devopsinterview.cloud@gmail.com" style="color: #3b82f6;">devopsinterview.cloud@gmail.com</a></p>
  </div>
  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    <p>You are receiving this because you requested the free sample at devopsinterview.cloud.</p>
    <p>&copy; 2026 DevOpsInterview.Cloud. All rights reserved.</p>
  </div>
</body>
</html>`

  const text = `Your free sample is ready

8 real interview questions, one from every chapter of Cloud Interview Mastery.

Download (PDF): ${sampleUrl}

Each question is answered the way a senior engineer actually would: the full answer, the tradeoffs, the follow-up an interviewer will probe, and a recall hook. This is 8 of the 50 questions in the full book (188 pages). The 5-book bundle covers 250+ senior-level questions: ${bundleUrl}

Questions? Just reply to this email, or write to devopsinterview.cloud@gmail.com

You are receiving this because you requested the free sample at devopsinterview.cloud.
© 2026 DevOpsInterview.Cloud. All rights reserved.`

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
    replyTo: process.env.EMAIL_REPLY_TO || 'devopsinterview.cloud@gmail.com',
    to: [email],
    subject: 'Your free DevOps interview sample (8 questions)',
    html,
    text,
  })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Sample email error:', error)
    throw error
  }
  return data
}