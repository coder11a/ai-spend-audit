export const TOOL_IDS = [
  "cursor",
  "github-copilot",
  "claude",
  "chatgpt",
  "anthropic-api",
  "openai-api",
  "gemini",
  "windsurf"
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type UseCase = "coding" | "writing" | "research" | "data-analysis" | "mixed";

export type PlanTier = "free" | "pro" | "team" | "enterprise" | "payg";

export type ToolInput = {
  toolId: ToolId;
  plan: PlanTier;
  monthlySpend: number;
  seats: number;
};

export type AuditInput = {
  teamSize: number;
  primaryUseCase: UseCase;
  tools: ToolInput[];
  email?: string;
  companyName?: string;
  role?: string;
  website?: string;
};

export type RecommendationSeverity = "low" | "medium" | "high";

export type ToolRecommendation = {
  toolId: ToolId;
  toolName: string;
  currentSpend: number;
  optimizedSpend: number;
  savings: number;
  recommendedAction: string;
  reasoning: string;
  alternative?: string;
  severity: RecommendationSeverity;
};

export type AuditResult = {
  currentMonthlySpend: number;
  optimizedMonthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPercentage: number;
  recommendations: ToolRecommendation[];
  summary: string;
  shareId: string;
  primaryUseCase: UseCase;
  teamSize: number;
  createdAt: string;
};

export type AuditPricingSnapshotPlan = {
  label: string;
  monthlyPrice: number;
  seatBased: boolean;
  minTeamSize?: number;
  notes: string;
};

export type AuditPricingSnapshotTool = {
  toolId: ToolId;
  toolName: string;
  category: "assistant" | "coding" | "api" | "research";
  selectedPlan: PlanTier;
  enteredMonthlySpend: number;
  enteredSeats: number;
  plans: Record<PlanTier, AuditPricingSnapshotPlan>;
};

export type AuditPricingSnapshot = {
  capturedAt: string;
  tools: AuditPricingSnapshotTool[];
};

export type PersistedAuditRow = {
  id?: string;
  share_id: string;
  user_email?: string | null;
  input_stack: AuditInput;
  output_result: AuditResult;
  pricing_snapshot: AuditPricingSnapshot;
  created_at?: string;
};

export type AuditRecord = {
  id?: string;
  share_id: string;
  user_email?: string | null;
  input: AuditInput;
  result: AuditResult;
  pricing_snapshot?: AuditPricingSnapshot;
  public_payload: PublicReport;
  created_at?: string;
};

export type PublicReport = Omit<AuditResult, "shareId"> & {
  shareId: string;
  toolCount: number;
};

export type LeadInput = {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  shareId?: string;
  website?: string;
};

export type CreateAuditResponse = {
  result?: AuditResult;
  error?: string;
  persisted?: boolean;
  auditId?: string | null;
};

export type StoredAudit = {
  auditId?: string | null;
  shareId: string;
  userEmail?: string | null;
  input: AuditInput;
  result: AuditResult;
  pricingSnapshot: AuditPricingSnapshot;
  createdAt?: string;
};

export type AuditRerunComparisonRow = {
  toolId: ToolId;
  toolName: string;
  selectedPlan: PlanTier;
  previousPlanLabel: string;
  currentPlanLabel: string;
  previousPlanPrice: number;
  currentPlanPrice: number;
  previousRecommendation: ToolRecommendation | null;
  currentRecommendation: ToolRecommendation | null;
  priceChanged: boolean;
  recommendationChanged: boolean;
  savingsDelta: number;
  changed: boolean;
};

export type AuditRerunComparisonSummary = {
  previousMonthlySavings: number;
  currentMonthlySavings: number;
  monthlySavingsDelta: number;
  previousOptimizedSpend: number;
  currentOptimizedSpend: number;
  optimizedSpendDelta: number;
  previousAnnualSavings: number;
  currentAnnualSavings: number;
  annualSavingsDelta: number;
  changedPrices: number;
  changedRecommendations: number;
  changedRows: number;
  unchangedRows: number;
};

export type AuditRerunComparison = {
  auditId?: string | null;
  shareId: string;
  userEmail?: string | null;
  createdAt?: string;
  input: AuditInput;
  previousResult: AuditResult;
  currentResult: AuditResult;
  rows: AuditRerunComparisonRow[];
  summary: AuditRerunComparisonSummary;
};

export type PricingPriceChange = {
  toolIndex: number;
  toolId: ToolId;
  toolName: string;
  plan: PlanTier;
  previousPrice: number;
  currentPrice: number;
};

export type PricingPlanChange = {
  toolIndex: number;
  toolId: ToolId;
  toolName: string;
  plan: PlanTier;
  changeType: "added" | "removed";
};

export type RecommendationChange = {
  toolIndex: number;
  toolId: ToolId;
  previousAction: string;
  currentAction: string;
  previousSeverity: RecommendationSeverity;
  currentSeverity: RecommendationSeverity;
  previousSavings: number;
  currentSavings: number;
};

export type AuditChangeDetectionResult = {
  auditId?: string | null;
  shareId: string;
  userEmail?: string | null;
  createdAt?: string;
  changedPrices: PricingPriceChange[];
  addedPlans: PricingPlanChange[];
  removedPlans: PricingPlanChange[];
  recommendationChanges: RecommendationChange[];
};

export type PricingChangeNotificationGroup = {
  userEmail: string;
  audits: AuditChangeDetectionResult[];
};

export type PricingChangeNotificationResult = {
  sent: boolean;
  userEmail: string;
  auditCount: number;
};
