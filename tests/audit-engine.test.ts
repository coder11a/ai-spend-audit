import { describe, expect, it } from "vitest";
import { calculateAudit } from "@/lib/audit-engine";

describe("calculateAudit", () => {
  it("recommends downgrading a one-person team plan", () => {
    const result = calculateAudit({
      teamSize: 1,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", plan: "team", monthlySpend: 40, seats: 1 }]
    });

    expect(result.monthlySavings).toBe(20);
    expect(result.recommendations[0].recommendedAction).toContain("Downgrade");
  });

  it("flags enterprise plans for tiny teams", () => {
    const result = calculateAudit({
      teamSize: 4,
      primaryUseCase: "mixed",
      tools: [{ toolId: "chatgpt", plan: "enterprise", monthlySpend: 240, seats: 4 }]
    });

    expect(result.recommendations[0].severity).toBe("high");
    expect(result.monthlySavings).toBeGreaterThan(0);
  });

  it("suggests API controls for high small-team usage", () => {
    const result = calculateAudit({
      teamSize: 6,
      primaryUseCase: "data-analysis",
      tools: [{ toolId: "openai-api", plan: "payg", monthlySpend: 2000, seats: 1 }]
    });

    expect(result.recommendations[0].recommendedAction).toContain("routing");
    expect(result.monthlySavings).toBe(560);
  });
});
