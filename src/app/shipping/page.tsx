import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | DevOpsInterview.Cloud',
  description: 'Learn about our digital product delivery process. Instant access to ebooks via email after purchase.',
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            Shipping &amp; Delivery Policy
          </h1>

          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg">
              <strong className="text-foreground">Last Updated:</strong> January 2025
            </p>

            {/* Digital Products - No Physical Shipping */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                Digital Product Delivery
              </h2>
              <p>
                DevOpsInterview.Cloud sells <strong>digital products only</strong>. All our ebooks are delivered electronically via email.
                There is <strong>no physical shipping</strong> involved in any of our transactions.
              </p>
            </section>

            {/* How Delivery Works */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                How Delivery Works
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Digital Delivery</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li><strong>Complete Your Purchase:</strong> After successful payment processing</li>
                  <li><strong>Receive Confirmation Email:</strong> Within 5-10 minutes to your registered email</li>
                  <li><strong>Download Your Ebooks:</strong> Click secure download links in the email</li>
                  <li><strong>Access Anytime:</strong> Download files are available for 72 hours</li>
                </ol>
              </div>
            </section>

            {/* Delivery Timeframe */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                Delivery Timeframe
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Standard Delivery:</strong> Within 5-10 minutes of purchase completion
                </li>
                <li>
                  <strong className="text-foreground">Peak Times:</strong> May take up to 30 minutes during high traffic periods
                </li>
                <li>
                  <strong className="text-foreground">Download Link Validity:</strong> 72 hours from email receipt
                </li>
                <li>
                  <strong className="text-foreground">Multiple Downloads:</strong> Allowed within the 72-hour window
                </li>
              </ul>
            </section>

            {/* Delivery Issues */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                Didn&apos;t Receive Your Email?
              </h2>
              <p>If you haven&apos;t received your download email within 30 minutes:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>Check Your Spam/Junk Folder:</strong> Our emails may be filtered</li>
                <li><strong>Verify Email Address:</strong> Ensure you entered the correct email during checkout</li>
                <li><strong>Check Promotions Tab:</strong> Gmail users should check the Promotions tab</li>
                <li><strong>Whitelist Our Domain:</strong> Add noreply@devopsinterview.cloud to your contacts</li>
                <li><strong>Contact Support:</strong> Email support@devopsinterview.cloud with your order details</li>
              </ol>
            </section>

            {/* File Formats */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                File Formats &amp; Compatibility
              </h2>
              <p>Our ebooks are delivered in the following formats:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-foreground">PDF:</strong> Compatible with all devices (Adobe Reader, browsers, mobile apps)</li>
                <li><strong className="text-foreground">EPUB:</strong> Compatible with most e-readers (Kindle, Kobo, Apple Books)</li>
                <li><strong className="text-foreground">MOBI:</strong> Optimized for Amazon Kindle devices</li>
              </ul>
              <p className="mt-4">
                All files are DRM-free, allowing you to read them on any device without restrictions.
              </p>
            </section>

            {/* International Delivery */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                International Availability
              </h2>
              <p>
                Since our products are delivered digitally, they are available <strong>worldwide</strong> with no additional shipping charges.
                Customers from any country can purchase and receive instant access to our ebooks.
              </p>
              <p>
                <strong className="text-foreground">No Customs, No Duties, No Delays:</strong> Digital delivery means no international shipping
                complications or additional fees.
              </p>
            </section>

            {/* Redelivery */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                Redelivery &amp; Lost Access
              </h2>
              <p>
                If your download links have expired or you&apos;ve lost access to your purchased ebooks:
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <p className="font-semibold text-foreground">📧 Contact Support for Redelivery</p>
                <p className="mt-2">Email: <a href="mailto:support@devopsinterview.cloud" className="text-blue-600 hover:underline">support@devopsinterview.cloud</a></p>
                <p className="mt-2">Provide:</p>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Your order confirmation email or order ID</li>
                  <li>Email address used during purchase</li>
                  <li>Date of purchase (approximate)</li>
                </ul>
                <p className="mt-2 text-sm">We typically respond within 24 hours and will resend your download links.</p>
              </div>
            </section>

            {/* Technical Support */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                Technical Support
              </h2>
              <p>
                If you experience any technical issues with downloading or accessing your ebooks, our support team is here to help:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email: <a href="mailto:support@devopsinterview.cloud" className="text-blue-600 hover:underline">support@devopsinterview.cloud</a></li>
                <li>Response Time: Within 24 hours (Monday-Friday, 9 AM - 6 PM IST)</li>
              </ul>
            </section>

            {/* No Physical Address */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
                No Physical Shipping
              </h2>
              <p>
                <strong className="text-foreground">Important:</strong> We do not offer physical shipping or printed versions of our ebooks.
                All products are digital downloads only. If you require a printed version, you may print the PDF files for personal use in
                accordance with our Terms of Service.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4 mt-12 pt-8 border-t">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Contact Information
              </h2>
              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="font-semibold text-foreground mb-3">DevOpsInterview.Cloud</p>
                <p>34, Padmavathy Nagar, MMC</p>
                <p>Chennai, Tamil Nadu 600051</p>
                <p>India</p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:support@devopsinterview.cloud" className="text-blue-600 hover:underline">support@devopsinterview.cloud</a>
                </p>
                <p>
                  <strong>Phone:</strong> Available upon request via email
                </p>
                <p className="mt-4 text-sm">
                  <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM IST
                </p>
              </div>
            </section>

            {/* Footer Note */}
            <section className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                This Shipping &amp; Delivery Policy applies to all purchases made through DevOpsInterview.Cloud.
                We reserve the right to update this policy at any time. Please review this page periodically for changes.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                For refund and cancellation policies, please visit our{' '}
                <a href="/refunds" className="text-blue-600 hover:underline">Refund Policy</a> page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
