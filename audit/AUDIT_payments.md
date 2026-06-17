# Payment + Fulfillment Correctness Audit

DevOpsInterview.Cloud (Next.js). Read-only audit. Code was written without live
credentials and is untested. Findings ordered most serious first.

Flow traced: `checkout/page.tsx` -> `api/checkout/route.ts` -> `lib/pricing.ts` /
`lib/payments/{razorpay,paypal}.ts` -> gateway -> `api/webhooks/{razorpay,paypal}/route.ts`
-> `lib/fulfillment.ts` -> `lib/download-token.ts` + `lib/storage.ts` -> `api/download/[token]/route.ts`.

## Findings

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| 1 | CRITICAL | `api/webhooks/paypal/route.ts:18-23` | On `CHECKOUT.ORDER.APPROVED`, the capture call is wrapped in `try/catch` that only logs (`catch (e) { console.error(...) }`), then `fulfillByGatewayOrderId` runs **unconditionally**. If capture fails (declined funds, already captured, API/token error, currency mismatch), the customer is still marked SUCCEEDED and emailed the ebook. Free product, no money collected. | Only fulfill when capture returns `status === 'COMPLETED'`. Do not fulfill on APPROVED at all; fulfill solely on `PAYMENT.CAPTURE.COMPLETED` after verifying capture status + amount. |
| 2 | CRITICAL | `api/webhooks/paypal/route.ts:18-29`, `api/webhooks/razorpay/route.ts:24`, `lib/fulfillment.ts:18-30` | **Double-fulfillment race / non-atomic idempotency.** PayPal fires both `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED`; Razorpay fires both `payment.captured` and `order.paid`. Both paths call `fulfillByGatewayOrderId`. The idempotency guard is read-then-update (`findUnique` then `update`), not atomic, so two concurrent deliveries both pass the `paymentStatus==='SUCCEEDED'` check and both send the email. Worse, `gatewayPaymentId @unique` (schema:134) will throw a P2002 on the second write since each path supplies a different id (orderId vs captureId), 500ing the handler and triggering gateway retries. | Make the claim atomic: `updateMany({ where: { gatewayOrderId, paymentStatus: { not: 'SUCCEEDED' } }, data: {...} })` and only send email if `count === 1`. Drop or relax the `gatewayPaymentId @unique` collision by writing a consistent id. |
| 3 | HIGH | `api/webhooks/razorpay/route.ts:19-25`, `api/webhooks/paypal/route.ts`, `lib/fulfillment.ts` | **Amount/currency never verified against the stored order before fulfillment.** Webhooks fulfill on order-id match alone; they never compare `payment.amount`/`payment.currency` (Razorpay) or capture `amount.value`/`currency_code` (PayPal) against `order.total`/`order.currency`. A tampered or underpaid payment that still references the order id gets fulfilled. | In fulfillment (or webhook), assert webhook amount == stored `total` (paise for INR, decimal string for USD) and currency matches before marking SUCCEEDED; otherwise flag FAILED and alert. |
| 4 | HIGH | `api/webhooks/paypal/route.ts:24-28` | `PAYMENT.CAPTURE.COMPLETED` derives the order id from `resource.supplementary_data.related_ids.order_id`, which PayPal frequently omits. When absent, `orderId` is undefined and fulfillment is silently skipped. Combined with finding #1 (no fulfill on a *successful* capture path), a legitimate paid order can end up never fulfilled. | Store the PayPal **capture id** and look up by capture, or persist the order id at create time and match on `resource.id` chain; do not rely on `supplementary_data`. Fulfill on capture-complete with amount verification. |
| 5 | HIGH | `lib/storage.ts:16-21` vs `src/data/ebooks.json` | **Catalog/file-map mismatch.** Catalog sells 5 single books + 1 bundle. `FILE_MAP` only has files for `cloud-interview-mastery`, `container-orchestration-journey`, and the bundle. The bundle `complete-devops-mastery-bundle` ("complete mastery", $62.99) maps to **only 2 of the 5** PDFs -> paying customers are under-delivered. The other 3 single titles (`infrastructure-automation-mastery`, `modern-cicd-gitops`, `senior-devops-handbook`) have no files, so checkout 409s — 3 listed/sellable products can never be purchased. | Either hide unshipped products from the catalog/checkout, or complete `FILE_MAP`. Bundle must list every book it advertises. |
| 6 | MEDIUM | `lib/storage.ts:38`, `api/download/[token]/route.ts:24` | **Signed-URL expiry mismatch with email copy / token TTL.** Signed URLs default to 300s (5 min) but the email (`fulfillment.ts:48`) says the link is "valid for 3 days" and the download token TTL is 3 days. A user opening the emailed link after 5 min still works (token valid, fresh signed URLs generated per request), but the bundle HTML page lists signed URLs that expire in 5 min while the page itself implies longer; acceptable, but single-file 302 is fine. The real risk: `expiresInSeconds` is hardcoded at the call site with no override, fine, but verify 5 min is enough for large PDF download start. | Confirm 300s covers download initiation for large files; consider 900s. Align email wording with actual signed-URL lifetime vs token lifetime. |
| 7 | MEDIUM | `checkout/page.tsx:42`, `currency.ts` | **Country->currency on checkout is coarse.** Only `IN` -> INR; every other country (incl. those `currency.ts` maps to EUR/GBP/AUD) -> USD via PayPal. Display layer (`DynamicPriceText`/`convertPrice`) shows converted local prices (e.g. ₹ rounded to x99, EUR, GBP) that the customer never actually pays — they pay flat USD or GST-inclusive INR. Displayed price can differ materially from charged price (e.g. shows ₹1599 via `convertPrice(24.99)` rounding but charges ₹1999 catalog). Price-display vs price-charged divergence. | Make the displayed price the authoritative charged price (server quote), not client-side `convertPrice`. |
| 8 | MEDIUM | `checkout/page.tsx:65` | Razorpay `handler` sets the success screen purely on the **browser callback** with no signature verification (`verifyCheckoutSignature` exists but is unused). A user can dismiss/fake nothing of value (fulfillment is webhook-driven, good), but the "Payment received" screen shows even if the webhook later fails, misleading the customer. Also if the webhook arrives *before* the browser handler, no issue; if it never arrives (capture failure), customer sees success but gets no email. | Drive the success UI from a server poll of order status, or verify `verifyCheckoutSignature` on a confirm endpoint before showing success. |
| 9 | MEDIUM | `lib/fulfillment.ts:32-38` | Email-send failure is swallowed (`console.error`); order is marked SUCCEEDED but customer never receives the link and there is no retry/queue/flag. Silent delivery failure. | Record an `emailSentAt`/`deliveryStatus` field; retry or surface for manual resend. |
| 10 | LOW | `api/checkout/route.ts:41` | Razorpay `receipt` is `q.slug.slice(0,40)`. Receipt should be unique per order (Razorpay treats receipt as the merchant order ref); reusing the slug across all orders for a product defeats reconciliation and can collide. | Use a unique value (e.g. the cuid you are about to create, or `${slug}-${Date.now()}`). |
| 11 | LOW | `api/checkout/route.ts:42-49` | Order row is created **before** redirect/payment with `paymentStatus=PENDING`; abandoned checkouts accumulate as orphan PENDING orders with a reserved `gatewayOrderId`. Not a correctness bug but no cleanup/expiry. | Add a sweep for stale PENDING orders. |
| 12 | LOW | `lib/email.ts:1-7` | `email.ts` throws at module load if `RESEND_API_KEY` is unset, and exports `sendDownloadEmail` (uses `/download/{id}?orderId=` links + `ebook.fileUrl`/`coverUrl`) — a **second, divergent** email path not used by `fulfillment.ts` (which uses HMAC token links). Dead/duplicate code that, if ever wired up, would email unsigned, guessable download links keyed only by orderId. | Remove `email.ts` or reconcile to the token-based path; never ship `/download/{id}?orderId=` (no entitlement proof). |
| 13 | LOW | `schema.prisma:134` + race | `gatewayPaymentId @unique` is correct intent but interacts badly with the non-atomic fulfillment (finding #2). Once #2 is fixed atomically this is fine. | Keep unique; fix #2 first. |
| 14 | INFO | `pricing.ts:44-60` | GST back-calc verified correct: ₹1999 incl -> taxable 1693.22, GST 305.78, sum 1999; paise = 199900. USD `.toFixed(2)` correct. No rounding bug found here. | None. |

## Cross-cutting notes

- Webhook signature verification itself is sound: Razorpay HMAC over raw body with
  timing-safe compare (`razorpay.ts:38-42`), raw body read correctly
  (`webhooks/razorpay/route.ts:10`). PayPal uses the verify-signature API
  (`paypal.ts:62-80`). Download token HMAC + timing-safe + expiry is correct
  (`download-token.ts`).
- Returning 200 on webhooks is intentional and mostly fine, but combined with
  finding #1 it means PayPal capture failures are acked as success.
- `filesForSlug([])` safety net in checkout (`route.ts:32`) and download
  (`route.ts:29`) is good defense in depth — empty file map blocks both sale and
  download.
- The empty-file-map slug case: checkout returns 409 (handled), download returns
  404 (handled). No crash. But see finding #5 — those products should not be listed.

## Most serious

Finding #1: PayPal fulfillment runs unconditionally after a swallowed capture
error on `CHECKOUT.ORDER.APPROVED`, so a failed/declined capture still delivers
the ebook for free.
