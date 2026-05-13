# Reflection

## What Went Well
- **Deterministic Engine First**: By keeping the core savings logic deterministic and separate from the AI, the application remains testable, predictable, and incredibly fast. The AI simply adds a narrative layer rather than doing math, preventing hallucinations.
- **Graceful Degradation**: Building the app so it can run without Supabase or OpenAI was a huge win for local development and simplified testing. 

## Areas for Improvement
- **Pricing Data Maintenance**: Currently, `PRICING_DATA` is hardcoded. As tools change their prices (e.g., ChatGPT or Claude introducing new tiers), this requires a code deployment. Moving pricing to a CMS or database would make it more maintainable.
- **User Authentication**: The current MVP is friction-free with no auth, but allowing users to log in, save multiple audits, and track spend over time would increase retention.

## Lessons Learned
- Users are often unaware of how much they overpay for unused seats. Exposing this through a simple, clear UI provides immediate "aha" moments.
