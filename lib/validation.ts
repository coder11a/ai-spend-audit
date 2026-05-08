import { z } from "zod";
import { TOOL_IDS } from "@/types/audit";

export const toolInputSchema = z.object({
  toolId: z.enum(TOOL_IDS),
  plan: z.enum(["free", "pro", "team", "enterprise", "payg"]),
  monthlySpend: z.coerce.number().min(0).max(100000),
  seats: z.coerce.number().int().min(1).max(10000)
});

export const auditInputSchema = z.object({
  teamSize: z.coerce.number().int().min(1).max(10000),
  primaryUseCase: z.enum(["coding", "writing", "research", "data-analysis", "mixed"]),
  tools: z.array(toolInputSchema).min(1).max(20),
  email: z.string().email().optional().or(z.literal("")),
  companyName: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  website: z.string().max(0).optional()
});

export const leadInputSchema = z.object({
  email: z.string().email(),
  companyName: z.string().max(120).optional().or(z.literal("")),
  role: z.string().max(120).optional().or(z.literal("")),
  teamSize: z.coerce.number().int().min(1).max(10000).optional(),
  shareId: z.string().min(4).max(32).optional(),
  website: z.string().max(0).optional()
});

export type AuditInputValues = z.infer<typeof auditInputSchema>;
export type LeadInputValues = z.infer<typeof leadInputSchema>;
