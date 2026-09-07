# Stalled Exit Engine — v0 pilot runbook

Prepared 7 September 2026. Scope: 50 U.S. operating businesses, two acquisition paths, existing Exit Desk conversion and fulfillment. This is an evidence and campaign-preparation system, not an assertion that any listing cannot sell. Outbound sending is not implemented or enabled until its provider and mailbox policies are verified.

## What the audit established

| Surface | Existing behavior | Minimal change |
|---|---|---|
| `/exit` | Valuation-led overview, secondary Score and sample links; $199/$499 pricing | Preserve positioning; carry attribution across navigation |
| `/exit/score` | Eight questions, no email. Live fictional tests displayed $199 below $1M revenue and $499 at $1M+. Revenue answer `a` selects Main Street | Preserve questions, weights, findings, price logic and WebMCP; carry referral/campaign into checkout and measure completion |
| Score ≥40 | Paid CTA, optional Save Your Score, deeper audit explanation | Preserve conversion path |
| Score <40 | Foundational actions and free three-part 30-day plan; paid CTA hidden | Preserve this existing judgment gate even for stalled sellers |
| `/exit/valuation` | Inputs generate Today / Optimized / Pre-Market estimates, Score and direct checkout links | Preserve calculator; carry attribution |
| `/exit/sample` | Four fictional-business sample reports; static closing copy incorrectly says flat $499 | Replace closing price and CTA with revenue-based $199/$499 language |
| `/exit/checkout` | `q1=a` selects $199; b–e select $499; missing q1 silently defaults $499 | Ask direct visitors to choose below-$1M or $1M+ revenue before payment |
| `/exit/partners` | Formspree application; promised manual review/welcome within one business day; referral tag; monthly manual payout | Remove “roughly 20%”; clarify flat $100 at either tier; add a small already-on-market use case |
| Checkout API | Stripe Price ID selected by revenue; `ref` becomes Stripe `client_reference_id` | Preserve manual tag; validate and retain a separate signed campaign token |
| Stripe webhook | Adds purchased tag in Kit and removes Score tags | Optional signed-campaign purchase event using actual amount collected; opt-out guard |
| Paid intake | Stripe session → 26-question intake → existing report generation → email/PDF | Preserve prompts, generation, delivery and pricing |

Source: live HTML, browser behavior, Webflow embeds, and `Trailgenic/my-exitdesk`. The browser tests used fictional inputs; no real payment, report generation, subscription, application, or email was submitted. Production Stripe Price objects and Kit sequence contents were not accessible through a connected provider. The audit verifies the code paths and displayed tiers, not a completed real purchase or the delivery-time SLA.

### Exact funnels

Seller: independently identified owner-direct listing → evidence-qualified email → Score → if score ≥40, paid Audit or optional saved result → revenue-calibrated checkout → Stripe payment → paid intake → report. Below 40: prioritized fixes → optional 30-day plan → later retake. Valuation and samples remain supporting assets.

Broker: represented listing → verified listing broker → partner email → Partners → Formspree application → manual approval, partner kit and assigned tag → broker shares Score/sample with `ref` → seller completes diagnostic/payment → Stripe reference reviewed against approved partner register → $100 conversion logged → monthly payout. A partner application is not an approved partner or a paid referral.

### Referral behavior and credit

The backend already accepts `ref`. The unmodified Score rebuilt its checkout URL without that value. The helper preserves it through Score, samples, valuation, overview and checkout, with a 30-day browser attribution window. Explicit inbound referral tags take precedence over stored tags. Browser storage failure still allows URL-based propagation during navigation. Cross-device attribution remains manual.

Campaign tokens identify the qualified signal and contacted seller/broker without embedding their email. They do not authorize commissions. Only an assigned, approved partner tag plus a reconciled paid report can earn $100. Record partner approval, referred client, report/session identifier, actual collected amount, refunds, $100 payable, payout date and payment reference in the private partner ledger. Do not automate payouts in this pilot.

For a new approved broker, issue client-facing tagged Score/sample links and retain the originating signal in the partner ledger. A broker's personal campaign token is not a client identifier. Later clients and cross-device purchases are reconciled by referral tag and Stripe session, not guessed from browser activity. Attribute only one originating signal to a partner acquisition; keep later referrals in a separate lifetime/referral ledger so one purchase is never credited to several stalled listings.

## Seller Friction Score

Heuristic v0, uncalibrated to purchase probability or time-to-sale. Source quality is reported separately. Maximum 100; no missing-data imputation and no rescaling sparse evidence to 100.

| Evidence family | Points and rules |
|---|---|
| Duration, max 35 | More than 90 days: 10; more than 180: 22; more than 365: 35. Use only the highest band |
| Repricing, max 30 | One evidenced reduction: 15. Further distinct comparable reductions: +5 each, capped at +10. Cumulative observed reduction ≥10%: +3, ≥20%: +5. Do not add both percentage bands |
| Changed terms, max 15 | Newly added seller financing: 8. Separately improved terms: 7. Existing financing availability alone: 0 |
| Process changes, max 10 | Confirmed relisting: 6. Two or more manual refresh events: 2. Confirmed broker change: 2. Automatic feed refresh: 0 |
| Urgency language, max 10 | Motivated seller: 4; quick sale: 6; must sell: 8; distressed designation: 10. Highest only |

Pilot threshold: score ≥20 plus at least one substantive signal: >180-day exposure, an evidenced price reduction, or changed terms corroborated by relisting/urgency. High priority ≥50. Watchlist otherwise. These are test settings, not empirical truths. Review threshold after initial source yield; do not loosen it merely to fill 50 rows.

Dates are separate: `original_published_at` is a source-supported publication date; `first_seen_at` is our first observation and is immutable; `last_updated_at` is the source's actual update timestamp, nullable. Also retain `active_verified_at` and each evidence item's `observed_at`. A search engine's “crawled” date, site footer, business incorporation date, sitemap lastmod or current refreshed date is not original publication. Imported historic observations must retain provenance. Repeated observations append; they never overwrite evidence. Relisting preserves the older business sale history after explicit identity resolution.

Price comparisons must cover the same entity, currency, included assets, inventory, real estate and transaction scope. A $1.5M property-inclusive package becoming a $500K operating-business-only offer is not a $1M price reduction. Different asking prices on simultaneously syndicated stale pages are a conflict to resolve, not two sequential reductions. An explicit “price reduced” statement proves a reduction but no percentage or count beyond one. Seller financing and urgency are alternative explanations for flexibility; do not infer insolvency or a failed transaction.

## Qualification and entity resolution

Keep the $250K–$3M asking range for the first test. It matches the small-business diagnostic without changing product scope. Price is an acquisition filter; annual revenue determines the Audit tier. Log excluded ranges rather than silently modifying the test. Many businesses under $250K may fit, but lower fulfillment margins and asset-sale prevalence justify testing them separately later.

Require U.S./USD, active operating business, owner-operated/founder-owned evidence, known representation, valid asking price, and positive revenue/cash flow when disclosed. Missing financials remain unknown. Exclude pure asset liquidations, property-only listings, new franchise territories, sold/withdrawn/under-offer opportunities, unresolved identities and stale availability. Recheck active status within seven days of each send, preferably the same day.

Resolve a seller only from explicit public identification plus corroborating company/owner evidence. Match legal/trade name, company domain, location and current ownership/role; use at least two corroborating URLs. Do not unmask a confidential listing using revenue, staff count, photos, or approximate geography. For a confidential broker listing, resolve the broker using the listing and that broker's independent firm biography; the business name may stay unknown. Use the public listing label in broker copy.

Email addresses must be independently published or lawfully licensed for this use; require business role, U.S. basis and deliverability verification. Do not generate name permutations or treat a guessed mailbox as verified. Catch-all/unknown verifier results stay held. Never use marketplace inquiry forms to pitch Exit Desk. One recipient per business and one sequence per broker in v0. Brokered seller contact requires a broker introduction/coordination; no simultaneous seller campaign by default.

## Permissible sourcing

| Source | v0 treatment |
|---|---|
| Broker-supplied exports / partnerships | Preferred. Document rights to analyze, retain, refresh and use for the specific outreach purpose |
| Owner/firm's own public website | Targeted research after terms review; factual notes only. Separately check permission for commercial contact; no broad crawler |
| Licensed feeds / APIs | Use only if license covers this particular analysis and outreach, not merely viewing listings. Paid license requires Mike's approval |
| Search/indexed discovery | Locate possible first-party evidence. Snippets are leads to verification; they do not grant reuse rights or override the underlying source restrictions |
| BizBuySell / BizQuest | Excluded from extraction/lead database absent express written authorization; their terms restrict copying, database export and automated/manual monitoring |
| BizBen | Excluded absent express authorization; its terms prohibit promotional use of lead forms and restrict copying/monitoring |
| Sunbelt | Limited public research found useful signals. No automated fetch permission assumed. Outreach remains held because its published spam policy defines unsolicited commercial email broadly and calls for consent |

References: [BizBuySell terms](https://www.bizbuysell.com/terms-of-use/), [BizQuest terms](https://www.bizquest.com/Terms/), [BizBen terms](https://www.bizben.com/terms-of-use), [Sunbelt terms](https://www.sunbeltnetwork.com/terms/), [Sunbelt spam policy](https://www.sunbeltnetwork.com/spam-policy/). Reviewed 7 September 2026. Source registry records domain, policy URL, reviewed date, research/outreach decisions, automation permission and rationale. Re-review at 30 days or immediately when terms change. Unknown is held, not assumed allowed.

The initial feasibility check found three Sunbelt examples: a two-location Edible Arrangements offer at $400K with an explicit price reduction and newly offered financing; a $275K Asian restaurant with financing and a price-reduction statement on the office hub but different detail-page copy; and a repriced auto-body business at $225K, outside the chosen range. Their listing-age history and contact permission were not established. None is approved for outreach. This proves signal discoverability, not scalable permissible sourcing or 50 qualified leads.

No Scrapling, headless marketplace crawler, paid lead purchase, or SMS component is included. An ingestion connector earns its place only after a permissible source has proved useful.

## Final email sequences

The executable copy is in `lib/stalled/emails.ts`; it produces seller and broker Day 0 / Day 4 / Day 10 messages. Primary seller CTA is Score; primary broker CTA is Partners. Personalization is deterministic from approved evidence, never inferred distress.

Seller subjects: “Before you cut the price again” only with evidenced reduction; otherwise “A lower asking price may not fix it.” Follow-ups: “Price may not be the problem” and “One last thought on your exit.” Broker subjects: “A buyer-side diagnostic for your seller”; “You keep the relationship. We provide the diagnostic.”; “A resource for this seller—and the next.”

Every message includes accurate Mike Ye / Exit Desk sender identity, a clear commercial-message notice, the approved business mailing address and functional unsubscribe link. Stop at three messages. Delay dates are measured from actual sends, with at least four days then six days between messages; no catch-up burst. Any reply, opt-out, hard bounce, complaint, purchase, partner application or explicit nurture signup stops cold follow-ups. Opens are neither collected nor optimized.

## Compliance and sender decision

The [FTC CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) covers B2B commercial email. Use truthful headers/subjects, conspicuous commercial identification, a valid postal address and easy opt-out. Keep opt-out working at least 30 days after the last email; this implementation's opt-out tokens do not expire. Suppress immediately, never wait for the statutory deadline. Marketing opt-out does not cancel requested transactional report delivery.

[Resend's policy](https://resend.com/legal/acceptable-use) expressly prohibits unsolicited messages including cold outreach and scraped/purchased lists. Existing Resend remains for paid report delivery. [Kit's policy](https://help.kit.com/en/articles/3038130-acceptable-use-policy) is unsuitable for importing this cold cohort. Keep Kit for requested Score/plan nurture. A cold email platform's features do not override the connected mailbox provider's policy.

Unsubscribe writes permanent normalized-email HMAC suppression and stops the contact; it also calls Kit's [v3 unsubscribe endpoint](https://developers.kit.com/api-reference/v3/subscribers). If synchronization fails, the contact stays suppressed and the pilot is paused for retry. A retry of the private suppress command completes synchronization. Existing `/api/subscribe` and purchased-tag enrollment respect that list when pilot suppression is configured. Preserve secrets and opt-out service after stopping the pilot. A provider adapter must also synchronize inbound unsubscribes, bounces, complaints and replies before live launch; that adapter is blocked on sender selection.

No home address was automatically placed into public code or outbound copy. `STALLED_EXIT_POSTAL_ADDRESS` must hold Mike's approved business mailing address. SPF/DKIM/DMARC, sender identity, reply inbox and suppression synchronization must be verified before launch. No mailbox/domain purchases or new subscriptions were made.

## 50-business pilot

25 owner-direct signals plus 25 represented signals from 25 distinct brokers. This is a directional economic test, not a statistically powered comparison. Do not replace a missing owner-direct cohort with brokers without explicitly revising the experiment. Track all discovered candidates and exclusions, not only selected winners.

Wave 1: five sellers and five brokers. Review delivery, identity accuracy and first diagnostic/application events before the next wave. Then add 20 and 20. Initially cap at five new contacts daily, with due follow-ups handled by the verified provider. Pause at the first complaint or representation error, and investigate any hard bounce in the first ten; after that, pause if hard-bounce rate exceeds 2%. These are conservative operational gates, not industry benchmarks.

Measure owner-direct economics at 30 days after the last initial email. Review partners at 30/60/90 days because referrals may lag. Continue only if there are meaningful diagnostic completions or approved partners and an explainable route to paid reports. Suggested directional continuation gates: at least three seller Score completions and one paid seller report; at least two approved brokers and one referred paid report. Evidence of repeat referrals requires two distinct paid clients from a broker, not two visits or two applications. Lack of these signals means inspect the source/message/funnel loss before buying automation.

### Measurement schema

| Layer | Fields/events | Interpretation |
|---|---|---|
| Source | discovered, qualified, exclusions, source, friction/components/version, first-seen age, original age basis, resolution, representation | Unique canonical businesses; preserve unknowns |
| Email | campaign/signal/contact/message IDs, step, actual send timestamp, provider event ID, sent/delivered/bounced/unsubscribed/clicked | Sent ≠ delivered. Clicks can include scanners; opens excluded |
| Seller | score_start, score_complete, score_save, plan_signup, valuation_visit, sample_visit | Anonymous signed-campaign events; browser success is directional, reconcile signup provider evidence |
| Commercial | Stripe session ID, amount collected, refund amount, tier, partner tag, net receipts | Paid report is server/export verified, never inferred from success-page views |
| Broker | partner_visit/application, approved partner ID, assigned tag, referred client ID, paid report ID, repeat referral count | Application vs approval vs paid referral are distinct |
| Economics | sourcing and research time, provider/license cost, payment fees, generation/fulfillment cost, refund, partner payment | Contribution per qualified signal and per contacted signal, separately by cohort |

Use event ID idempotency and unique Stripe sessions; keep record/received timestamps separate when importing provider events. Provider adapters must retain actual event timestamps from the provider; the initial operator record endpoint timestamps receipt. Browser visits cannot be assumed to identify a person across devices or forwarded links. Current acquisition helper stores no email, detailed answers, or open pixels; 30-day browser attribution, 90-day signed campaign token validity, 180-day event retention, permanent suppression. Store private source/contact exports outside the public repository.

Economic equations: net receipts = actual collected revenue − refunds. Contribution = net receipts − payment fees − report costs − referral payouts − incremental sourcing/sending costs. Revenue per qualified signal uses every qualified signal in the cohort, including those held for contact resolution; also show contacted-signal economics separately. A referred $199 report leaves $99 before those other costs; a referred $499 report leaves $399. The $100 fee is 50.25% and 20.04% respectively, not a uniform 20%. At $100 incremental pilot cost, one $199 direct report covers that cost before fulfillment/fees; one referred $199 report does not.

## Implementation and operating commands

Uses the existing Next.js/Vercel codebase and its existing Redis client dependency. The evidence CLI uses local JSON snapshots. The optional production event/suppression service uses a dedicated Redis namespace; do not place its durable data in Vercel's ephemeral filesystem. No new dependency was added.

```
npm run test:stalled
npm run typecheck
npm run verify:webmcp
npm run stalled -- observe incoming.json .stalled-private/packet.json
npm run stalled -- score .stalled-private/packet.json .stalled-private/assessment.json
npm run stalled -- prepare .stalled-private/packet.json .stalled-private/drafts
npm run stalled -- register .stalled-private/drafts/register.json
npm run stalled -- health
npm run stalled -- check-contact CONTACT_ID
npm run stalled -- suppress CONTACT_ID
npm run stalled -- record .stalled-private/provider-event.json
npm run stalled -- sync-events .stalled-private/events.json
npm run stalled -- report .stalled-private/packet.json .stalled-private/events.json
```

No `send` command exists in v0. `dispatchDecision` implements source/contact/stop/due/provider gates for the future adapter; generating drafts does not satisfy those gates or send mail. Do not bulk preload a static Day 4/10 export into an autonomous sender that cannot consult current suppression and stop events. Unknown send acceptance after a network timeout requires provider reconciliation before retry, using the same message idempotency key.

Required server/operator settings: `STALLED_EXIT_ENABLED`, `STALLED_EXIT_REDIS_URL`, `STALLED_EXIT_REDIS_TOKEN`, `STALLED_EXIT_SIGNING_SECRET`, `STALLED_EXIT_SUPPRESSION_SECRET`, `STALLED_EXIT_ADMIN_KEY`, existing `CONVERTKIT_API_SECRET`; operator-only `STALLED_EXIT_POSTAL_ADDRESS`. Secrets are at least 32 characters and stay in environment settings, never Git or URLs. Signing secret also derives a domain-separated authenticated encryption key for registered email addresses. Keep encrypted addresses only for necessary opt-out synchronization; restrict admin access. Account-wide Kit cancellation needs its API secret and should be verified against an owned test contact before activation.

Deploy code first. Verify `exit-campaign.js` and disabled `/api/stalled` behavior. Then apply six prepared Webflow embeds. Test direct checkout with missing revenue, both revenue tiers, low-score branch, tagged sample→Score→checkout, and regular untagged traffic. Do not publish unrelated draft Acquisition Lens pages. For analytics, explicitly configure storage/secrets, register the real pilot cohort, verify owned-test-contact opt-out end to end, and connect a policy-approved sender before activation.

Rollback: restore the six backed-up embeds and revert the code commit. Preserve suppression data and keep unsubscribe endpoints operational for at least 30 days after any send, even when campaign acquisition is disabled. This pilot has not sent any messages, so there is no live recipient-dependent rollback state yet.

## Remaining launch gates

1. Establish a reproducible permissible source/contact pipeline; the 50 qualified businesses are not yet assembled.
2. Select and authorize a cold-outreach service plus compliant mailbox infrastructure, including exact incremental cost. No paid provider choice is assumed.
3. Confirm the business mailing address to disclose.
4. Configure production storage/secrets and verify unsubscribe, Kit cancellation, provider event ingestion, purchased-report reconciliation and both Stripe price tiers with owned test data.
5. Implement the selected provider adapter and run the ten-contact first wave. Until then this is a tested pilot foundation, not a running revenue engine.
