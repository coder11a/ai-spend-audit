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

export type AuditRecord = {
  id?: string;
  share_id: string;
  input: AuditInput;
  result: AuditResult;
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
