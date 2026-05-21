import { calculateAudit } from "@/lib/audit-engine";
import { PRICING, type PlanRule } from "@/lib/pricing";
import { PLAN_ORDER } from "@/lib/pricing";
import type {
  AuditChangeDetectionResult,
  AuditPricingSnapshotTool,
  PricingPlanChange,
  PricingPriceChange,
  RecommendationChange,
  StoredAudit,
  ToolRecommendation
} from "@/types/audit";

function isPlanAvailable(plan: PlanRule) {
  return plan.label !== "Not offered";
}

function detectToolPriceChanges(tool: AuditPricingSnapshotTool, toolIndex: number) {
  const currentPricing = PRICING[tool.toolId];
  const changedPrices: PricingPriceChange[] = [];
  const addedPlans: PricingPlanChange[] = [];
  const removedPlans: PricingPlanChange[] = [];

  for (const plan of PLAN_ORDER) {
    const previousPlan = tool.plans[plan];
    const currentPlan = currentPricing.plans[plan];
    const wasAvailable = isPlanAvailable(previousPlan);
    const isAvailable = isPlanAvailable(currentPlan);

    if (wasAvailable && isAvailable && previousPlan.monthlyPrice !== currentPlan.monthlyPrice) {
      changedPrices.push({
        toolIndex,
        toolId: tool.toolId,
        toolName: currentPricing.name,
        plan,
        previousPrice: previousPlan.monthlyPrice,
        currentPrice: currentPlan.monthlyPrice
      });
    }

    if (!wasAvailable && isAvailable) {
      addedPlans.push({
        toolIndex,
        toolId: tool.toolId,
        toolName: currentPricing.name,
        plan,
        changeType: "added"
      });
    }

    if (wasAvailable && !isAvailable) {
      removedPlans.push({
        toolIndex,
        toolId: tool.toolId,
        toolName: currentPricing.name,
        plan,
        changeType: "removed"
      });
    }
  }

  return { changedPrices, addedPlans, removedPlans };
}

function hasRecommendationChanged(previous: ToolRecommendation, current: ToolRecommendation) {
  return (
    previous.recommendedAction !== current.recommendedAction ||
    previous.severity !== current.severity ||
    previous.savings !== current.savings ||
    previous.optimizedSpend !== current.optimizedSpend ||
    previous.reasoning !== current.reasoning ||
    previous.alternative !== current.alternative
  );
}

function detectRecommendationChanges(audit: StoredAudit) {
  const recalculated = calculateAudit(audit.input, audit.result.summary);
  const recommendationChanges: RecommendationChange[] = [];

  for (const [toolIndex, currentRecommendation] of recalculated.recommendations.entries()) {
    const previousRecommendation = audit.result.recommendations[toolIndex];
    if (!previousRecommendation || !hasRecommendationChanged(previousRecommendation, currentRecommendation)) continue;

    recommendationChanges.push({
      toolIndex,
      toolId: currentRecommendation.toolId,
      previousAction: previousRecommendation.recommendedAction,
      currentAction: currentRecommendation.recommendedAction,
      previousSeverity: previousRecommendation.severity,
      currentSeverity: currentRecommendation.severity,
      previousSavings: previousRecommendation.savings,
      currentSavings: currentRecommendation.savings
    });
  }

  return recommendationChanges;
}

export function detectAuditPricingChanges(audit: StoredAudit): AuditChangeDetectionResult | null {
  const changedPrices: PricingPriceChange[] = [];
  const addedPlans: PricingPlanChange[] = [];
  const removedPlans: PricingPlanChange[] = [];

  for (const [toolIndex, tool] of audit.pricingSnapshot.tools.entries()) {
    const toolChanges = detectToolPriceChanges(tool, toolIndex);
    changedPrices.push(...toolChanges.changedPrices);
    addedPlans.push(...toolChanges.addedPlans);
    removedPlans.push(...toolChanges.removedPlans);
  }

  const recommendationChanges = detectRecommendationChanges(audit);
  const hasChanges =
    changedPrices.length > 0 ||
    addedPlans.length > 0 ||
    removedPlans.length > 0 ||
    recommendationChanges.length > 0;

  if (!hasChanges) return null;

  return {
    auditId: audit.auditId ?? null,
    shareId: audit.shareId,
    userEmail: audit.userEmail ?? null,
    createdAt: audit.createdAt,
    changedPrices,
    addedPlans,
    removedPlans,
    recommendationChanges
  };
}

export function detectPricingChangesForAudits(audits: StoredAudit[]) {
  return audits
    .map((audit) => detectAuditPricingChanges(audit))
    .filter((audit): audit is AuditChangeDetectionResult => Boolean(audit));
}
