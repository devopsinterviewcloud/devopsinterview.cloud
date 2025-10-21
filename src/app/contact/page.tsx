'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Phone, Send, CheckCircle } from 'lucide-react'

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
    
    // Simulate form submission
    setTimeout(() => {
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about our DevOps and Cloud ebooks? Need help with your order? 
            We're here to help you advance your career.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Whether you need technical support, have questions about our content, or want to 
                suggest new topics, we'd love to hear from you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email Support</h3>
                  <p className="text-muted-foreground">support@devopsinterview.cloud</p>
                  <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Live Chat</h3>
                  <p className="text-muted-foreground">Available Monday - Friday</p>
                  <p className="text-sm text-muted-foreground">9 AM - 6 PM EST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Business Inquiries</h3>
                  <p className="text-muted-foreground">business@devopsinterview.cloud</p>
                  <p className="text-sm text-muted-foreground">Partnerships & collaboration</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone Support</h3>
                  <p className="text-muted-foreground">Available upon request</p>
                  <p className="text-sm text-muted-foreground">Email us for phone callback: support@devopsinterview.cloud</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Our Office</h3>
                  <p className="text-muted-foreground text-sm font-semibold">PROSPERA ENTERPRISES</p>
                  <p className="text-muted-foreground text-sm text-xs italic">(DBA: DevOpsInterview.Cloud)</p>
                  <p className="text-muted-foreground text-sm mt-2">34, Padmavathy Nagar, MMC</p>
                  <p className="text-muted-foreground text-sm">Chennai, Tamil Nadu 600051</p>
                  <p className="text-muted-foreground text-sm">India</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-foreground group-open:text-blue-600">
                    How do I download my ebook after purchase?
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground pl-4">
                    You'll receive an email with download links immediately after purchase. 
                    Check your spam folder if you don't see it within 5 minutes.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-foreground group-open:text-blue-600">
                    What formats are the ebooks available in?
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground pl-4">
                    All ebooks come in PDF, EPUB, and MOBI formats for maximum compatibility 
                    with your devices.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-foreground group-open:text-blue-600">
                    Do you offer bulk discounts for teams?
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground pl-4">
                    Yes! Contact us at business@devopsinterview.cloud for team pricing 
                    and volume discounts.
                  </p>
                </details>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 p-8 rounded-lg">
            {status === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a subject</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="order-inquiry">Order Inquiry</option>
                      <option value="content-suggestion">Content Suggestion</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {status === 'loading' ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}