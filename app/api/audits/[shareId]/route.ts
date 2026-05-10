import { NextResponse } from "next/server";
import { getAuditByShareId } from "@/services/audit-store";

export async function GET(_: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const audit = await getAuditByShareId(shareId);
  if (!audit) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json({ result: audit.result });
}
