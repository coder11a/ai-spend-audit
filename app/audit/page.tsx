import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { AuditForm } from "@/components/audit/audit-form";

export const metadata: Metadata = {
  title: "Run Audit",
  description: "Enter AI tools, plans, spend, and team size to generate your AI Spend Audit."
};

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<{ auditId?: string }>
}) {
  const { auditId } = await searchParams;
  if (auditId) redirect(`/rerun/${auditId}` as Route);

  return (
    <div className="bg-[linear-gradient(180deg,hsl(var(--secondary)/0.45),hsl(var(--background))_360px)]">
      <div className="container py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Free audit</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">Map your AI stack in minutes.</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Add tools, plan tiers, spend, and seats. The engine checks for right-sizing, duplicate coverage, and API
            leakage before generating a shareable report.
          </p>
        </div>
        <AuditForm />
      </div>
    </div>
  );
}
