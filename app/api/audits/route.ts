import { NextRequest, NextResponse } from "next/server";
import { calculateAudit, fallbackSummary, toPublicReport } from "@/lib/audit-engine";
import { rateLimit } from "@/lib/rate-limit";
import { auditInputSchema } from "@/lib/validation";
import { saveAudit } from "@/services/audit-store";
import { generatePersonalizedSummary } from "@/services/ai-summary";
import { sendAuditEmail } from "@/services/email";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`audit:${getClientIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many audit requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = auditInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the audit inputs and try again." }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const initial = calculateAudit(parsed.data);
    const summary = await generatePersonalizedSummary(parsed.data, initial);
    const result = { ...initial, summary: summary || fallbackSummary(parsed.data, initial) };
    const publicReport = toPublicReport(parsed.data, result);

    let persisted = false;
    let auditId: string | null = null;
    try {
      const saved = await saveAudit(parsed.data, result, publicReport);
      persisted = saved.persisted;
      auditId = saved.auditId;
    } catch (error) {
      console.error("Failed to persist audit", error);
    }

    if (parsed.data.email) {
      sendAuditEmail(
        {
          email: parsed.data.email,
          companyName: parsed.data.companyName,
          role: parsed.data.role,
          teamSize: parsed.data.teamSize,
          shareId: result.shareId
        },
        result
      ).catch((error) => console.error("Failed to send audit email", error));
    }

    return NextResponse.json({ result, persisted, auditId });
  } catch (error) {
    console.error("Failed to create audit", error);
    return NextResponse.json({ error: "Unable to create audit right now." }, { status: 500 });
  }
}
