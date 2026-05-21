import { afterEach, describe, expect, it } from "vitest";
import { calculateAudit } from "@/lib/audit-engine";
import { detectAuditPricingChanges } from "@/lib/pricing-change-detection";
import { PRICING } from "@/lib/pricing";
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

describe("pricing change detection", () => {
  it("detects changed prices and recommendation drift", () => {
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

    const detected = detectAuditPricingChanges(storedAudit);

    expect(detected).not.toBeNull();
    expect(detected?.changedPrices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: "cursor",
          plan: "pro",
          previousPrice: 20,
          currentPrice: 10
        })
      ])
    );
    expect(detected?.recommendationChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: "cursor",
          previousAction: "Downgrade to Pro",
          currentAction: "Downgrade to Pro",
          previousSavings: 20,
          currentSavings: 30
        })
      ])
    );
  });

  it("detects added and removed plans from the stored snapshot", () => {
    const input = {
      teamSize: 30,
      primaryUseCase: "mixed" as const,
      tools: [{ toolId: "openai-api" as const, plan: "enterprise" as const, monthlySpend: 500, seats: 1 }]
    };
    const storedAudit: StoredAudit = {
      auditId: "audit-2",
      shareId: "share-2",
      userEmail: null,
      input,
      result: calculateAudit(input, "Stored summary"),
      pricingSnapshot: snapshotForTool("openai-api", "enterprise", 500, 1),
      createdAt: "2026-01-01T00:00:00.000Z"
    };

    storedAudit.pricingSnapshot.tools[0].plans.pro = {
      label: "Legacy Pro",
      monthlyPrice: 99,
      seatBased: false,
      notes: "Retired legacy plan."
    };
    storedAudit.pricingSnapshot.tools[0].plans.payg = {
      label: "Not offered",
      monthlyPrice: 0,
      seatBased: false,
      notes: "This plan is not a standard fit for this product."
    };
    PRICING["openai-api"].plans.enterprise = {
      label: "Not offered",
      monthlyPrice: 0,
      seatBased: false,
      notes: "This plan is not a standard fit for this product."
    };

    const detected = detectAuditPricingChanges(storedAudit);

    expect(detected).not.toBeNull();
    expect(detected?.addedPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: "openai-api",
          plan: "payg",
          changeType: "added"
        })
      ])
    );
    expect(detected?.removedPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: "openai-api",
          plan: "pro",
          changeType: "removed"
        }),
        expect.objectContaining({
          toolId: "openai-api",
          plan: "enterprise",
          changeType: "removed"
        })
      ])
    );
  });
});
