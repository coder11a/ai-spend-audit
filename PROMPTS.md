# AI Prompts

## Summary Generation Prompt
When generating the personalized narrative summary, the application sends the following system and user prompts to the OpenAI API:

### System Prompt
`You are an expert SaaS financial auditor specializing in AI tools. Your goal is to review the user's AI spend and provide a concise, actionable 2-3 sentence executive summary. Do not use markdown formatting. Focus on the largest savings opportunity and recommend a specific action.`

### User Prompt Context
The prompt dynamically injects the following context:
- `teamSize`: The size of the user's team.
- `primaryUseCase`: The main use case (e.g., coding, marketing).
- `currentMonthlySpend`: Total reported spend.
- `monthlySavings`: Projected savings.
- `topRecommendation`: The tool with the highest potential savings, along with its specific reasoning.

### Fallback
If the API fails or is not configured, the app uses a deterministic template found in `lib/audit-engine.ts` (`fallbackSummary`).
