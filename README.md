# AI Spend Audit

## Project Overview

AI Spend Audit is a lightweight SaaS app for startups that want to understand and reduce spend on AI tools. A team enters its current AI stack, seats, plans, monthly spend, and primary use case; the app returns right-sizing recommendations, estimated monthly and annual savings, and a shareable public report.

The project is built as a production-oriented MVP: deterministic savings logic is kept in code, optional AI summarization improves the report narrative, and external services degrade gracefully during local development.

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

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` at the repo root with the variables you need for the services you want to enable:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="AI Spend Audit <audit@example.com>"
RATE_LIMIT_MAX=8
RATE_LIMIT_WINDOW_SECONDS=60
```

Run the app:

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

## Deployment Guide

1. Create a Supabase project and run `supabase/schema.sql`.
2. Configure production environment variables in the host, including `NEXT_PUBLIC_APP_URL`, Supabase keys, `OPENAI_API_KEY`, and Resend values.
3. Deploy to a Next.js-compatible platform such as Vercel.
4. Set the production domain in `NEXT_PUBLIC_APP_URL` so share links and emails point to the live app.
5. Run `npm run build` in CI before deployment.
6. Smoke test `/`, `/audit`, one generated report page, and lead capture after deploy.

## Screenshots

Place final screenshots in a `/screenshots` directory when available.

- Landing page: `screenshots/landing.png`
- Audit form: `screenshots/audit-form.png`
- Results dashboard: `screenshots/results-dashboard.png`
- Public report: `screenshots/public-report.png`

## Architecture Summary

The app uses Next.js App Router for pages and API routes. Client components collect audit input and render interactive dashboards. Server routes validate submissions with Zod, rate-limit requests, calculate savings through `lib/audit-engine.ts`, optionally call OpenAI for a summary, persist to Supabase, and send Resend emails. Public report pages read by `shareId` and render a sanitized `PublicReport`.

## Engineering Tradeoffs

1. Deterministic savings engine before model-generated advice: recommendations are predictable and testable, but less nuanced than a fully dynamic advisor.
2. In-memory fallback storage: local demos work without infrastructure, but reports are not durable across restarts unless Supabase is configured.
3. No authentication in the MVP: the audit funnel has less friction, but users cannot manage historical reports yet.
4. Hardcoded pricing rules: calculations are fast and transparent, but pricing needs periodic review.
5. Optional async email delivery: API responses stay fast, but email failures are logged instead of blocking the user flow.
