import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { leadInputSchema } from "@/lib/validation";
import { getAuditByShareId, saveLead } from "@/services/audit-store";
import { sendAuditEmail } from "@/services/email";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`lead:${getClientIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many email requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = leadInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (parsed.data.website) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    let result = undefined;
    if (parsed.data.shareId) {
      const audit = await getAuditByShareId(parsed.data.shareId);
      result = audit?.result;
    }

    try {
      await saveLead(parsed.data);
    } catch (error) {
      console.error("Failed to persist lead", error);
    }

    await sendAuditEmail(parsed.data, result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to capture lead", error);
    return NextResponse.json({ error: "Unable to send report right now." }, { status: 500 });
  }
}
