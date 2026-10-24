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
    <main id="main" className="pb-16 text-[17px]">
      <div className="wrap pt-8 sm:pt-10">
        <div className="max-w-[46em]">
          <span className="chip">Podcast</span>
          <h1 className="display-1 mt-5">DevOps &amp; Cloud Interview Prep: Real Scenarios &amp; Answers</h1>
          <p className="mt-6 max-w-[40em] text-[18px] leading-normal sm:text-[20px]">
            Real DevOps and cloud interview scenarios, broken down the way a senior engineer would answer them:
            Kubernetes, AWS, Terraform, CI/CD, observability and incident response, with the trade-offs
            interviewers actually probe for.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Listen on Spotify
            </a>
            <a href={AMAZON_MUSIC_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Listen on Amazon Music
            </a>
          </div>
          <p className="mt-12 border-t-2 border-ink pt-4 text-[16px] leading-relaxed text-subtle">
            Want the full answers in writing? The <Link href="/ebooks" className="font-semibold text-ink underline underline-offset-4 hover:decoration-2">DevOps Interview Mastery ebooks</Link> cover
            252 senior-level questions across cloud, Kubernetes, Terraform, CI/CD and SRE.
          </p>
        </div>
      </div>
    </main>
  )
}
