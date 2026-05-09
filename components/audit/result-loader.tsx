"use client";

import { useEffect, useState } from "react";
import { ResultsDashboard } from "@/components/audit/results-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditResult } from "@/types/audit";

export function ResultLoader({ shareId }: { shareId: string }) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = window.sessionStorage.getItem(`audit:${shareId}`);
      if (local) {
        const parsed = JSON.parse(local) as { result: AuditResult };
        if (!cancelled) setResult(parsed.result);
        return;
      }

      const response = await fetch(`/api/audits/${shareId}`);
      if (!response.ok) {
        if (!cancelled) setMissing(true);
        return;
      }
      const payload = (await response.json()) as { result: AuditResult };
      if (!cancelled) setResult(payload.result);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (missing) {
    return (
      <div className="container py-20">
        <div className="rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="mt-2 text-muted-foreground">This audit was not found. In local development, reports persist only with Supabase configured.</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container grid gap-4 py-10">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return <ResultsDashboard result={result} />;
}
