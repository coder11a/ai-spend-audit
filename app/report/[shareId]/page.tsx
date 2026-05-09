import type { Metadata } from "next";
import Link from "next/link";
import { ResultsDashboard } from "@/components/audit/results-dashboard";
import { Button } from "@/components/ui/button";
import { getPublicReport } from "@/services/audit-store";
import { absoluteUrl, currency } from "@/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const report = await getPublicReport(shareId);

  if (!report) {
    return {
      title: "AI Spend Audit Report",
      description: "A public AI Spend Audit report."
    };
  }

  const title = `${currency(report.monthlySavings)} monthly AI savings found`;
  const description = `AI Spend Audit found ${currency(report.annualSavings)} in estimated annual savings across ${report.toolCount} AI tools.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/report/${shareId}`),
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function PublicReportPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const report = await getPublicReport(shareId);

  if (!report) {
    return (
      <div className="container py-20">
        <div className="rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-semibold">Public report unavailable</h1>
          <p className="mt-2 text-muted-foreground">
            This report could not be found. Public reports require Supabase persistence to be configured.
          </p>
          <Button asChild className="mt-6">
            <Link href="/audit">Run a new audit</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ResultsDashboard result={report} isPublic />;
}
