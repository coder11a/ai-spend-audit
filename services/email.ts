import { Resend } from "resend";
import { absoluteUrl, currency } from "@/utils/format";
import type { AuditResult, LeadInput } from "@/types/audit";

export async function sendAuditEmail(lead: LeadInput, result?: AuditResult) {
  if (!process.env.RESEND_API_KEY) return { sent: false };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "AI Spend Audit <audit@example.com>";
  const reportUrl = lead.shareId ? absoluteUrl(`/report/${lead.shareId}`) : absoluteUrl("/");
  const savings = result ? currency(result.monthlySavings) : "your identified savings";

  await resend.emails.send({
    from,
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
