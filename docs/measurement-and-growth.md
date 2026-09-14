# Measurement and organic growth

The site uses cookieless Vercel Web Analytics for page views. It also emits custom
events for sample opens, product-detail visits, blog calls to action, and checkout
steps. Vercel currently exposes [custom-event reporting](https://vercel.com/docs/analytics/custom-events)
only on Pro and Enterprise plans. On other plans, page-view analytics can still work,
but these funnel events will not appear in the dashboard. Confirm the project plan
and dashboard access before treating custom-event counts as available evidence.

No analytics event includes an email address, buyer name, order ID, payment credentials,
or free-form gateway messages. A payment-failure event can include bounded gateway status
fields needed to distinguish the failed step.
Payment completion remains grounded in verified gateway and order records, not a
browser event.

The analytics `beforeSend` hook removes checkout query strings (including PayPal
return tokens) and URL fragments, and skips API/admin routes. Public-page campaign
parameters remain available for attribution.

## Funnel to review

1. Landing page view
2. `sample_opened` or `product_view_clicked`
3. `checkout_started` (an internal CTA click) and `checkout_viewed` (the actual page load)
4. `checkout_submitted`, with `checkout_api_failed` separating bounded response and network failures
5. Payment gateway open or redirect
6. Verified, fulfilled order in the application database

Review this by traffic source and product. A high landing-page exit suggests an
intent or offer problem. Product views without checkout starts suggest missing
detail or weak value. Created gateway orders with no payment attempt suggest
checkout abandonment rather than a declined payment.

## Organic acquisition

Technical SEO makes pages eligible to be crawled; it does not create demand or
guarantee rankings. Continue publishing useful articles from existing long-form
material, link each article to the closest ebook and free lab, and link related
articles to one another. Use Search Console to choose follow-up topics from real
queries and pages receiving impressions. Repurpose each article through the
existing YouTube channel with a direct link to the relevant article or free sample.

Measure impressions, clicks, landing-page engagement, sample opens, and fulfilled
orders over a fixed period before changing price or adding paid acquisition. Avoid
invented reviews, urgency, ranking promises, or career-outcome guarantees.
