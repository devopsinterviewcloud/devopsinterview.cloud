import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - DevopsInterview.Cloud',
  description: 'Learn how DevopsInterview.Cloud collects, uses, and protects your personal information. Read our comprehensive privacy policy for DevOps and Cloud ebook purchases.',
  openGraph: {
    title: 'Privacy Policy - DevopsInterview.Cloud',
    description: 'Learn how DevopsInterview.Cloud collects, uses, and protects your personal information.',
    url: 'https://devopsinterview.cloud/privacy',
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-4">
              At DevopsInterview.Cloud, we collect information you provide directly to us, such as when you:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Purchase our DevOps and Cloud ebooks</li>
              <li>Subscribe to our newsletter for DevOps insights</li>
              <li>Contact us for support or inquiries</li>
              <li>Create an account on our platform</li>
            </ul>
            <p>
              This may include your name, email address, payment information, and communication preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Process your ebook purchases and deliver digital content</li>
              <li>Send you DevOps and Cloud interview preparation materials</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Send newsletters with latest DevOps trends and new ebook releases</li>
              <li>Improve our content and services based on your feedback</li>
              <li>Comply with legal obligations and protect against fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties except:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>With your explicit consent</li>
              <li>To trusted service providers who help us operate our website and deliver services</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. All payment processing is 
              handled through secure, PCI-compliant payment processors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access and update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Request data portability</li>
              <li>Lodge a complaint with supervisory authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your browsing experience, 
              analyze site traffic, and personalize content. You can control cookie settings 
              through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us at privacy@devopsinterview.cloud or through our contact page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the 
              "Last updated" date above.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}