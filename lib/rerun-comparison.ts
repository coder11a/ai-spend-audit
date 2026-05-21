import { calculateAudit } from "@/lib/audit-engine";
import { PRICING } from "@/lib/pricing";
import type {
  AuditRerunComparison,
  StoredAudit,
  ToolRecommendation
} from "@/types/audit";

function hasRecommendationChanged(previous: ToolRecommendation | null, current: ToolRecommendation | null) {
  if (!previous || !current) return previous !== current;

  return (
    previous.recommendedAction !== current.recommendedAction ||
    previous.severity !== current.severity ||
    previous.savings !== current.savings ||
    previous.optimizedSpend !== current.optimizedSpend ||
    previous.reasoning !== current.reasoning ||
    previous.alternative !== current.alternative
  );
}

function getSnapshotTool(audit: StoredAudit, toolId: StoredAudit["input"]["tools"][number]["toolId"], index: number) {
  const indexedTool = audit.pricingSnapshot.tools[index];
  if (indexedTool?.toolId === toolId) return indexedTool;
  return audit.pricingSnapshot.tools.find((tool) => tool.toolId === toolId) ?? null;
}

function getRecommendation(
  recommendations: ToolRecommendation[],
  toolId: StoredAudit["input"]["tools"][number]["toolId"],
  index: number
) {
  const indexedRecommendation = recommendations[index];
  if (indexedRecommendation?.toolId === toolId) return indexedRecommendation;
  return recommendations.find((recommendation) => recommendation.toolId === toolId) ?? null;
}

export function buildAuditRerunComparison(audit: StoredAudit): AuditRerunComparison {
  const currentResult = calculateAudit(audit.input, audit.result.summary);

  const rows = audit.input.tools.map((tool, index) => {
    const snapshotTool = getSnapshotTool(audit, tool.toolId, index);
    const currentPricing = PRICING[tool.toolId];
    const selectedPlan = snapshotTool?.selectedPlan ?? tool.plan;
    const previousPlan = snapshotTool?.plans[selectedPlan];
    const currentPlan = currentPricing.plans[selectedPlan];
    const previousRecommendation = getRecommendation(audit.result.recommendations, tool.toolId, index);
    const currentRecommendation = getRecommendation(currentResult.recommendations, tool.toolId, index);
    const priceChanged = previousPlan?.monthlyPrice !== currentPlan.monthlyPrice;
    const recommendationChanged = hasRecommendationChanged(previousRecommendation, currentRecommendation);

    return {
      toolId: tool.toolId,
      toolName: currentPricing.name,
      selectedPlan,
      previousPlanLabel: previousPlan?.label ?? selectedPlan,
      currentPlanLabel: currentPlan.label,
      previousPlanPrice: previousPlan?.monthlyPrice ?? 0,
      currentPlanPrice: currentPlan.monthlyPrice,
      previousRecommendation,
      currentRecommendation,
      priceChanged,
      recommendationChanged,
      savingsDelta: (currentRecommendation?.savings ?? 0) - (previousRecommendation?.savings ?? 0),
      changed: priceChanged || recommendationChanged
    };
  });

  const changedPrices = rows.filter((row) => row.priceChanged).length;
  const changedRecommendations = rows.filter((row) => row.recommendationChanged).length;
  const changedRows = rows.filter((row) => row.changed).length;

  return {
    auditId: audit.auditId ?? null,
    shareId: audit.shareId,
    userEmail: audit.userEmail ?? null,
    createdAt: audit.createdAt,
    input: audit.input,
    previousResult: audit.result,
    currentResult,
    rows,
    summary: {
      previousMonthlySavings: audit.result.monthlySavings,
      currentMonthlySavings: currentResult.monthlySavings,
      monthlySavingsDelta: currentResult.monthlySavings - audit.result.monthlySavings,
      previousOptimizedSpend: audit.result.optimizedMonthlySpend,
      currentOptimizedSpend: currentResult.optimizedMonthlySpend,
      optimizedSpendDelta: currentResult.optimizedMonthlySpend - audit.result.optimizedMonthlySpend,
      previousAnnualSavings: audit.result.annualSavings,
      currentAnnualSavings: currentResult.annualSavings,
      annualSavingsDelta: currentResult.annualSavings - audit.result.annualSavings,
      changedPrices,
      changedRecommendations,
      changedRows,
      unchangedRows: rows.length - changedRows
    }
  };
}
