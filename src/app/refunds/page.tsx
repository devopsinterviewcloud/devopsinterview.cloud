import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy - DevopsInterview.Cloud',
  description: 'Understand our refund policy for DevOps and Cloud ebook purchases. All sales are final upon download with exceptions for technical issues and errors.',
  openGraph: {
    title: 'Refund Policy - DevopsInterview.Cloud',
    description: 'Our refund policy for DevOps and Cloud ebook purchases. All sales are final with limited exceptions.',
    url: 'https://devopsinterview.cloud/refunds',
  },
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Digital Product Refund Policy</h2>
            <p className="mb-4">
              At DevopsInterview.Cloud, we stand behind the quality of our DevOps and Cloud ebooks. 
              We want you to be completely satisfied with your purchase. However, due to the digital 
              nature of our products, we have specific refund guidelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">All Sales Are Final</h2>
            <p className="mb-4">
              Due to the instant digital nature of our DevOps and Cloud ebooks, all sales are final
              upon successful download. We cannot offer refunds once you have accessed the digital content.
            </p>
            <p className="mb-4">
              However, we are committed to your satisfaction and will work with you in the following exceptional circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Technical issues that prevent you from downloading or accessing the purchased content</li>
              <li>Duplicate purchases made by mistake (we'll issue credit or transfer)</li>
              <li>The content significantly differs from what was described on the product page</li>
              <li>The ebook contains critical errors that make it unusable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Request Support</h2>
            <p className="mb-4">If you're experiencing issues with your purchase:</p>
            <ol className="list-decimal pl-6 mb-4">
              <li>Contact our support team at support@devopsinterview.cloud</li>
              <li>Include your order number and detailed description of the issue</li>
              <li>Provide screenshots or error messages if applicable</li>
              <li>Our team will review your request within 2 business days</li>
            </ol>
            <p>
              We're committed to resolving technical issues and ensuring you can access your purchased content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Exceptional Circumstances</h2>
            <p className="mb-4">In rare cases where a refund is warranted due to the exceptional circumstances listed above:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Refunds will be processed to your original payment method</li>
              <li>Processing time: 3-5 business days for credit cards</li>
              <li>Bank transfers may take 5-7 business days</li>
              <li>You will receive email confirmation once approved and processed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Non-Refundable Situations</h2>
            <p className="mb-4">As all sales are final, refunds cannot be provided in the following cases:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Changed mind or no longer need the content after download</li>
              <li>Purchased the wrong item without reviewing the product description</li>
              <li>Technical issues on your end (device compatibility, software requirements)</li>
              <li>File format preferences (all formats are clearly listed before purchase)</li>
              <li>Content difficulty level doesn't match your expectations</li>
            </ul>
            <p className="mt-4">
              <strong>Please review product descriptions, sample chapters, and system requirements carefully before purchasing.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Bundle and Package Deals</h2>
            <p>
              For bundle purchases containing multiple ebooks, refunds are typically processed 
              for the entire bundle rather than individual items. However, we evaluate each 
              case individually and may offer partial refunds in exceptional circumstances.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Free Content and Samples</h2>
            <p>
              We encourage you to review our free content samples before making a purchase. 
              This helps ensure our content meets your expectations and reduces the need 
              for refunds.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Technical Support</h2>
            <p className="mb-4">
              Before requesting a refund for technical issues, please contact our support team:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email: support@devopsinterview.cloud</li>
              <li>Response time: Within 24 hours</li>
              <li>We'll help resolve download, access, or formatting issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            <p>
              If you're not satisfied with our refund decision, you may escalate the matter 
              to our management team at disputes@devopsinterview.cloud. We aim to resolve 
              all disputes fairly and promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quality Commitment</h2>
            <p>
              We continuously update our content to ensure it remains current with the latest 
              DevOps and Cloud technologies. Customers who purchased older versions may receive 
              free updates when significant revisions are made.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="mb-4">
              For refund requests or questions about this policy:
            </p>
            <ul className="list-none">
              <li className="mb-2"><strong>Email:</strong> refunds@devopsinterview.cloud</li>
              <li className="mb-2"><strong>Support:</strong> support@devopsinterview.cloud</li>
              <li className="mb-2"><strong>Response Time:</strong> Within 2 business days</li>
            </ul>
            <p>
              We value your satisfaction and will work with you to resolve any concerns 
              about your purchase.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}