import { Resend } from "resend";
import { renderPricingChangeNotificationEmail } from "@/services/email-templates";
import { absoluteUrl, currency } from "@/utils/format";
import type {
  AuditResult,
  LeadInput,
  PricingChangeNotificationGroup,
  PricingChangeNotificationResult
} from "@/types/audit";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;

  return {
    resend: new Resend(process.env.RESEND_API_KEY),
    from: process.env.RESEND_FROM_EMAIL || "AI Spend Audit <audit@example.com>"
  };
}

export async function sendAuditEmail(lead: LeadInput, result?: AuditResult) {
  const client = getResendClient();
  if (!client) return { sent: false };

  const reportUrl = lead.shareId ? absoluteUrl(`/report/${lead.shareId}`) : absoluteUrl("/");
  const savings = result ? currency(result.monthlySavings) : "your identified savings";

  await client.resend.emails.send({
    from: client.from,
    to: lead.email,
    subject: "Your AI Spend Audit report",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:24px">Your AI Spend Audit is ready</h1>
        <p>We found ${savings} in estimated monthly savings based on the stack details provided.</p>
        <p><a href="${reportUrl}" style="color:#0f766e">Open your shareable report</a></p>
        <p>If your savings are material, Credex can help turn these recommendations into vendor and usage changes.</p>
      </div>
    `
  });

  return { sent: true };
}

export function groupPricingChangeNotificationsByUserEmail(groups: PricingChangeNotificationGroup["audits"]) {
  const grouped = new Map<string, PricingChangeNotificationGroup>();

  for (const audit of groups) {
    const normalizedEmail = audit.userEmail?.trim().toLowerCase();
    if (!normalizedEmail) continue;

    const existing = grouped.get(normalizedEmail);
    if (existing) {
      existing.audits.push(audit);
      continue;
    }

    grouped.set(normalizedEmail, {
      userEmail: normalizedEmail,
      audits: [audit]
    });
  }

  return Array.from(grouped.values());
}

export async function sendPricingChangeNotificationEmail(
  group: PricingChangeNotificationGroup
): Promise<PricingChangeNotificationResult> {
  const client = getResendClient();
  if (!client) {
    return {
      sent: false,
      userEmail: group.userEmail,
      auditCount: group.audits.length
    };
  }

  await client.resend.emails.send({
    from: client.from,
    to: group.userEmail,
    subject: "Pricing updates affecting your AI audits",
    html: renderPricingChangeNotificationEmail(group)
  });

  return {
    sent: true,
    userEmail: group.userEmail,
    auditCount: group.audits.length
  };
}

export async function sendPricingChangeNotificationEmails(audits: PricingChangeNotificationGroup["audits"]) {
  const grouped = groupPricingChangeNotificationsByUserEmail(audits);
  const results: PricingChangeNotificationResult[] = [];

  for (const group of grouped) {
    results.push(await sendPricingChangeNotificationEmail(group));
  }

  return {
    groupedNotifications: grouped,
    sentNotifications: results,
    skippedWithoutEmail: audits.filter((audit) => !audit.userEmail?.trim()).length
  };
}
