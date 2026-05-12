import OpenAI from "openai";
import { fallbackSummary } from "@/lib/audit-engine";
import type { AuditInput, AuditResult } from "@/types/audit";

export async function generatePersonalizedSummary(input: AuditInput, result: AuditResult) {
  if (!process.env.OPENAI_API_KEY) return fallbackSummary(input, result);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 170,
      messages: [
        {
          role: "system",
          content:
            "You are an expert SaaS finance operator. Write one concise, specific, non-alarmist plain-text paragraph for startup teams. Do not use markdown, headings, bullet points, or numbered lists. Do not invent numbers beyond the provided JSON."
        },
        {
          role: "user",
          content: JSON.stringify({
            teamSize: input.teamSize,
            primaryUseCase: input.primaryUseCase,
            currentMonthlySpend: result.currentMonthlySpend,
            optimizedMonthlySpend: result.optimizedMonthlySpend,
            monthlySavings: result.monthlySavings,
            annualSavings: result.annualSavings,
            savingsPercentage: result.savingsPercentage,
            recommendations: result.recommendations.map((item) => ({
              tool: item.toolName,
              action: item.recommendedAction,
              savings: item.savings,
              reasoning: item.reasoning
            }))
          })
        }
      ]
    });

    return completion.choices[0]?.message.content?.trim() || fallbackSummary(input, result);
  } catch {
    return fallbackSummary(input, result);
  }
}
