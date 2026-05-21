import { NextResponse } from "next/server";
import { detectPricingChangesForAudits } from "@/lib/pricing-change-detection";
import { getStoredAudits } from "@/services/audit-store";
import { sendPricingChangeNotificationEmails } from "@/services/email";

export async function GET() {
  try {
    const audits = await getStoredAudits();
    const affectedAudits = detectPricingChangesForAudits(audits);

    return NextResponse.json({
      audits: affectedAudits,
      totalAudits: audits.length,
      affectedCount: affectedAudits.length
    });
  } catch (error) {
    console.error("Failed to detect pricing changes", error);
    return NextResponse.json({ error: "Unable to detect pricing changes right now." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const audits = await getStoredAudits();
    const affectedAudits = detectPricingChangesForAudits(audits);
    const notificationResults = await sendPricingChangeNotificationEmails(affectedAudits);

    return NextResponse.json({
      audits: affectedAudits,
      totalAudits: audits.length,
      affectedCount: affectedAudits.length,
      groupedUsers: notificationResults.groupedNotifications.length,
      skippedWithoutEmail: notificationResults.skippedWithoutEmail,
      sentNotifications: notificationResults.sentNotifications
    });
  } catch (error) {
    console.error("Failed to send pricing change notifications", error);
    return NextResponse.json({ error: "Unable to send pricing change notifications right now." }, { status: 500 });
  }
}
