---
title: SRE Interview Questions on SLOs, Error Budgets and On-Call
description: SRE interview questions for experienced engineers on SLIs, SLOs and SLAs, error budget math, burn-rate alerts, toil, on-call and scenario-based answers.
date: 2026-11-23
keywords: sre interview questions, sre interview questions and answers, site reliability engineer interview questions for experienced, sre scenario based interview questions, sli slo sla interview questions, error budget interview questions
topic_id: K05
---

SRE interview questions rarely stay on definitions for long. "What's an SLO?" becomes "how much budget did that outage burn?", then "so what pages you at 3 a.m., and why that and not CPU?". The questions below follow that path: SLIs, SLOs and SLAs, error budget math and policy, burn-rate alerting, toil, on-call, and a few scenario questions. Numbers and recommendations come from Google's [SRE book](https://sre.google/sre-book/table-of-contents/) and [SRE Workbook](https://sre.google/workbook/table-of-contents/). For where reliability fits in a wider prep plan, see the [DevOps interview preparation roadmap](/blog/devops-interview-preparation-roadmap).

## SRE interview questions on SLIs, SLOs and SLAs

### 1. What is the difference between an SLI, an SLO and an SLA?

An SLI is a measurement: the proportion of valid requests that succeeded, or the proportion served faster than 300 ms. An SLO is a target for that measurement over a window, such as 99.9% of requests succeeding over 30 days. An SLA is a contract with customers that attaches consequences, usually service credits, to missing a promise.

The quick test from the [SRE book's SLO chapter](https://sre.google/sre-book/service-level-objectives/) is to ask what happens if the objective is missed. If there's no explicit consequence, it's an SLO. Keep the internal SLO tighter than the external SLA, so there's room to react before a breach costs anything.

### 2. How do you choose SLIs for a service?

Start from what users of the service do, not from what's easy to graph. Write each SLI as good events divided by valid events, so it lands between 0 and 100% and turns into a budget cleanly. Typical choices by service type:

| Service type | Common SLIs |
|---|---|
| Request-driven API or website | Availability (non-5xx responses), latency below a threshold |
| Data pipeline | Freshness (age of the newest processed data), correctness, coverage |
| Storage | Durability, availability of reads and writes |

Then say where you'd measure it. Server metrics are cheap but blind to requests that never arrived. Load balancer logs, synthetic probes and client-side telemetry get progressively closer to the user, at more cost and noise. An external probe catches failures that never reach your infrastructure, such as DNS or CDN problems.

For latency, use "proportion of requests faster than X" rather than an average, because an average hides the tail where users feel the pain. With a Prometheus histogram that's a bucket counter over the total count, which only works if X is one of your bucket boundaries:

```promql
sum(rate(http_request_duration_seconds_bucket{job="checkout",le="0.3"}[5m]))
/
sum(rate(http_request_duration_seconds_count{job="checkout"}[5m]))
```

### 3. Why not target 100% availability?

Because users can't tell the difference past a point, and every extra nine costs more than the last. The SRE book calls 100% the wrong reliability target for almost everything: a user on home Wi-Fi and a mobile network is already living with failures far larger than the gap between 99.99% and 100%.

There's also an arithmetic limit. If a request needs three hard dependencies that each manage 99.9% and they fail independently, you can expect about 0.999 × 0.999 × 0.999, roughly 99.7%, before your own failures count. If their outages overlap you do better, but never better than the weakest of them. Google's [Calculus of Service Availability](https://sre.google/static/pdf/calculus_of.pdf) turns this into a rule of thumb: each critical dependency needs one more nine than the service relying on it. A target of 100% also leaves zero budget for change, so it quietly forbids releases.

### 4. How do you set the first SLO for a service that never had one?

Look at what the service actually delivered over the last few weeks, then pick a target it already meets most of the time. If it ran at 99.7%, don't announce 99.95% because it sounds serious; you'd burn budget every day and train everyone to ignore the alerts. Agree the target with product, write down the SLI definition, the window and what counts as a valid request, and plan to review it after a quarter of real data. The Workbook recommends a four-week rolling window as a good general-purpose choice.

## Error budget interview questions, with the math

### 5. How big is the error budget for a 99.9% SLO?

The budget is 100% minus the target. For a time-based SLO over a 30-day window (43,200 minutes), the same window the Workbook's alerting math uses:

| SLO | Error budget | Downtime per 30 days |
|---|---|---|
| 99% | 1% | 432 minutes (7 h 12 min) |
| 99.5% | 0.5% | 216 minutes (3 h 36 min) |
| 99.9% | 0.1% | 43.2 minutes |
| 99.95% | 0.05% | 21.6 minutes |
| 99.99% | 0.01% | about 4.3 minutes |

A four-week window is slightly shorter: 40.3 minutes at 99.9%. For a request-based SLO the budget is in requests instead: at 99.9%, one in every thousand valid requests in the window may fail. Be ready to convert between the two.

### 6. Half your requests failed for 40 minutes. How much of a 99.9% budget is gone?

If traffic were flat, 50% failure for 40 minutes equals 20 minutes of full outage, about 46% of a 43.2-minute budget. Real traffic isn't flat. If those 40 minutes were peak hour at twice the average request rate, the same incident failed twice as many requests and spent about 93% of the month's budget. The same partial failure at 3 a.m., on a fraction of the traffic, would cost far less.

That's deliberate: a request-based SLO weights an outage by how many valid requests failed, so busy hours count for more than quiet ones. A burn-rate alert would have fired fast here, too: a 50% error ratio against a 0.1% budget is a burn rate of 500.

### 7. How do you write an error budget policy that people actually follow?

Agree it before you need it, signed off by product, engineering and SRE leadership. The Workbook's [example error budget policy](https://sre.google/workbook/error-budget-policy/) is a good template to describe:

- If the service has exceeded its budget for the preceding four weeks, halt changes and releases except P0 fixes and security fixes until it's back within SLO.
- If a single incident consumes more than 20% of the four-week budget, the team runs a postmortem with at least one P0 action item.
- If one class of outage consumes more than 20% of the budget over a quarter, fixing it goes on the quarterly plan as a P0.
- Disagreements about the numbers go up a named escalation path, not into a Slack argument.

The same document says the policy isn't a punishment for missing SLOs. Some teams add earlier steps, such as manual deploy approval at half the budget. The [error budget policy question page](/questions/error-budget-policy-when-to-freeze-deploys) covers graduated freezes and which deploys should bypass one.

## Burn-rate alerting questions

### 8. What is burn rate, and why alert on it instead of the raw error rate?

Burn rate is how fast you're spending budget relative to the SLO window. At a burn rate of 1 you'd use exactly the whole budget by the end of the window. At 10 you'd use it in a tenth of the time, so three days for a 30-day window.

Burn rate is just the error ratio divided by the budget, so on its own it's still an error-rate threshold, on a scale that means the same thing for every SLO. The detection behaviour comes from pairing thresholds with windows. A single error-rate threshold checked over a few minutes either pages for every blip (set it at 0.1%) or misses a 1% error rate that drains a 30-day budget in about three days (set it at 5%). Several burn-rate thresholds, each over a window sized to it, page quickly for severe burns and still catch slow leaks.

### 9. Walk me through a multiwindow, multi-burn-rate alert.

The [Workbook's alerting chapter](https://sre.google/workbook/alerting-on-slos/) gives starting values for a 30-day window. The budget percentages assume roughly even traffic:

| Budget consumed | Long window | Short window | Burn rate | Action |
|---|---|---|---|---|
| 2% | 1 hour | 5 minutes | 14.4 | Page |
| 5% | 6 hours | 30 minutes | 6 | Page |
| 10% | 3 days | 6 hours | 1 | Ticket |

Each alert needs both windows over the threshold. The long window sets how much budget is at risk before the alert fires: with steady traffic, a 1-hour error ratio above 14.4 times the budget means about 2% of a 30-day budget is gone. The short window, one twelfth of the long one, lets the alert clear soon after the errors stop instead of firing for another hour. In Prometheus, assuming the request counter carries a `code` label and you've recorded the error ratio for each window:

```yaml
groups:
  - name: checkout-slo
    rules:
      - record: job:slo_errors_per_request:ratio_rate5m
        expr: |
          sum by (job) (rate(http_requests_total{job="checkout",code=~"5.."}[5m]))
          /
          sum by (job) (rate(http_requests_total{job="checkout"}[5m]))
      # repeat the rule for the 30m, 1h and 6h windows
      - alert: CheckoutErrorBudgetBurn
        expr: |
          (
            job:slo_errors_per_request:ratio_rate1h{job="checkout"} > (14.4 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate5m{job="checkout"} > (14.4 * 0.001)
          )
          or
          (
            job:slo_errors_per_request:ratio_rate6h{job="checkout"} > (6 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate30m{job="checkout"} > (6 * 0.001)
          )
        labels:
          severity: page
```

The 0.001 is the budget for a 99.9% SLO. The 3-day alert files a ticket because at a burn rate of 1 the budget lasts the whole window, so nobody needs to wake up. The [SLO-based alerting question page](/questions/slo-based-alerting-stop-alert-fatigue-for-good) goes through fast and slow burns in interview form.

### 10. What should page a human, and what should be a ticket?

Page on symptoms users feel, when a human has to act now. High CPU, a full disk on one replica or a restarted pod is a cause, not a symptom. It goes on a dashboard or in a ticket. The SRE book's four golden signals (latency, traffic, errors and saturation) are a fair checklist for what to watch. Saturation sits closer to a cause, but it can justify a page when it predicts user impact soon, such as a disk that will fill within hours.

Every page should be actionable and should be reviewed afterwards. If an alert fired and nobody needed to do anything, treat the alert as a bug and fix or delete it.

## Toil and on-call questions

### 11. What counts as toil, and how do you get it down?

The SRE book's [chapter on toil](https://sre.google/sre-book/eliminating-toil/) lists the traits: manual, repetitive, automatable, tactical, no enduring value, and growing linearly with the service. The more of those a task has, the more likely it's toil. Meetings and planning are overhead, not toil. A messy one-off migration that leaves the system better isn't toil either.

Google aims to keep operational work under 50% of each SRE's time, so at least half goes to engineering. To reduce it, measure first: tag tickets and interrupts as toil, look at the ratio each sprint, then automate the highest-volume item rather than the most annoying one. The [toil budget question page](/questions/toil-budget-measure-and-reduce-manual-work) covers how teams track the ratio.

### 12. How do you keep an on-call rotation sustainable?

Use limits you can measure. The SRE book's [on-call chapter](https://sre.google/sre-book/being-on-call/) caps on-call at 25% of an SRE's time and aims for at most two incidents per 12-hour shift, because each one needs time for the fix, the postmortem and the follow-up bugs. If a rotation runs well above that, cut the pages or add people.

Then the practical parts: a primary and a secondary, a written handoff at the end of each shift, runbooks linked from every alert, and time off after a bad night.

## SRE scenario-based interview questions

### 13. The SLO dashboard is green, but users say the site is broken. What happened?

First separate the headline number from current health. The SLO shows compliance over the whole window. Under a time-based 99.9% SLO over 30 days, five minutes of total outage spends about 12% of the budget, so the dashboard can stay green if the rest of the window went well. Check the current error ratio and burn rate. If those are clean too, the SLI isn't measuring what users experience. The usual suspects:

- **Measured too far from the user.** Server metrics never see requests that died at DNS, the CDN, the load balancer or in client-side code.
- **Errors that look like success.** A 200 with an error message in the body counts as good unless the SLI checks correctness.
- **One journey drowned in the aggregate.** A broken checkout endpoint vanishes inside millions of healthy static-asset or health-check requests.
- **Global numbers hiding a local outage.** One region or one large tenant is down while the worldwide ratio looks fine.

The fix is SLOs per critical user journey, measured at the edge or the client, with health checks and synthetic requests kept out of user-request counts. Probe-based SLIs are tracked separately.

### 14. You're paged for a fast burn at 3 a.m. What do you do first?

Acknowledge the page, then size the impact from the SLI: which journey, which region, what fraction of requests. If it needs more than one person, declare an incident and split the roles, so one person coordinates and communicates while others work the problem.

Next, ask what changed: deploys, config pushes, feature flags, traffic shape, a dependency's status page. Mitigate before you diagnose. Rolling back, turning off a flag, draining a region or shedding load stops the burn. The root cause can wait for daylight and the postmortem. Confirm recovery on the SLI itself, not just the alert clearing. The same sequence on a real cluster is in this [Kubernetes production incident walkthrough](/blog/kubernetes-production-debugging-walkthrough).

### 15. Product wants to ship a launch, but the error budget is spent. What do you say?

Point to the policy everyone agreed in advance, so the decision doesn't fall to whoever's on call that week. Then offer ways forward within it. Ship the reliability fixes first, as long as they're the kind of change the policy exempts, and the launch once the budget recovers. If the business can't wait, request an exception through the escalation path the policy names. If it's granted, cut the risk with a feature flag and a canary to a small cohort. If the budget is blown every month, also ask whether the SLO is set wrong.

## Interview questions this covers

- What is the difference between an SLI, an SLO and an SLA, and how do you choose SLIs?
- How much error budget does a 99.9% SLO allow, and how much did a given outage burn?
- How do multiwindow, multi-burn-rate alerts work, and what should page versus file a ticket?
- What is toil, and how do you measure and reduce it?
- Your SLO is green but users report an outage. What is wrong with your SLIs?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

Senior SRE rounds go further: tiered SLOs for a multi-tenant SaaS, running MTTR reduction as a measurable program, and commanding a cascading failure during peak traffic. [SRE & Production Operations: SLOs, Observability & Incident Response Interview Questions](/ebooks/senior-devops-handbook) works through 50 senior-level questions with worked answers, including chapters on SLOs and error budgets and on incident command and production debugging. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), and every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework.
