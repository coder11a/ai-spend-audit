# Reflection

**1. The hardest bug you hit this week, and how you debugged it**
The hardest bug was an SSR hydration mismatch on the Results Dashboard. The Recharts components were throwing errors because the randomly generated UUIDs and the chart dimensions calculated on the server didn't match the client's window size upon hydration. 
My initial hypothesis was that the data payload from the API was mutating between the server render and the client render. I logged the payload on both sides, but it matched perfectly. Then, I hypothesized that it was a strict-mode related issue with React 19. I tried wrapping the charts in a generic `useEffect` to only render on the client, which worked but caused a layout shift.
Finally, what worked best was using Next.js `next/dynamic` to lazy-load the chart components with `ssr: false`, and providing a skeleton loader of the exact same height. This eliminated the hydration error completely and preserved a smooth UX.

**2. A decision you reversed mid-week, and what made you reverse it**
Initially, I planned to use the OpenAI API to dynamically determine the savings and write the right-sizing recommendations. My thought was that an LLM would provide more nuanced, human-like advice for edge cases. 
However, I reversed this decision on Day 2. When testing, the LLM was inconsistent—sometimes it correctly identified that a team of 5 didn't need Enterprise, and other times it hallucinated pricing structures or suggested non-existent plans. It also took 3-5 seconds to resolve, which felt too slow. 
I reversed course and built a purely deterministic logic engine in `lib/audit-engine.ts`. The AI was relegated strictly to summarizing the deterministic output. This made the core feature testable, instant, and 100% reliable.

**3. What you would build in week 2 if you had it**
If I had a second week, I would build a "Historical Tracking & Alerting" feature with user accounts (via Supabase Auth). Currently, the audit is a one-time snapshot. I would allow teams to securely connect their corporate cards (via Stripe or Plaid integrations) to automatically ingest their actual SaaS spend. The tool would track their spend month-over-month and proactively email them if a new AI tool is expensed, or if their API usage spikes beyond their set budget. I'd also add a team-invitation flow so CTOs and Finance managers can collaborate on the same dashboard to mark recommendations as "Implemented" or "Ignored".

**4. How you used AI tools**
I used ChatGPT and Codex extensively for this project. I primarily used the AI to scaffold the boilerplate Tailwind UI components and to rapidly write the Vitest test cases for the audit engine logic based on the constraints I provided. 
I did *not* trust the AI with writing the core deterministic business logic (`audit-engine.ts`) or defining the pricing data structures, as I needed those to be exactly aligned with my specific rules. 
One specific time the AI was wrong: I asked it to write a Zod schema for a dynamic array of tools, and it hallucinated a `.unique()` method on the Zod array that doesn't exist in the current Zod API. I caught this immediately during type-checking and manually wrote a `.refine()` block to validate unique tool IDs.

**5. Self-rating on a 1–10 scale**
- **Discipline: 9/10.** I stuck rigorously to my daily plan, consistently shipping the deterministic engine before getting distracted by the "shiny" AI summarization.
- **Code quality: 8/10.** The codebase is strictly typed, modular, and well-tested, though the `audit-engine.ts` file could be refactored into smaller utility functions.
- **Design sense: 8/10.** The UI is clean, professional, and accessible using Radix UI, though it leans heavily on standard SaaS tropes.
- **Problem solving: 9/10.** I successfully implemented a complex fallback system that gracefully degrades if database, AI, or email services fail.
- **Entrepreneurial thinking: 9/10.** I focused the entire product around a specific, urgent pain point (wasted spend) and designed a GTM strategy that doesn't rely on generic SEO.
