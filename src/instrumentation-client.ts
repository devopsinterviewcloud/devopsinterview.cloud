import { redactPostHogEvent, setPostHogClient, trackPageview } from '@/lib/analytics'

// PostHog in cookieless mode: no analytics data in cookies or browser storage,
// and PostHog counts visitors with a hash on its own servers. Requests go
// through /relay (next.config.js) so ad blockers that filter by domain don't
// drop them. Everything that could collect more than our page views and named
// events is switched off here, so a toggle in the PostHog dashboard can't turn
// it on. The library is fetched once the page has loaded, so it neither adds
// to first-load JavaScript nor holds up the load event; until then, page views
// and events wait in src/lib/analytics.ts.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

function start(token: string) {
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(token, {
        api_host: '/relay',
        ui_host: 'https://us.posthog.com',
        defaults: '2026-08-30',
        cookieless_mode: 'always',
        person_profiles: 'never',
        advanced_disable_flags: true,
        mask_personal_data_properties: true,
        capture_pageview: false,
        capture_pageleave: false,
        disable_scroll_properties: true,
        disableDeviceModel: true,
        autocapture: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_exceptions: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        before_send: redactPostHogEvent,
      })
      setPostHogClient(posthog)
    })
    .catch(() => {
      // Analytics is optional; a failed load changes nothing for the visitor.
    })
}

if (key) {
  trackPageview()
  if (document.readyState === 'complete') start(key)
  else window.addEventListener('load', () => start(key), { once: true })
}

export function onRouterTransitionStart(url: string): void {
  if (key) trackPageview(url)
}
