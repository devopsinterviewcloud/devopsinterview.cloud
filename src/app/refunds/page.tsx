import { Metadata } from 'next'
import { createPageMetadata } from '@/config/site'

export const metadata: Metadata = createPageMetadata({
  title: 'Ebook Refund Policy | DevOpsInterview.Cloud',
  description: 'Review the refund and cancellation policy for DevOpsInterview.Cloud digital ebooks, including final-sale terms and help for duplicate or technical issues.',
  path: '/refunds',
})

export default function RefundPolicy() {
  return (
    <main id="main" className="bg-sheet text-[17px]">
      <div className="mx-auto w-[min(680px,100%_-_32px)] pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="mb-10">
          <h1 className="display-2 text-[40px] sm:text-[56px]">Refund Policy</h1>
          <p className="meta mt-5 text-subtle">Last updated: June 15, 2026</p>
        </div>

        <div className="prose-article">
          <section>
            <h2>Digital Product Refund Policy</h2>
            <p>
              At DevOpsInterview.Cloud, we stand behind the quality of our DevOps and Cloud ebooks. 
              We want you to be completely satisfied with your purchase. However, due to the digital 
              nature of our products, we have specific refund guidelines.
            </p>
          </section>

          <section>
            <h2>All Sales Are Final</h2>
            <p>
              Due to the instant digital nature of our DevOps and Cloud ebooks, all sales are final
              upon successful download. We cannot offer refunds once you have accessed the digital content.
            </p>
            <p>
              However, we are committed to your satisfaction and will work with you in the following exceptional circumstances:
            </p>
            <ul>
              <li>Technical issues that prevent you from downloading or accessing the purchased content</li>
              <li>Duplicate purchases made by mistake (we'll issue credit or transfer)</li>
              <li>The content significantly differs from what was described on the product page</li>
              <li>The ebook contains critical errors that make it unusable</li>
            </ul>
          </section>

          <section>
            <h2>Order Cancellation</h2>
            <p>
              Because delivery is automatic and instant, an order cannot be cancelled once payment is
              confirmed and the download links have been issued. If your payment is still pending or you
              have not yet received your download, email devopsinterview.cloud@gmail.com and we will
              cancel the order and reverse any amount that was captured.
            </p>
          </section>

          <section>
            <h2>How to Request Support</h2>
            <p>If you're experiencing issues with your purchase:</p>
            <ol>
              <li>Contact our support team at devopsinterview.cloud@gmail.com</li>
              <li>Include your order number and detailed description of the issue</li>
              <li>Provide screenshots or error messages if applicable</li>
              <li>Our team will review your request within 2 business days</li>
            </ol>
            <p>
              We're committed to resolving technical issues and ensuring you can access your purchased content.
            </p>
          </section>

          <section>
            <h2>Exceptional Circumstances</h2>
            <p>In rare cases where a refund is warranted due to the exceptional circumstances listed above:</p>
            <ul>
              <li>Refunds will be processed to your original payment method</li>
              <li>Processing time: 3-5 business days for credit cards</li>
              <li>Bank transfers may take 5-7 business days</li>
              <li>You will receive email confirmation once approved and processed</li>
            </ul>
          </section>

          <section>
            <h2>Non-Refundable Situations</h2>
            <p>As all sales are final, refunds cannot be provided in the following cases:</p>
            <ul>
              <li>Changed mind or no longer need the content after download</li>
              <li>Purchased the wrong item without reviewing the product description</li>
              <li>Technical issues on your end (device compatibility, software requirements)</li>
              <li>File format preferences (all formats are clearly listed before purchase)</li>
              <li>Content difficulty level doesn't match your expectations</li>
            </ul>
            <p>
              <strong>Please review product descriptions, sample chapters, and system requirements carefully before purchasing.</strong>
            </p>
          </section>

          <section>
            <h2>Bundle and Package Deals</h2>
            <p>
              For bundle purchases containing multiple ebooks, refunds are typically processed 
              for the entire bundle rather than individual items. However, we evaluate each 
              case individually and may offer partial refunds in exceptional circumstances.
            </p>
          </section>

          <section>
            <h2>Free Content and Samples</h2>
            <p>
              We encourage you to review our free content samples before making a purchase. 
              This helps ensure our content meets your expectations and reduces the need 
              for refunds.
            </p>
          </section>

          <section>
            <h2>Technical Support</h2>
            <p>
              Before requesting a refund for technical issues, please contact our support team:
            </p>
            <ul>
              <li>Email: devopsinterview.cloud@gmail.com</li>
              <li>Response time: Within 24 hours</li>
              <li>We'll help resolve download, access, or formatting issues</li>
            </ul>
          </section>

          <section>
            <h2>Dispute Resolution</h2>
            <p>
              If you're not satisfied with our refund decision, you may escalate the matter 
              to our management team at devopsinterview.cloud@gmail.com. We aim to resolve 
              all disputes fairly and promptly.
            </p>
          </section>

          <section>
            <h2>Quality Commitment</h2>
            <p>
              We continuously update our content to ensure it remains current with the latest 
              DevOps and Cloud technologies. Customers who purchased older versions may receive 
              free updates when significant revisions are made.
            </p>
          </section>

          <section>
            <h2>Contact Information</h2>
            <p>
              For refund requests or questions about this policy:
            </p>
            <ul className="list-none pl-0">
              <li className="mb-2"><strong>Email:</strong> devopsinterview.cloud@gmail.com</li>
            </ul>
            <p>
              We value your satisfaction and will work with you to resolve any concerns 
              about your purchase.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
