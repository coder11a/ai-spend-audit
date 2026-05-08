import { nanoid } from "nanoid";
import { PRICING } from "@/lib/pricing";
import type { AuditInput, AuditResult, PlanTier, PublicReport, ToolRecommendation } from "@/types/audit";

function expectedPlanSpend(plan: PlanTier, seats: number, actualSpend: number, toolId: keyof typeof PRICING) {
  const rule = PRICING[toolId].plans[plan];
  if (!rule.seatBased) return actualSpend;
  return rule.monthlyPrice * seats;
}

function nearestRightSizedPlan(input: AuditInput, toolId: keyof typeof PRICING, currentPlan: PlanTier): PlanTier {
  const pricing = PRICING[toolId];
  if (currentPlan === "enterprise" && input.teamSize < 25) return input.teamSize <= 2 ? "pro" : "team";
  if (currentPlan === "team" && input.teamSize <= 1) return "pro";
  if (pricing.category === "coding" && input.primaryUseCase !== "coding" && currentPlan === "team") return "pro";
  return currentPlan;
}

function recommendationForTool(input: AuditInput, tool: AuditInput["tools"][number]): ToolRecommendation {
  const pricing = PRICING[tool.toolId];
  const currentRule = pricing.plans[tool.plan];
  const rightSizedPlan = nearestRightSizedPlan(input, tool.toolId, tool.plan);
  const rightSizedRule = pricing.plans[rightSizedPlan];
  const expectedCurrent = expectedPlanSpend(tool.plan, tool.seats, tool.monthlySpend, tool.toolId);

  let optimizedSpend = rightSizedRule.seatBased
    ? rightSizedRule.monthlyPrice * Math.min(tool.seats, input.teamSize)
    : tool.monthlySpend;

  let action = `Keep ${currentRule.label}, add spend monitoring`;
  let reasoning = `${pricing.name} looks close to expected pricing for your team size.`;
  let severity: ToolRecommendation["severity"] = "low";

  if (tool.plan === "enterprise" && input.teamSize < 25) {
    action = `Move from ${currentRule.label} to ${rightSizedRule.label}`;
    reasoning = `Enterprise packaging is usually hard to justify for a ${input.teamSize}-person team.`;
    severity = "high";
  } else if (tool.plan === "team" && input.teamSize === 1) {
    action = `Downgrade to ${rightSizedRule.label}`;
    reasoning = "A team plan with one active user is paying for admin features you likely do not need.";
    severity = "medium";
  } else if (pricing.category === "api" && tool.monthlySpend > 1000 && input.teamSize < 10) {
    optimizedSpend = tool.monthlySpend * 0.72;
    action = "Add model routing, caching, and hard monthly caps";
    reasoning = "High API spend on a small team usually hides repeated prompts, unbatched jobs, or premium models used by default.";
    severity = "high";
  } else if (pricing.category === "coding" && input.primaryUseCase !== "coding" && tool.seats > Math.ceil(input.teamSize * 0.5)) {
    optimizedSpend = Math.ceil(input.teamSize * 0.5) * rightSizedRule.monthlyPrice;
    action = "Limit seats to engineering-heavy users";
    reasoning = "Coding assistants rarely need full-company rollout when your primary use case is broader.";
    severity = "medium";
  } else if (expectedCurrent > 0 && tool.monthlySpend > expectedCurrent * 1.25) {
    optimizedSpend = expectedCurrent;
    action = "Audit unused paid seats";
    reasoning = "Reported spend is meaningfully above list pricing for the selected plan and seats.";
    severity = "medium";
  }

  optimizedSpend = Math.max(0, Math.min(tool.monthlySpend, Math.round(optimizedSpend)));
  const savings = Math.max(0, Math.round(tool.monthlySpend - optimizedSpend));

  return {
    toolId: tool.toolId,
    toolName: pricing.name,
    currentSpend: Math.round(tool.monthlySpend),
    optimizedSpend,
    savings,
    recommendedAction: action,
    reasoning,
    alternative: pricing.alternatives[input.primaryUseCase],
    severity
  };
}

export function calculateAudit(input: AuditInput, summary = ""): AuditResult {
  const recommendations = input.tools.map((tool) => recommendationForTool(input, tool));
  const currentMonthlySpend = recommendations.reduce((sum, item) => sum + item.currentSpend, 0);
  const optimizedMonthlySpend = recommendations.reduce((sum, item) => sum + item.optimizedSpend, 0);
  const monthlySavings = Math.max(0, currentMonthlySpend - optimizedMonthlySpend);
  const savingsPercentage = currentMonthlySpend === 0 ? 0 : Math.round((monthlySavings / currentMonthlySpend) * 100);

  return {
    currentMonthlySpend,
    optimizedMonthlySpend,
    monthlySavings,
    annualSavings: monthlySavings * 12,
    savingsPercentage,
    recommendations,
    summary,
    shareId: nanoid(10),
    primaryUseCase: input.primaryUseCase,
    teamSize: input.teamSize,
    createdAt: new Date().toISOString()
  };
}

export function toPublicReport(input: AuditInput, result: AuditResult): PublicReport {
  return {
    ...result,
    toolCount: input.tools.length
  };
}

export function fallbackSummary(input: AuditInput, result: AuditResult) {
  const top = result.recommendations.find((item) => item.savings > 0);
  if (result.monthlySavings <= 0) {
    return `Your AI stack is already relatively lean for a ${input.teamSize}-person team. The best next move is governance: assign owners, review seats monthly, and set API alerts before spend grows.`;
  }

  return `Your team can likely save ${result.savingsPercentage}% on AI tooling, or about $${result.annualSavings.toLocaleString()} per year. The biggest opportunity is ${top?.toolName ?? "seat and plan cleanup"}: ${top?.reasoning ?? "several subscriptions appear larger than the current team needs."} Start with plan downgrades and unused seats before changing workflows.`;
}
