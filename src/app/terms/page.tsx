import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - DevopsInterview.Cloud',
  description: 'Read the terms and conditions for purchasing and using DevopsInterview.Cloud ebooks. Learn about license terms, usage rights, and service policies.',
  openGraph: {
    title: 'Terms of Service - DevopsInterview.Cloud',
    description: 'Terms and conditions for purchasing and using DevopsInterview.Cloud ebooks.',
    url: 'https://devopsinterview.cloud/terms',
  },
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p>
              By accessing and using DevopsInterview.Cloud, you accept and agree to be bound by the 
              terms and provision of this agreement. If you do not agree to abide by these terms, 
              please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
            <p className="mb-4">
              DevopsInterview.Cloud provides:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Digital ebooks covering DevOps, Cloud, AWS, Azure, GCP, Kubernetes, Docker, and related technologies</li>
              <li>Interview preparation materials for DevOps and Cloud engineering roles</li>
              <li>Educational content and resources for professional development</li>
              <li>Newsletter with industry insights and career guidance</li>
              <li>YouTube channel with free tutorials and interview tips</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Purchase Terms</h2>
            <p className="mb-4">
              When you purchase digital ebooks from our platform:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>All sales are final upon successful download</li>
              <li>You receive a personal, non-transferable license to use the content</li>
              <li>Ebooks are delivered in PDF, EPUB, and MOBI formats where available</li>
              <li>Payment is processed securely through our payment partners</li>
              <li>You will receive email confirmation and download links</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
            <p className="mb-4">
              All content on DevopsInterview.Cloud, including ebooks, articles, videos, and materials are:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Protected by copyright and other intellectual property laws</li>
              <li>Owned by DevopsInterview.Cloud or our content partners</li>
              <li>Licensed to you for personal, non-commercial use only</li>
              <li>Not to be redistributed, shared, or resold without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Share purchased ebooks with others or distribute them publicly</li>
              <li>Use our content for commercial purposes without authorization</li>
              <li>Attempt to reverse engineer or extract content from our materials</li>
              <li>Engage in any activity that disrupts our services</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
            <p>
              Our educational materials are provided "as is" without any warranty. While we strive 
              for accuracy and quality, we cannot guarantee that our content will meet your specific 
              needs or lead to particular career outcomes. Use of our materials is at your own discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p>
              DevopsInterview.Cloud shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of our services or materials, 
              even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account and access to our services 
              at our sole discretion, without notice, for conduct that violates these Terms of Service 
              or is harmful to other users or our business.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective 
              immediately upon posting on this page. Your continued use of our services after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at 
              legal@devopsinterview.cloud or through our contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}