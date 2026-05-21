## 2026-05-20 07:30 - Start
Read the Round 2 ask and listed the smallest version that would still feel real: persist audits, compare old pricing to new pricing, and notify users.

## 2026-05-20 08:10 - Chose constraints
Decided not to rewrite the audit engine. The safest path is to keep calculation logic deterministic and add persistence around it.

## 2026-05-20 09:05 - Storage shape
Sketched the Supabase schema for saved audits. Realized I need both the original input and the rendered output, not just a share id, if I want reliable recomputation later.

## 2026-05-20 10:20 - First blocker
Hit the awkward gap between the original product flow and historical tracking. The app was built for one-off reports, so I had to retrofit a durable `auditId` and storage boundary without breaking existing share links.

## 2026-05-20 12:00 - Persistence working
Added storage through the audit service and returned `persisted` plus `auditId` from the audit API. This felt like the key unlock for everything else.

## 2026-05-20 13:10 - Snapshot decision
Committed to storing a pricing snapshot at audit creation time. Without that, I could detect current prices but not prove what changed relative to what the user originally saw.

## 2026-05-20 15:00 - Local fallback parity
Remembered the in-memory path also needs to preserve `pricing_snapshot`, otherwise local/dev behavior would diverge from database-backed behavior. Glad I caught this early.

## 2026-05-20 17:40 - Detection pass
Built the first version of `pricing-change-detection.ts`. Started with simple price deltas, then expanded to added plans, removed plans, and recommendation diffs.

## 2026-05-20 19:15 - Weird edge case
Noticed that recommendation changes are trickier than price changes because the engine can shift output for multiple reasons. Chose to compare the stored recommendation objects directly after recalculation and accept that this may over-report if the engine changes later.

## 2026-05-20 21:00 - API exposure
Added a GET endpoint for inspection so I could see affected audits without sending anything yet. This helped me debug the shape of the diff payload before wiring email.

## 2026-05-21 08:30 - Email plan
Picked Resend because it already fit the project and kept the route code thin. Decided one email per user, grouped across all affected audits, instead of spamming one email per audit.

## 2026-05-21 10:00 - Second blocker
Spent longer than expected on the email content. The challenge was not sending raw JSON noise; it needed to summarize price changes clearly and still link back to useful app pages.

## 2026-05-21 12:15 - Notification flow complete
Finished `POST /api/detect-changes` to detect, group by normalized email, and send consolidated notifications. Added skip accounting for audits with no stored email.

## 2026-05-21 14:00 - Tests and cleanup
Wrote focused tests around pricing diffs and notification grouping. Ran typecheck and the test suite, then cleaned up type definitions so the API and services matched.

## 2026-05-21 16:20 - Final review
Reviewed the feature end-to-end. The core loop works: create audit -> save snapshot -> detect later changes -> notify the right person. The biggest thing still missing is automation so someone does not have to trigger detection manually.
