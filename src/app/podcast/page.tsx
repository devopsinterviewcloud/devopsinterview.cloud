import { Metadata } from 'next'
import Link from 'next/link'
import { createPageMetadata } from '@/config/site'
import { AMAZON_MUSIC_URL, SPOTIFY_URL } from '@/lib/podcast'

export const metadata: Metadata = createPageMetadata({
  title: 'DevOps & Cloud Interview Prep Podcast | DevOpsInterview.Cloud',
  description: 'Real DevOps and cloud interview scenarios, answered the way a senior engineer would. Listen on Spotify or Amazon Music.',
  path: '/podcast',
})

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-3">Podcast</p>
        <h1 className="text-4xl font-bold text-foreground mb-6">DevOps &amp; Cloud Interview Prep: Real Scenarios &amp; Answers</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Real DevOps and cloud interview scenarios, broken down the way a senior engineer would answer them:
          Kubernetes, AWS, Terraform, CI/CD, observability and incident response, with the trade-offs
          interviewers actually probe for.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800 transition-colors">
            Listen on Spotify
          </a>
          <a href={AMAZON_MUSIC_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors">
            Listen on Amazon Music
          </a>
        </div>
        <p className="text-muted-foreground">
          Want the full answers in writing? The <Link href="/ebooks" className="font-semibold text-blue-700 hover:underline">DevOps Interview Mastery ebooks</Link> cover
          252 senior-level questions across cloud, Kubernetes, Terraform, CI/CD and SRE.
        </p>
      </div>
    </div>
  )
}
