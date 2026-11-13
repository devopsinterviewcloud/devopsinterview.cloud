import TrackedLink from '@/components/TrackedLink'
import { DynamicPriceText } from '@/components/DynamicPriceText'
import { bundle, totalQuestions } from '@/lib/catalog'

// Single-book callouts also offer the bundle, the better deal for most readers.
export default function BundleLine({
  eventName,
  eventProperties,
  className = 'mt-4 text-[15px] leading-relaxed text-subtle',
}: {
  eventName: string
  eventProperties: Record<string, string>
  className?: string
}) {
  return (
    <p className={className}>
      Preparing for more than one round?{' '}
      <TrackedLink
        href={`/ebooks/${bundle.slug}`}
        eventName={eventName}
        eventProperties={{ ...eventProperties, destination: 'bundle' }}
        className="font-semibold text-ink underline underline-offset-4 hover:decoration-2"
      >
        Get all five books for <DynamicPriceText usdPrice={bundle.price} />
      </TrackedLink>
      : {totalQuestions} questions across cloud, Kubernetes, Terraform, CI/CD and SRE.
    </p>
  )
}
