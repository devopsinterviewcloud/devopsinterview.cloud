import { Metadata } from 'next'
import { createPageMetadata } from '@/config/site'

export const metadata: Metadata = createPageMetadata({
  title: 'Digital Ebook Delivery Policy | DevOpsInterview.Cloud',
  description: 'Learn how DevOpsInterview.Cloud delivers digital ebooks by email, typical delivery times, download-link availability, compatible formats, and support options.',
  path: '/shipping',
})

export default function ShippingPage() {
  return (
    <main id="main" className="bg-sheet text-[17px]">
      <div className="mx-auto w-[min(680px,100%_-_32px)] pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div>
          <h1 className="display-2 mb-5 text-[40px] sm:text-[56px]">
            Shipping &amp; Delivery Policy
          </h1>

          <div className="prose-article">
            <p className="meta mb-10 text-subtle">
              <strong>Last Updated:</strong> June 2026
            </p>

            {/* Digital Products - No Physical Shipping */}
            <section>
              <h2>
                Digital Product Delivery
              </h2>
              <p>
                DevOpsInterview.Cloud sells <strong>digital products only</strong>. All our ebooks are delivered electronically via email.
                There is <strong>no physical shipping</strong> involved in any of our transactions.
              </p>
            </section>

            {/* How Delivery Works */}
            <section>
              <h2>
                How Delivery Works
              </h2>
              <div className="mb-5 border-l-[6px] border-ink bg-paper px-5 py-4 [&>:last-child]:mb-0">
                <h3 className="mt-0">Instant Digital Delivery</h3>
                <ol>
                  <li><strong>Complete Your Purchase:</strong> After successful payment processing</li>
                  <li><strong>Receive Confirmation Email:</strong> Within 5-10 minutes to your registered email</li>
                  <li><strong>Download Your Ebooks:</strong> Click secure download links in the email</li>
                  <li><strong>Access Anytime:</strong> Download files are available for 72 hours</li>
                </ol>
              </div>
            </section>

            {/* Delivery Timeframe */}
            <section>
              <h2>
                Delivery Timeframe
              </h2>
              <ul>
                <li>
                  <strong>Standard Delivery:</strong> Within 5-10 minutes of purchase completion
                </li>
                <li>
                  <strong>Peak Times:</strong> May take up to 30 minutes during high traffic periods
                </li>
                <li>
                  <strong>Download Link Validity:</strong> 72 hours from email receipt
                </li>
                <li>
                  <strong>Multiple Downloads:</strong> Allowed within the 72-hour window
                </li>
              </ul>
            </section>

            {/* Delivery Issues */}
            <section>
              <h2>
                Didn&apos;t Receive Your Email?
              </h2>
              <p>If you haven&apos;t received your download email within 30 minutes:</p>
              <ol>
                <li><strong>Check Your Spam/Junk Folder:</strong> Our emails may be filtered</li>
                <li><strong>Verify Email Address:</strong> Ensure you entered the correct email during checkout</li>
                <li><strong>Check Promotions Tab:</strong> Gmail users should check the Promotions tab</li>
                <li><strong>Whitelist Our Domain:</strong> Add noreply@devopsinterview.cloud to your contacts</li>
                <li><strong>Contact Support:</strong> Email devopsinterview.cloud@gmail.com with your order details</li>
              </ol>
            </section>

            {/* File Formats */}
            <section>
              <h2>
                File Formats &amp; Compatibility
              </h2>
              <p>Our ebooks are delivered as:</p>
              <ul>
                <li><strong>PDF:</strong> Compatible with all devices (Adobe Reader, browsers, and mobile apps), with a fixed, print-quality layout</li>
              </ul>
              <p>
                All files are DRM-free, allowing you to read them on any device without restrictions.
              </p>
            </section>

            {/* International Delivery */}
            <section>
              <h2>
                International Availability
              </h2>
              <p>
                Since our products are delivered digitally, they are available <strong>worldwide</strong> with no additional shipping charges.
                Customers from any country can purchase and receive instant access to our ebooks.
              </p>
              <p>
                <strong>No Customs, No Duties, No Delays:</strong> Digital delivery means no international shipping
                complications or additional fees.
              </p>
            </section>

            {/* Redelivery */}
            <section>
              <h2>
                Redelivery &amp; Lost Access
              </h2>
              <p>
                If your download links have expired or you&apos;ve lost access to your purchased ebooks:
              </p>
              <div className="mb-5 border-l-[6px] border-ink bg-paper px-5 py-4 [&>:last-child]:mb-0">
                <p className="font-semibold">📧 Contact Support for Redelivery</p>
                <p>Email: <a href="mailto:devopsinterview.cloud@gmail.com">devopsinterview.cloud@gmail.com</a></p>
                <p>Provide:</p>
                <ul>
                  <li>Your order confirmation email or order ID</li>
                  <li>Email address used during purchase</li>
                  <li>Date of purchase (approximate)</li>
                </ul>
                <p className="text-[15px]">We typically respond within 24 hours and will resend your download links.</p>
              </div>
            </section>

            {/* Technical Support */}
            <section>
              <h2>
                Technical Support
              </h2>
              <p>
                If you experience any technical issues with downloading or accessing your ebooks, our support team is here to help:
              </p>
              <ul>
                <li>Email: <a href="mailto:devopsinterview.cloud@gmail.com">devopsinterview.cloud@gmail.com</a></li>
              </ul>
            </section>

            {/* No Physical Address */}
            <section>
              <h2>
                No Physical Shipping
              </h2>
              <p>
                <strong>Important:</strong> We do not offer physical shipping or printed versions of our ebooks.
                All products are digital downloads only. If you require a printed version, you may print the PDF files for personal use in
                accordance with our Terms of Service.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2>
                Contact Information
              </h2>
              <div className="mb-5 bg-paper px-5 py-4 [&>:last-child]:mb-0">
                <p>
                  <strong>Email:</strong> <a href="mailto:devopsinterview.cloud@gmail.com">devopsinterview.cloud@gmail.com</a>
                </p>
              </div>
            </section>

            {/* Footer Note */}
            <section className="mt-12 border-t border-hair pt-6">
              <p className="text-[15px] text-subtle">
                This Shipping &amp; Delivery Policy applies to all purchases made through DevOpsInterview.Cloud.
                We reserve the right to update this policy at any time. Please review this page periodically for changes.
              </p>
              <p className="text-[15px] text-subtle">
                For refund and cancellation policies, please visit our{' '}
                <a href="/refunds">Refund Policy</a> page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
