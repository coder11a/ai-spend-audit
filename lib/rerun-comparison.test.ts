import { afterEach, describe, expect, it } from "vitest";
import { calculateAudit } from "@/lib/audit-engine";
import { PRICING } from "@/lib/pricing";
import { buildAuditRerunComparison } from "@/lib/rerun-comparison";
import type { AuditPricingSnapshot, StoredAudit, ToolId } from "@/types/audit";

const originalPricing = structuredClone(PRICING);

function restorePricing() {
  for (const toolId of Object.keys(PRICING) as ToolId[]) {
    PRICING[toolId].name = originalPricing[toolId].name;
    PRICING[toolId].category = originalPricing[toolId].category;
    PRICING[toolId].alternatives = structuredClone(originalPricing[toolId].alternatives);

    for (const plan of Object.keys(PRICING[toolId].plans) as Array<keyof typeof PRICING[typeof toolId]["plans"]>) {
      PRICING[toolId].plans[plan] = structuredClone(originalPricing[toolId].plans[plan]);
    }
  }
}

function snapshotForTool(toolId: ToolId, selectedPlan: StoredAudit["input"]["tools"][number]["plan"], monthlySpend: number, seats: number): AuditPricingSnapshot {
  return {
    capturedAt: "2026-01-01T00:00:00.000Z",
    tools: [
      {
        toolId,
        toolName: PRICING[toolId].name,
        category: PRICING[toolId].category,
        selectedPlan,
        enteredMonthlySpend: monthlySpend,
        enteredSeats: seats,
        plans: structuredClone(PRICING[toolId].plans)
      }
    ]
  };
}

afterEach(() => {
  restorePricing();
});

describe("buildAuditRerunComparison", () => {
  it("captures selected plan price changes and savings delta", () => {
    const input = {
      teamSize: 1,
      primaryUseCase: "coding" as const,
      tools: [{ toolId: "cursor" as const, plan: "team" as const, monthlySpend: 40, seats: 1 }]
    };
    const storedAudit: StoredAudit = {
      auditId: "audit-1",
      shareId: "share-1",
      userEmail: "team@example.com",
      input,
      result: calculateAudit(input, "Stored summary"),
      pricingSnapshot: snapshotForTool("cursor", "team", 40, 1),
      createdAt: "2026-01-01T00:00:00.000Z"
    };

    PRICING.cursor.plans.pro.monthlyPrice = 10;

    const comparison = buildAuditRerunComparison(storedAudit);

    expect(comparison.summary.monthlySavingsDelta).toBe(10);
    expect(comparison.summary.changedRecommendations).toBe(1);
    expect(comparison.summary.changedRows).toBe(1);
    expect(comparison.rows[0]).toEqual(
      expect.objectContaining({
        toolId: "cursor",
        priceChanged: false,
        recommendationChanged: true,
        savingsDelta: 10
      })
    );
  });

  it("marks a row changed when the selected plan price changes", () => {
    const input = {
      teamSize: 5,
      primaryUseCase: "research" as const,
      tools: [{ toolId: "gemini" as const, plan: "pro" as const, monthlySpend: 100, seats: 5 }]
    };
    const storedAudit: StoredAudit = {
      auditId: "audit-2",
      shareId: "share-2",
      userEmail: null,
      input,
      result: calculateAudit(input, "Stored summary"),
      pricingSnapshot: snapshotForTool("gemini", "pro", 100, 5),
      createdAt: "2026-01-01T00:00:00.000Z"
    };

    PRICING.gemini.plans.pro.monthlyPrice = 25;

    const comparison = buildAuditRerunComparison(storedAudit);

    expect(comparison.summary.changedPrices).toBe(1);
    expect(comparison.summary.changedRows).toBe(1);
    expect(comparison.rows[0]).toEqual(
      expect.objectContaining({
        toolId: "gemini",
        previousPlanPrice: 20,
        currentPlanPrice: 25,
        priceChanged: true,
        changed: true
      })
    );
  });
});
