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

## Buyer decision content (verified source material)

`src/data/book-contents.json` is generated from the built ebooks and holds every
chapter title, every question title and one complete excerpt per book. Product
pages render the contents overview and the seven-part answer format from it;
`/samples/<book-slug>` publishes the excerpt as an indexable HTML sample with a
canonical URL. The downloadable PDF sample stays what it is: eight complete
questions from Cloud Interview Mastery, labelled as such on every other book's
page. Do not add prompts or excerpts to the site that are not in the built books.

Prices shown are the catalog prices that are charged (INR via Razorpay in India,
USD via PayPal elsewhere). Crossed-out "original" prices were removed because the
books were never sold at those prices; the bundle comparison is computed from the
five catalog prices in each currency and labelled as "bought separately".

## Topic map (article to product to sample to checkout)

`articleProducts` in `src/lib/catalog.ts` maps each article to the ebook its
reader is most likely preparing for. The article CTA then links to that product
page and to the matching sample route, with `blog_cta_clicked` events carrying
`destination` (`product`, `sample`, `ebooks`, `labs`) and the article slug.
Homepage topic cards do the same with `topic_card_clicked`. Sample opens carry
`kind` (`html` or `pdf`) and `location`.
