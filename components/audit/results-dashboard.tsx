"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Copy, ExternalLink, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { LeadCapture } from "@/components/audit/lead-capture";
import { SpendCharts } from "@/components/audit/spend-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditResult } from "@/types/audit";
import { absoluteUrl, currency, percent } from "@/utils/format";

function formatUseCase(useCase: AuditResult["primaryUseCase"]) {
  return useCase.replace("-", " ");
}

function hasRawMarkdownSummary(summary: string) {
  return /\*\*|^#{1,6}\s|\n\s*[-*]\s|\bRecommendations:\b/i.test(summary);
}

function getExecutiveSummary(result: AuditResult) {
  const cleanSummary = result.summary.replace(/\*\*/g, "").trim();
  if (cleanSummary && !hasRawMarkdownSummary(result.summary)) return cleanSummary;

  const topRecommendation = result.recommendations.find((item) => item.savings > 0);
  if (!topRecommendation) {
    return `Your AI stack is already lean for a ${result.teamSize}-person ${formatUseCase(
      result.primaryUseCase
    )} team. Keep reviewing seats monthly and add budget alerts before usage accelerates.`;
  }

  return `A ${result.teamSize}-person ${formatUseCase(result.primaryUseCase)} team can likely reduce AI spend from ${currency(
    result.currentMonthlySpend
  )} to ${currency(result.optimizedMonthlySpend)} per month. Start with ${topRecommendation.toolName}: ${topRecommendation.recommendedAction.toLowerCase()}.`;
}

export function ResultsDashboard({ result, isPublic = false }: { result: AuditResult; isPublic?: boolean }) {
  const shareUrl = absoluteUrl(`/report/${result.shareId}`);
  const highSavings = result.monthlySavings > 500;
  const executiveSummary = getExecutiveSummary(result);

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share URL copied");
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <Badge variant={highSavings ? "warning" : "secondary"}>{highSavings ? "High savings opportunity" : "Lean stack check"}</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">AI spend audit results</h1>
        <p className="mt-3 max-w-none text-lg leading-8 text-muted-foreground">{executiveSummary}</p>
        <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border bg-card px-3 py-1">Team size: {result.teamSize}</span>
            <span className="rounded-full border bg-card px-3 py-1 capitalize">Use case: {formatUseCase(result.primaryUseCase)}</span>
            <span className="rounded-full border bg-card px-3 py-1">Current spend: {currency(result.currentMonthlySpend)}/mo</span>
          </div>
          <div className="flex shrink-0 gap-2 md:justify-end">
            <Button type="button" variant="outline" onClick={copyShareUrl}>
              <Copy className="h-4 w-4" /> Copy URL
            </Button>
            {!isPublic && (
              <Button asChild>
                <Link href={`/report/${result.shareId}`}>
                  Public report <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Monthly savings", currency(result.monthlySavings), TrendingDown],
          ["Annual savings", currency(result.annualSavings), CalendarDays],
          ["Savings rate", percent(result.savingsPercentage), CheckCircle2],
          ["Optimized spend", currency(result.optimizedMonthlySpend), TrendingDown]
        ].map(([label, value, Icon]) => (
          <motion.div key={label as string} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{label as string}</p>
                <p className="mt-1 text-3xl font-semibold">{value as string}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6">
        <SpendCharts result={result} />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recommendations.map((item) => (
              <div key={item.toolId} className="rounded-xl border bg-secondary/20 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.toolName}</h3>
                      <Badge variant={item.severity === "high" ? "warning" : "secondary"}>{item.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{item.recommendedAction}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.reasoning}</p>
                    {item.alternative && (
                      <p className="mt-2 text-sm text-muted-foreground">Alternative to evaluate: {item.alternative}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-card px-4 py-3 text-right">
                    <p className="text-xs text-muted-foreground">Monthly savings</p>
                    <p className="text-2xl font-semibold text-primary">{currency(item.savings)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-xl border bg-card p-5">
          <div>
            <h3 className="font-semibold">{highSavings ? "Book Credex Consultation" : "Keep governance light"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {highSavings
                ? "Your savings are large enough to justify vendor cleanup, usage caps, and a 30-day implementation sprint."
                : "Your stack is not wildly inefficient. Review seats monthly and set budget alerts before usage accelerates."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Review", "Monthly seat audit"],
                ["Alert", "Budget threshold"],
                ["Own", "Tool owner assigned"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-secondary/20 p-3">
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <Button asChild className="mt-5 w-full" variant={highSavings ? "default" : "outline"}>
            <a href="mailto:hello@credex.example?subject=AI%20Spend%20Audit%20Consultation">
              {highSavings ? "Book Credex Consultation" : "Ask Credex a question"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <div className="mt-5 rounded-lg border bg-secondary/20 p-4">
            <p className="text-sm font-semibold">Suggested next steps</p>
            <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                ["Week 1", "Confirm active users"],
                ["Week 2", "Set spend alerts"],
                ["Week 3", "Review plan changes"]
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="mt-1 leading-5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {!isPublic && <LeadCapture result={result} />}
      </div>
    </div>
  );
}
