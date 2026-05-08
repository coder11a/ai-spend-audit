import type { Metadata } from "next";
import { ResultLoader } from "@/components/audit/result-loader";

export const metadata: Metadata = {
  title: "Audit Results",
  description: "Your AI Spend Audit savings dashboard."
};

export default async function AuditResultPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <ResultLoader shareId={shareId} />;
}
