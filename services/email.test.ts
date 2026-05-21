import { describe, expect, it } from "vitest";
import { renderPricingChangeNotificationEmail } from "@/services/email-templates";
import { groupPricingChangeNotificationsByUserEmail } from "@/services/email";
import type { AuditChangeDetectionResult } from "@/types/audit";

const affectedAudit: AuditChangeDetectionResult = {
  auditId: "audit-1",
  shareId: "share-1",
  userEmail: "USER@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
  changedPrices: [
    {
      toolIndex: 0,
      toolId: "cursor",
      toolName: "Cursor",
      plan: "pro",
      previousPrice: 20,
      currentPrice: 25
    }
  ],
  addedPlans: [],
  removedPlans: [],
  recommendationChanges: [
    {
      toolIndex: 0,
      toolId: "cursor",
      previousAction: "Downgrade to Pro",
      currentAction: "Keep Pro, add spend monitoring",
      previousSeverity: "medium",
      currentSeverity: "low",
      previousSavings: 20,
      currentSavings: 15
    }
  ]
};

describe("pricing change email support", () => {
  it("groups affected audits by normalized email", () => {
    const grouped = groupPricingChangeNotificationsByUserEmail([
      affectedAudit,
      {
        ...affectedAudit,
        auditId: "audit-2",
        shareId: "share-2",
        userEmail: "user@example.com"
      },
      {
        ...affectedAudit,
        auditId: "audit-3",
        shareId: "share-3",
        userEmail: null
      }
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].userEmail).toBe("user@example.com");
    expect(grouped[0].audits).toHaveLength(2);
  });

  it("renders changed prices, old and new recommendations, and re-audit links", () => {
    const html = renderPricingChangeNotificationEmail({
      userEmail: "user@example.com",
      audits: [affectedAudit]
    });

    expect(html).toContain("changed from $20 to $25");
    expect(html).toContain("Old recommendation: Downgrade to Pro");
    expect(html).toContain("New recommendation: Keep Pro, add spend monitoring");
    expect(html).toContain("/audit?shareId=share-1&auditId=audit-1");
  });
});
