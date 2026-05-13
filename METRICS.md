# Metrics & KPIs

To measure the success of the AI Spend Audit MVP, we are tracking the following Key Performance Indicators:

## Acquisition & Conversion
- **Landing Page Traffic**: Number of unique visitors.
- **Audit Start Rate**: % of visitors who click "Start Free Audit".
- **Completion Rate**: % of users who submit the final form. (Target: > 75% due to low friction and no auth).

## Engagement & Virality
- **Share Link Generation Rate**: % of completed audits that result in a user clicking "Copy Link" or sharing the `/report/[shareId]` URL.
- **K-Factor (Virality)**: Number of new unique audits generated from users who landed via a shared report URL.

## Business Impact
- **Total Identified Savings**: The aggregate dollar amount of annual savings the platform has found across all users. (Great for marketing: "We've found $1.2M in AI savings").
- **Lead Capture Rate**: % of users who opt-in to the final email report / newsletter list.

## Technical Performance
- **Time to Report**: Average time from form submission to report render (Goal: < 800ms).
- **API Fallback Rate**: Frequency of hitting the deterministic fallback summary due to OpenAI timeouts or rate limits.
