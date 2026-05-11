import { getSupabaseAdmin } from "@/services/supabase";
import type { AuditInput, AuditRecord, AuditResult, LeadInput, PublicReport } from "@/types/audit";

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

export async function saveAudit(input: AuditInput, result: AuditResult, publicReport: PublicReport) {
  const record: AuditRecord = {
    share_id: result.shareId,
    input,
    result,
    public_payload: publicReport
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    saveLocalAudit(record);
    return { persisted: false, storage: "memory" as const };
  }

  const { error } = await supabase.from("audits").insert(record);
  if (error) {
    saveLocalAudit(record);
    throw new Error(error.message);
  }

  const { error: reportError } = await supabase.from("shared_reports").insert({
    share_id: result.shareId,
    public_payload: publicReport
  });
  if (reportError) {
    saveLocalAudit(record);
    throw new Error(reportError.message);
  }

  return { persisted: true, storage: "supabase" as const };
}

export async function getAuditByShareId(shareId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return getLocalStore().audits.get(shareId) ?? null;

  const { data, error } = await supabase.from("audits").select("*").eq("share_id", shareId).single();
  if (error) return getLocalStore().audits.get(shareId) ?? null;
  return data as AuditRecord;
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
