# Architecture

## Overview
AI Spend Audit is built on Next.js App Router (v15) leveraging React 19. The application architecture is designed for speed, deterministic output, and graceful degradation when external services (Supabase, OpenAI, Resend) are unavailable.

## Core Technologies
- **Framework**: Next.js 15 (App Router)
- **UI & Components**: React 19, Tailwind CSS, Radix UI Primitives, Framer Motion, Recharts
- **Validation**: Zod
- **Database**: Supabase (PostgreSQL)
- **AI/LLM**: OpenAI API (for generating personalized summaries)
- **Email**: Resend (for lead capture emails)
- **Testing**: Vitest, React Testing Library

## Key Components
### Audit Engine (`lib/audit-engine.ts`)
The core of the application. It processes deterministic inputs (team size, tool spend, seats) and applies business logic to calculate right-sized plans, expected spend, and generate recommendations.
- **`calculateAudit`**: Aggregates recommendations and calculates total monthly/annual savings.
- **`recommendationForTool`**: Evaluates individual tools and flags excessive seats, unnecessary enterprise plans, or high API spend.

### Form State Management (`components/audit/audit-form.tsx`)
Uses React Hook Form combined with Zod for strict client-side validation. Persists data to local storage for crash recovery and better UX.

### Infrastructure Fallbacks
- The app falls back to in-memory storage if Supabase is unavailable.
- Uses a deterministic fallback summary if OpenAI API keys are not provided.
