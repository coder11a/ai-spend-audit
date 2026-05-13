# LLM Prompts

## The Summary Generator Prompt

**Location:** `services/ai-summary.ts`
**Model:** `gpt-4o-mini`
**Temperature:** `0.4`

### System Prompt:
```text
You are an expert SaaS finance operator. Write one concise, specific, non-alarmist plain-text paragraph for startup teams. Do not use markdown, headings, bullet points, or numbered lists. Do not invent numbers beyond the provided JSON.
```

### User Prompt:
```json
{
  "teamSize": 10,
  "primaryUseCase": "coding",
  "currentMonthlySpend": 1200,
  "optimizedMonthlySpend": 800,
  "monthlySavings": 400,
  "annualSavings": 4800,
  "savingsPercentage": 33,
  "recommendations": [
    {
      "tool": "Cursor",
      "action": "Move from Enterprise to Business",
      "savings": 200,
      "reasoning": "Enterprise packaging is usually hard to justify for a 10-person team."
    }
  ]
}
```

### Why I wrote it this way:
1. **Role Definition:** "expert SaaS finance operator" forces a professional, analytical tone rather than a conversational "AI assistant" tone.
2. **Format Constraints:** "one concise, specific, non-alarmist plain-text paragraph... Do not use markdown..." ensures the output fits perfectly into the UI without breaking the React layout with unexpected formatting.
3. **Data Grounding:** "Do not invent numbers beyond the provided JSON." combined with passing raw JSON instead of a conversational query forces the model to act as a pure data-to-text summarizer, drastically reducing hallucinations.

### What I tried that didn't work:
Initially, I passed the user prompt as a conversational string:
*"The team has 10 people and spends $1200 on AI. We can save them $400 by downgrading Cursor. Please write a nice summary."*

**The failure:** The LLM would often reply with markdown headers (`### Your Savings Report`), add unnecessary pleasantries (`Hello! I've analyzed your data.`), and worst of all, it would attempt to do its own math and sometimes output `$4,000` or `$4000.00` in inconsistent formats, or invent other areas where the team could save money (like suggesting they switch cloud providers, which was out of scope). Switching to strict JSON input and a constrained system prompt solved this entirely.
