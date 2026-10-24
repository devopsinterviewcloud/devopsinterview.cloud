import { Metadata } from 'next'
import { createPageMetadata } from '@/config/site'

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy | DevOpsInterview.Cloud',
  description: 'Learn what personal information DevOpsInterview.Cloud collects, how it is used and protected, when it is shared, and how to exercise your privacy rights.',
  path: '/privacy',
})

export default function PrivacyPolicy() {
  return (
    <main id="main" className="bg-sheet text-[17px]">
      <div className="mx-auto w-[min(680px,100%_-_32px)] pt-10 pb-16 sm:pt-14 sm:pb-20">
        <div className="mb-10">
          <h1 className="display-2 text-[40px] sm:text-[56px]">Privacy Policy</h1>
          <p className="meta mt-5 text-subtle">Last updated: September 14, 2026</p>
        </div>

        <div className="prose-article">
          <section>
            <h2>Information We Collect</h2>
            <p>
              At DevOpsInterview.Cloud, we collect information you provide directly to us, such as when you:
            </p>
            <ul>
              <li>Purchase our DevOps and Cloud ebooks</li>
              <li>Subscribe to our newsletter for DevOps insights</li>
              <li>Contact us for support or inquiries</li>
              <li>Create an account on our platform</li>
            </ul>
            <p>
              This may include your name, email address, payment information, and communication preferences.
            </p>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process your ebook purchases and deliver digital content</li>
              <li>Send you DevOps and Cloud interview preparation materials</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Send newsletters with latest DevOps trends and new ebook releases</li>
              <li>Improve our content and services based on your feedback</li>
              <li>Comply with legal obligations and protect against fraud</li>
            </ul>
          </section>

          <section>
            <h2>Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties except:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To trusted service providers who help us operate our website and deliver services</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. All payment processing is 
              handled through secure, PCI-compliant payment processors.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Request data portability</li>
              <li>Lodge a complaint with supervisory authorities</li>
            </ul>
          </section>

          <section>
            <h2>Cookies and Tracking</h2>
            <p>
              We use cookieless Vercel Web Analytics to understand aggregate site traffic and
              conversion events. These events do not include the email address or payment details
              you enter at checkout. Your currency preference is stored locally in your browser.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at devopsinterview.cloud@gmail.com or through our contact page.
            </p>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the 
              "Last updated" date above.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
