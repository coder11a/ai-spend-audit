# ROUND 2 PR

## What this PR does
This PR adds durable audit storage plus a pricing change detection and notification flow on top of the existing AI spend audit app. Audits are now saved with the original user input, calculated result, and a pricing snapshot, and the app can later compare those historical snapshots against current pricing to find affected reports and email users when their recommendations may have changed.

## Why
The original product was good at giving a one-time answer, but it had no memory. That meant users could not benefit when vendor pricing changed later, even though the audit logic already had enough structure to recalculate the recommendation. I assumed the target user is someone who wants a lightweight audit workflow, not a full account setup, so I optimized for "submit once, get updates later" using stored audits and email notifications instead of building auth or a dashboard first.

## How it works
The persistence entry point stays behind the existing audit API so the calculation logic does not need to be rewritten. `POST /api/audits` still computes the audit, but now the result can also be persisted via the audit store service with a stable `auditId`, the original input payload, the computed output, and a `pricingSnapshot` taken from the pricing definitions at creation time.

Change detection lives in `lib/pricing-change-detection.ts`. It loads stored audits, compares each saved tool snapshot against the current `PRICING` data, and records four categories of change: changed prices, added plans, removed plans, and recommendation changes. Recommendation changes are detected by rerunning the deterministic audit engine against the original stored input and comparing the old and new recommendation outputs.

The API surface is intentionally small. `GET /api/detect-changes` returns affected audits for inspection. `POST /api/detect-changes` runs the same detection pass and then groups affected audits by normalized email before sending one consolidated notification per user through Resend. That keeps the route thin and pushes the reusable logic into `services/audit-store.ts`, `lib/pricing-change-detection.ts`, and `services/email.ts`.

Data flow is:

`audit form -> /api/audits -> save stored audit + pricing snapshot -> later /api/detect-changes -> detect diffs -> group by email -> send notification email`

## What I cut
- I did not build scheduled automation yet. Detection is exposed through API endpoints, but something external still needs to trigger the POST route.
- I did not add unsubscribe or notification preference management because this round was about proving the storage and diffing loop first.
- I did not build a dedicated "diff UI" in the app. The detailed change payload exists, but the main delivery surface is email plus the existing rerun/report flows.
- I did not backfill missing user emails for legacy audits, so those rows are counted and skipped rather than guessed or mutated.
- I did not introduce user accounts. That would likely be the right long-term model, but it would have expanded scope far beyond the 36-hour goal.

## How to test it manually
1. Start the app with the required env vars, including the Supabase and Resend values.
2. Submit an audit through the UI and verify the API response includes `persisted: true` and an `auditId`.
3. Confirm the stored audit row contains `input_stack`, `output_result`, and `pricing_snapshot`.
4. Change one of the prices in `lib/pricing.ts` for a plan used by that stored audit.
5. Call `GET /api/detect-changes` and verify the audit appears in the response with `changedPrices` and/or `recommendationChanges`.
6. Call `POST /api/detect-changes` and verify the response includes `groupedUsers`, `skippedWithoutEmail`, and `sentNotifications`.
7. Check the recipient inbox for the pricing update email, open the included re-audit/report links, and confirm the message matches the detected changes.

## What's tested
- `npm run typecheck`
- `npm test`
- Focused detector coverage in `lib/pricing-change-detection.test.ts` for price changes, added plans, removed plans, and recommendation changes
- Focused email coverage in `services/email.test.ts` for notification grouping and email payload generation

## Open questions / risks
- The notification flow is not idempotent yet, so repeatedly hitting `POST /api/detect-changes` can resend alerts for the same pricing event.
- There is no scheduler in this PR, which means the feature is operationally complete but not yet fully automatic.
- Recommendation diffs depend on today's deterministic engine staying compatible with historical inputs; if the engine evolves significantly, some "changes" may reflect logic drift rather than vendor pricing alone.
