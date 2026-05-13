# AI Spend Audit

**Deployed App:** [https://ai-spend-audit.vercel.app](https://ai-spend-audit.vercel.app) (Placeholder URL)

## Project Overview

AI Spend Audit is a lightweight SaaS app built for startup founders and CTOs who want to quickly identify AI tool sprawl and reduce unnecessary subscriptions. Users input their current AI stack, seat counts, and monthly spend to receive deterministic right-sizing recommendations and estimated cost savings. The platform generates an actionable, shareable report to help teams rationalize their tooling and cut costs immediately.

## Features

- Public landing page for an AI spend audit offer.
- No-auth audit form with validation and localStorage persistence.
- Deterministic audit engine for repeatable savings calculations.
- Pricing rules for ChatGPT, Claude, Gemini, Cursor, GitHub Copilot, Windsurf, OpenAI API, and Anthropic API.
- Personalized AI summary through OpenAI with a deterministic fallback summary.
- Results dashboard with savings metrics, recommendations, and charts.
- Public share URLs at `/report/[shareId]`.
- Lead capture and transactional email support through Resend.
- Supabase persistence for audits, leads, and public reports.
- In-memory fallback store when Supabase is not configured.
- Honeypot and rate limiting for abuse protection.
- Vitest coverage for the audit engine.

## Quick Start

**1. Install dependencies:**

```bash
npm install
```

Create `.env.local` at the repo root with the variables you need for the services you want to enable:

```bash
NEXT_PUBLIC_APP_URL=https://ai-spend-audit.vercel.app
NEXT_PUBLIC_SUPABASE_URL="Your Supabase URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="Your Supabase Anon Key"
SUPABASE_SERVICE_ROLE_KEY="Your Supabase Service Role Key"
OPENAI_API_KEY="Your OpenAI API Key"
RESEND_API_KEY="Your Resend API Key"
RESEND_FROM_EMAIL="Your Email Address"
RATE_LIMIT_MAX=8
RATE_LIMIT_WINDOW_SECONDS=60
```

**3. Run locally:**

```bash
npm run dev
```

Run validation:

```bash
npm run typecheck
npm run test
npm run build
```

Create Supabase tables by running `supabase/schema.sql` in the Supabase SQL editor. The app can run without Supabase, OpenAI, or Resend; missing services fall back to local memory, template summaries, or skipped email delivery.

**4. Deploy:**

1. Create a Supabase project and run `supabase/schema.sql`.
2. Configure production environment variables in the host, including `NEXT_PUBLIC_APP_URL`, Supabase keys, `OPENAI_API_KEY`, and Resend values.
3. Deploy to a Next.js-compatible platform such as Vercel.
4. Set the production domain in `NEXT_PUBLIC_APP_URL` so share links and emails point to the live app.
5. Run `npm run build` in CI before deployment.

## Screenshots

*(Placeholder images. Replace paths once screenshots are captured)*

![Landing Page](./screenshots/landing.png)
*Figure 1: The Landing Page*

![Audit Form](./screenshots/audit-form.png)
*Figure 2: The Audit Form*

![Results Dashboard](./screenshots/results-dashboard.png)
*Figure 3: Results Dashboard*

![Public Report](./screenshots/public-report.png)
*Figure 4: Shareable Public Report*

## Architecture Summary

The app uses Next.js App Router for pages and API routes. Client components collect audit input and render interactive dashboards. Server routes validate submissions with Zod, rate-limit requests, calculate savings through `lib/audit-engine.ts`, optionally call OpenAI for a summary, persist to Supabase, and send Resend emails. Public report pages read by `shareId` and render a sanitized `PublicReport`.

## Decisions (Trade-offs)

1. **Deterministic savings engine before model-generated advice**: Recommendations are predictable and testable, but less nuanced than a fully dynamic LLM advisor.
2. **In-memory fallback storage**: Local demos work without infrastructure, but reports are not durable across restarts unless Supabase is configured.
3. **No authentication in the MVP**: The audit funnel has less friction for immediate use, but users cannot manage historical reports yet.
4. **Hardcoded pricing rules**: Calculations are extremely fast, cheap, and transparent, but pricing logic needs periodic manual review to stay up to date.
5. **Optional async email delivery**: API responses stay fast and avoid blocking the user flow, but if Resend fails, email errors are only logged and not surfaced to the user.
