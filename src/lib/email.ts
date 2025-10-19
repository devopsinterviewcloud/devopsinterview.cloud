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
      from: 'DevOpsInterview.Cloud <noreply@devopsinterview.cloud>',
      to: [email],
      subject: 'Your DevOpsInterview.Cloud Download Links',
      html,
      text,
    })

    if (error) {
      console.error('Email sending error:', error)
      throw error
    }

    return data
  } catch (error) {
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
      <a href="mailto:support@devopsinterview.cloud" style="color: #3b82f6;">support@devopsinterview.cloud</a>
    </p>
  </div>

  <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
    <p>Order ID: ${orderId}</p>
    <p>&copy; 2024 DevOpsInterview.Cloud. All rights reserved.</p>
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

Need help? Contact our support team at support@devopsinterview.cloud

Order ID: ${orderId}

© 2024 DevOpsInterview.Cloud. All rights reserved.
  `
}