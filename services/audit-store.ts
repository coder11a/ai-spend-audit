import { getSupabaseAdmin } from "@/services/supabase";
import { PRICING } from "@/lib/pricing";
import type {
  AuditInput,
  AuditPricingSnapshot,
  AuditRecord,
  AuditResult,
  LeadInput,
  PersistedAuditRow,
  StoredAudit,
  PublicReport
} from "@/types/audit";

type LocalAuditStore = {
  audits: Map<string, AuditRecord>;
  reports: Map<string, PublicReport>;
  leads: LeadInput[];
};

const globalForAuditStore = globalThis as typeof globalThis & {
  __aiSpendAuditStore?: LocalAuditStore;
};

function getLocalStore() {
  globalForAuditStore.__aiSpendAuditStore ??= {
    audits: new Map<string, AuditRecord>(),
    reports: new Map<string, PublicReport>(),
    leads: []
  };

  return globalForAuditStore.__aiSpendAuditStore;
}

function saveLocalAudit(record: AuditRecord) {
  const store = getLocalStore();
  store.audits.set(record.share_id, record);
  store.reports.set(record.share_id, record.public_payload);
}

function buildPricingSnapshot(input: AuditInput): AuditPricingSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    tools: input.tools.map((tool) => {
      const pricing = PRICING[tool.toolId];

      return {
        toolId: tool.toolId,
        toolName: pricing.name,
        category: pricing.category,
        selectedPlan: tool.plan,
        enteredMonthlySpend: tool.monthlySpend,
        enteredSeats: tool.seats,
        plans: pricing.plans
      };
    })
  };
}

function toAuditRecord(row: Partial<PersistedAuditRow> & { share_id: string; input?: AuditInput; result?: AuditResult }): AuditRecord {
  const input = row.input_stack ?? row.input;
  const result = row.output_result ?? row.result;

  if (!input || !result) {
    throw new Error("Stored audit is missing input or result payload.");
  }

  return {
    id: row.id,
    share_id: row.share_id,
    user_email: row.user_email ?? input.email ?? null,
    input,
    result,
    pricing_snapshot: row.pricing_snapshot,
    public_payload: {
      ...result,
      toolCount: input.tools.length
    },
    created_at: row.created_at
  };
}

export async function saveAudit(input: AuditInput, result: AuditResult, publicReport: PublicReport) {
  const pricingSnapshot = buildPricingSnapshot(input);
  const record: AuditRecord = {
    share_id: result.shareId,
    user_email: input.email || null,
    input,
    result,
    pricing_snapshot: pricingSnapshot,
    public_payload: publicReport
  };
  const dbRecord: PersistedAuditRow = {
    share_id: result.shareId,
    user_email: input.email || null,
    input_stack: input,
    output_result: result,
    pricing_snapshot: pricingSnapshot
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    saveLocalAudit(record);
    return { persisted: false, storage: "memory" as const, auditId: null };
  }

  const { data: auditRow, error } = await supabase.from("audits").insert(dbRecord).select("id").single();
  if (error || !auditRow?.id) {
    saveLocalAudit(record);
    throw new Error(error?.message || "Failed to create audit record.");
  }

  const { error: reportError } = await supabase.from("shared_reports").insert({
    share_id: result.shareId,
    public_payload: publicReport
  });
  if (reportError) {
    await supabase.from("audits").delete().eq("id", auditRow.id);
    saveLocalAudit(record);
    throw new Error(reportError.message);
  }

  return { persisted: true, storage: "supabase" as const, auditId: auditRow.id as string };
}

export async function getAuditByShareId(shareId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalStore().audits.get(shareId) ?? null;

  const { data, error } = await supabase.from("audits").select("*").eq("share_id", shareId).single();
  if (error) return getLocalStore().audits.get(shareId) ?? null;
  return toAuditRecord(data as Partial<PersistedAuditRow> & { share_id: string; input?: AuditInput; result?: AuditResult });
}

export async function getStoredAuditById(auditId: string) {
  const localRecord = Array.from(getLocalStore().audits.values()).find((record) => record.id === auditId);

  const supabase = getSupabaseAdmin();
  if (!supabase) return localRecord ? toStoredAudit(localRecord) : null;

  const { data, error } = await supabase.from("audits").select("*").eq("id", auditId).single();
  if (error || !data) return localRecord ? toStoredAudit(localRecord) : null;

  return {
    auditId: data.id ?? null,
    shareId: data.share_id,
    userEmail: data.user_email ?? null,
    input: data.input_stack,
    result: data.output_result,
    pricingSnapshot: data.pricing_snapshot,
    createdAt: data.created_at
  } satisfies StoredAudit;
}

function toStoredAudit(record: AuditRecord): StoredAudit | null {
  if (!record.pricing_snapshot) return null;

  return {
    auditId: record.id ?? null,
    shareId: record.share_id,
    userEmail: record.user_email ?? null,
    input: record.input,
    result: record.result,
    pricingSnapshot: record.pricing_snapshot,
    createdAt: record.created_at
  };
}

export async function getStoredAudits() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Array.from(getLocalStore().audits.values())
      .map((record) => toStoredAudit(record))
      .filter((record): record is StoredAudit => Boolean(record));
  }

  const { data, error } = await supabase.from("audits").select("*").order("created_at", { ascending: false });
  if (error) {
    return Array.from(getLocalStore().audits.values())
      .map((record) => toStoredAudit(record))
      .filter((record): record is StoredAudit => Boolean(record));
  }

  return (data as PersistedAuditRow[]).map((row) => ({
    auditId: row.id ?? null,
    shareId: row.share_id,
    userEmail: row.user_email ?? null,
    input: row.input_stack,
    result: row.output_result,
    pricingSnapshot: row.pricing_snapshot,
    createdAt: row.created_at
  }));
}

export async function getPublicReport(shareId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalStore().reports.get(shareId) ?? null;

  const { data, error } = await supabase
    .from("shared_reports")
    .select("public_payload")
    .eq("share_id", shareId)
    .single();

  if (error) return getLocalStore().reports.get(shareId) ?? null;
  return data.public_payload as PublicReport;
}

export async function saveLead(lead: LeadInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    getLocalStore().leads.push(lead);
    return { persisted: false, storage: "memory" as const };
  }

  const { error } = await supabase.from("leads").insert({
    email: lead.email,
    company_name: lead.companyName,
    role: lead.role,
    team_size: lead.teamSize,
    share_id: lead.shareId
  });

  if (error) throw new Error(error.message);
  return { persisted: true, storage: "supabase" as const };
}
