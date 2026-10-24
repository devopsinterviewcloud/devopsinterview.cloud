'use client'

import { useState } from 'react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const faqs = [
    {
      q: 'How do I download my ebook after purchase?',
      a: "You'll receive an email with download links immediately after purchase. Check your spam folder if you don't see it within 5 minutes.",
    },
    {
      q: 'What formats are the ebooks available in?',
      a: 'All ebooks are available in PDF format for maximum compatibility with your devices.',
    },
    {
      q: 'Do you offer bulk discounts for teams?',
      a: 'Yes! Contact us at devopsinterview.cloud@gmail.com for team pricing and volume discounts.',
    },
  ]

  return (
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap pt-8 sm:pt-10">
        <header className="pb-10 sm:pb-12">
          <span className="chip">Contact</span>
          <h1 className="display-1 mt-5">Contact Us</h1>
          <p className="mt-5 max-w-[40em] text-[18px] leading-normal sm:text-[20px]">
            Have questions about our DevOps and Cloud ebooks? Need help with your order?
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-12 lg:grid-cols-12">
          {/* Contact Information */}
          <div className="min-w-0 lg:col-span-5">
            <div className="border-t-2 border-ink pt-3.5">
              <h2 className="display-3">Get in Touch</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-subtle">
                Whether you need technical support, have questions about our content, or want to 
                suggest new topics, we'd love to hear from you.
              </p>
            </div>

            <div className="mt-6 border-t-2 border-ink">
              <div className="border-b border-hair py-4">
                <h3 className="font-semibold">Email Support</h3>
                <p className="mt-1 text-[16px] [overflow-wrap:anywhere]">devopsinterview.cloud@gmail.com</p>
                <p className="mt-0.5 text-[14px] text-subtle">Response within 24 hours</p>
              </div>
              <div className="border-b border-hair py-4">
                <h3 className="font-semibold">Business Inquiries</h3>
                <p className="mt-1 text-[16px] [overflow-wrap:anywhere]">devopsinterview.cloud@gmail.com</p>
                <p className="mt-0.5 text-[14px] text-subtle">Partnerships & collaboration</p>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="display-3">Frequently Asked Questions</h3>
              <div className="mt-4 border-t-2 border-ink">
                {faqs.map((f) => (
                  <details key={f.q} className="group border-b border-hair">
                    <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-3 text-[16px] font-semibold leading-snug [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="relative size-3 shrink-0" aria-hidden="true">
                        <span className="absolute inset-x-0 top-[5px] h-0.5 bg-ink" />
                        <span className="absolute inset-y-0 left-[5px] w-0.5 bg-ink group-open:hidden" />
                      </span>
                    </summary>
                    <p className="pb-4 text-[15px] leading-relaxed text-subtle [overflow-wrap:anywhere]">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="min-w-0 border-2 border-ink bg-sheet p-5 sm:p-8 lg:col-span-6 lg:col-start-7">
            {status === 'success' ? (
              <div role="status" className="py-4">
                <h3 className="display-3">Message Sent!</h3>
                <p className="mt-3 text-subtle">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <h2 className="display-3">Send us a Message</h2>
                {status === 'error' && (
                  <div role="alert" className="mt-5 border-l-[6px] border-book-red bg-paper px-4 py-3 text-[15px] leading-normal [overflow-wrap:anywhere]">
                    Something went wrong sending your message. Please try again, or email us directly at{' '}
                    <a href="mailto:devopsinterview.cloud@gmail.com" className="font-semibold underline underline-offset-4">
                      devopsinterview.cloud@gmail.com
                    </a>.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="field-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="field"
                        placeholder="Your full name"
                      />
                      <p className="field-error">Enter your name.</p>
                    </div>
                    <div>
                      <label htmlFor="email" className="field-label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="field"
                        placeholder="your@email.com"
                      />
                      <p className="field-error">Enter a valid email address.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="field-label">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="field"
                    >
                      <option value="">Select a subject</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="order-inquiry">Order Inquiry</option>
                      <option value="content-suggestion">Content Suggestion</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="other">Other</option>
                    </select>
                    <p className="field-error">Choose a subject.</p>
                  </div>

                  <div>
                    <label htmlFor="message" className="field-label">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="field"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                    <p className="field-error">Write a message.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
