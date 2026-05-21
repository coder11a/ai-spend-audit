import type { Metadata } from "next";
import Link from "next/link";
import { RerunComparison } from "@/components/audit/rerun-comparison";
import { Button } from "@/components/ui/button";
import { buildAuditRerunComparison } from "@/lib/rerun-comparison";
import { getStoredAuditById } from "@/services/audit-store";

export const metadata: Metadata = {
  title: "Re-run Audit Comparison",
  description: "Compare a stored AI spend audit against a newly generated version using current pricing."
};

export default async function RerunAuditPage({ params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params;
  const audit = await getStoredAuditById(auditId);

  if (!audit) {
    return (
      <div className="container py-20">
        <div className="rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-semibold">Audit comparison unavailable</h1>
          <p className="mt-2 text-muted-foreground">
            This stored audit could not be found. Re-run comparisons require a persisted audit record with pricing history.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/audit">Run a new audit</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <RerunComparison comparison={buildAuditRerunComparison(audit)} />;
}
