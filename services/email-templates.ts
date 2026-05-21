import type { PricingChangeNotificationGroup } from "@/types/audit";
import { absoluteUrl, currency } from "@/utils/format";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPlan(plan: string) {
  return plan.toUpperCase();
}

function renderChangedPrices(group: PricingChangeNotificationGroup) {
  const items = group.audits.flatMap((audit) =>
    audit.changedPrices.map((change) => {
      const toolName = escapeHtml(change.toolName);
      const plan = escapeHtml(formatPlan(change.plan));

      return `<li><strong>${toolName}</strong> (${plan}) changed from ${currency(change.previousPrice)} to ${currency(change.currentPrice)}.</li>`;
    })
  );

  if (items.length === 0) return "";

  return `
    <h2 style="font-size:18px;margin:24px 0 12px">Changed tool prices</h2>
    <ul style="padding-left:20px;margin:0;line-height:1.7">
      ${items.join("")}
    </ul>
  `;
}

function renderRecommendationChanges(group: PricingChangeNotificationGroup) {
  const items = group.audits.flatMap((audit) =>
    audit.recommendationChanges.map((change) => {
      const previousAction = escapeHtml(change.previousAction);
      const currentAction = escapeHtml(change.currentAction);

      return `
        <li style="margin-bottom:12px">
          <strong>${escapeHtml(change.toolId)}</strong><br />
          Old recommendation: ${previousAction}<br />
          New recommendation: ${currentAction}
        </li>
      `;
    })
  );

  if (items.length === 0) return "";

  return `
    <h2 style="font-size:18px;margin:24px 0 12px">Recommendation updates</h2>
    <ul style="padding-left:20px;margin:0;line-height:1.7">
      ${items.join("")}
    </ul>
  `;
}

function renderAuditLinks(group: PricingChangeNotificationGroup) {
  const items = group.audits.map((audit) => {
    const reAuditUrl = absoluteUrl(
      `/audit?shareId=${encodeURIComponent(audit.shareId)}${audit.auditId ? `&auditId=${encodeURIComponent(audit.auditId)}` : ""}`
    );

    return `<li><a href="${reAuditUrl}" style="color:#0f766e">Re-audit ${escapeHtml(audit.shareId)}</a></li>`;
  });

  return `
    <h2 style="font-size:18px;margin:24px 0 12px">Re-audit links</h2>
    <ul style="padding-left:20px;margin:0;line-height:1.7">
      ${items.join("")}
    </ul>
  `;
}

export function renderPricingChangeNotificationEmail(group: PricingChangeNotificationGroup) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="font-size:24px;margin-bottom:12px">Pricing updates affecting your AI audits</h1>
      <p>We found pricing changes that may affect ${group.audits.length} stored audit${group.audits.length === 1 ? "" : "s"} tied to this email address.</p>
      ${renderChangedPrices(group)}
      ${renderRecommendationChanges(group)}
      ${renderAuditLinks(group)}
      <p style="margin-top:24px">Open a re-audit link to generate an updated recommendation set using the latest pricing data.</p>
    </div>
  `;
}
