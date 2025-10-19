import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | DevopsInterview.Cloud',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Oops! The page you're looking for seems to have wandered off into the cloud.
            Don't worry, we'll help you get back on track.
          </p>
        </div>

        {/* Helpful Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Homepage
          </Link>
          <Link
            href="/#ebooks"
            className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all inline-flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Browse Ebooks
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Link href="/#ebooks" className="text-blue-600 hover:underline">
              Ebooks
            </Link>
            <Link href="/#categories" className="text-blue-600 hover:underline">
              Categories
            </Link>
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Us
            </Link>
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* DevOps Joke */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-muted-foreground italic">
            "This page is like a microservice without a health check - we can't find it either! 😅"
          </p>
        </div>
      </div>
    </div>
  )
}
