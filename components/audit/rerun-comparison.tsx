"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronsUpDown, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AuditRerunComparison, AuditRerunComparisonRow, RecommendationSeverity } from "@/types/audit";
import { currency, percent } from "@/utils/format";

function formatUseCase(useCase: AuditRerunComparison["input"]["primaryUseCase"]) {
  return useCase.replace("-", " ");
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function formatDelta(value: number, invert = false) {
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;

  return {
    label: `${value > 0 ? "+" : value < 0 ? "-" : ""}${currency(Math.abs(value))}`,
    positive,
    neutral
  };
}

function severityVariant(severity?: RecommendationSeverity) {
  if (severity === "high") return "warning";
  return "secondary";
}

function ResultColumn({
  title,
  description,
  row,
  tone
}: {
  title: string;
  description: string;
  row: AuditRerunComparisonRow;
  tone: "previous" | "current";
}) {
  const recommendation = tone === "previous" ? row.previousRecommendation : row.currentRecommendation;
  const planLabel = tone === "previous" ? row.previousPlanLabel : row.currentPlanLabel;
  const planPrice = tone === "previous" ? row.previousPlanPrice : row.currentPlanPrice;
  const highlightClass =
    row.changed && tone === "current"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : row.changed && tone === "previous"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border bg-secondary/20";

  return (
    <div className={cn("rounded-xl border p-4", highlightClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {recommendation && <Badge variant={severityVariant(recommendation.severity)}>{recommendation.severity}</Badge>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan price</p>
          <p className="mt-1 text-lg font-semibold">{currency(planPrice)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{planLabel}</p>
        </div>
        <div className="rounded-lg bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Optimized spend</p>
          <p className="mt-1 text-lg font-semibold">{currency(recommendation?.optimizedSpend ?? 0)}</p>
        </div>
        <div className="rounded-lg bg-background/80 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly savings</p>
          <p className="mt-1 text-lg font-semibold">{currency(recommendation?.savings ?? 0)}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium">{recommendation?.recommendedAction ?? "No recommendation available"}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {recommendation?.reasoning ?? "This tool did not produce a recommendation in this audit."}
        </p>
        {recommendation?.alternative && (
          <p className="mt-3 text-sm text-muted-foreground">Alternative to evaluate: {recommendation.alternative}</p>
        )}
      </div>
    </div>
  );
}

function ToolComparisonRow({ row }: { row: AuditRerunComparisonRow }) {
  const savingsDelta = formatDelta(row.savingsDelta);
  const priceDelta = formatDelta(row.currentPlanPrice - row.previousPlanPrice);

  return (
    <Card className={cn(row.changed && "border-primary/30 shadow-glow")}>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{row.toolName}</CardTitle>
            <CardDescription className="mt-2">
              Selected plan: {row.previousPlanLabel}
              {row.currentPlanLabel !== row.previousPlanLabel ? ` -> ${row.currentPlanLabel}` : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={row.priceChanged ? "warning" : "secondary"}>
              {row.priceChanged ? "Price changed" : "Price unchanged"}
            </Badge>
            <Badge variant={row.recommendationChanged ? "warning" : "secondary"}>
              {row.recommendationChanged ? "Recommendation changed" : "Recommendation unchanged"}
            </Badge>
            <Badge variant={savingsDelta.positive ? "default" : "secondary"}>Savings delta {savingsDelta.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 xl:grid-cols-2">
          <ResultColumn
            title="Stored audit"
            description="Original recommendation and pricing snapshot"
            row={row}
            tone="previous"
          />
          <ResultColumn
            title="Newly generated audit"
            description="Recalculated recommendation using current pricing"
            row={row}
            tone="current"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">List price delta</p>
            <p className="mt-1 text-xl font-semibold">{priceDelta.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currency(row.previousPlanPrice)} {"->"} {currency(row.currentPlanPrice)}
            </p>
          </div>
          <div className="rounded-xl border bg-secondary/20 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation savings delta</p>
            <p className="mt-1 text-xl font-semibold">{savingsDelta.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currency(row.previousRecommendation?.savings ?? 0)} {"->"} {currency(row.currentRecommendation?.savings ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditSnapshot({
  title,
  description,
  monthlySavings,
  optimizedSpend,
  annualSavings,
  savingsRate
}: {
  title: string;
  description: string;
  monthlySavings: number;
  optimizedSpend: number;
  annualSavings: number;
  savingsRate: number;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">Monthly savings</p>
          <p className="mt-1 text-2xl font-semibold">{currency(monthlySavings)}</p>
        </div>
        <div className="rounded-xl border bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">Optimized spend</p>
          <p className="mt-1 text-2xl font-semibold">{currency(optimizedSpend)}</p>
        </div>
        <div className="rounded-xl border bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">Annual savings</p>
          <p className="mt-1 text-2xl font-semibold">{currency(annualSavings)}</p>
        </div>
        <div className="rounded-xl border bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">Savings rate</p>
          <p className="mt-1 text-2xl font-semibold">{percent(savingsRate)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RerunComparison({ comparison }: { comparison: AuditRerunComparison }) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const showChangedOnlyByDefault = comparison.summary.changedRows > 0;
  const visibleRows = useMemo(() => {
    if (!showChangedOnlyByDefault || showUnchanged) return comparison.rows;
    return comparison.rows.filter((row) => row.changed);
  }, [comparison.rows, showChangedOnlyByDefault, showUnchanged]);

  const monthlySavingsDelta = formatDelta(comparison.summary.monthlySavingsDelta);
  const optimizedSpendDelta = formatDelta(comparison.summary.optimizedSpendDelta, true);
  const annualSavingsDelta = formatDelta(comparison.summary.annualSavingsDelta);

  return (
    <div className="bg-[linear-gradient(180deg,hsl(var(--secondary)/0.35),hsl(var(--background))_320px)]">
      <div className="container py-10">
        <div className="mb-8">
          <Badge variant={comparison.summary.changedRows > 0 ? "warning" : "secondary"}>
            {comparison.summary.changedRows > 0 ? "Changes detected" : "No material changes"}
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">Old audit vs re-run audit</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
            Compare the stored result for this audit with a fresh run using current pricing and recommendation logic.
          </p>
          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="rounded-full border bg-card px-3 py-1">Created: {formatDate(comparison.createdAt)}</span>
              <span className="rounded-full border bg-card px-3 py-1">Team size: {comparison.input.teamSize}</span>
              <span className="rounded-full border bg-card px-3 py-1 capitalize">
                Use case: {formatUseCase(comparison.input.primaryUseCase)}
              </span>
              <span className="rounded-full border bg-card px-3 py-1">Tools: {comparison.rows.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/report/${comparison.shareId}`}>Open public report</Link>
              </Button>
              <Button asChild>
                <Link href="/audit">
                  Run new audit <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <TrendingDown className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Monthly savings delta</p>
              <p className="mt-1 text-3xl font-semibold">{monthlySavingsDelta.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {currency(comparison.summary.previousMonthlySavings)} {"->"} {currency(comparison.summary.currentMonthlySavings)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Optimized spend delta</p>
              <p className="mt-1 text-3xl font-semibold">{optimizedSpendDelta.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {currency(comparison.summary.previousOptimizedSpend)} {"->"} {currency(comparison.summary.currentOptimizedSpend)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <RotateCcw className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Changed tools</p>
              <p className="mt-1 text-3xl font-semibold">{comparison.summary.changedRows}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {comparison.summary.changedPrices} price changes, {comparison.summary.changedRecommendations} recommendation changes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <TrendingDown className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Annual savings delta</p>
              <p className="mt-1 text-3xl font-semibold">{annualSavingsDelta.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {currency(comparison.summary.previousAnnualSavings)} {"->"} {currency(comparison.summary.currentAnnualSavings)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <AuditSnapshot
            title="Stored audit"
            description="The original recommendation payload saved with this audit."
            monthlySavings={comparison.previousResult.monthlySavings}
            optimizedSpend={comparison.previousResult.optimizedMonthlySpend}
            annualSavings={comparison.previousResult.annualSavings}
            savingsRate={comparison.previousResult.savingsPercentage}
          />
          <AuditSnapshot
            title="Newly generated audit"
            description="A fresh calculation using the same input and current pricing."
            monthlySavings={comparison.currentResult.monthlySavings}
            optimizedSpend={comparison.currentResult.optimizedMonthlySpend}
            annualSavings={comparison.currentResult.annualSavings}
            savingsRate={comparison.currentResult.savingsPercentage}
          />
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Tool-by-tool diff</CardTitle>
                <CardDescription>
                  Side-by-side pricing and recommendation changes for each tool in the original audit.
                </CardDescription>
              </div>
              {comparison.summary.unchangedRows > 0 && (
                <Button type="button" variant="outline" onClick={() => setShowUnchanged((value) => !value)}>
                  <ChevronsUpDown className="h-4 w-4" />
                  {showUnchanged ? "Hide unchanged tools" : `Show ${comparison.summary.unchangedRows} unchanged tools`}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleRows.map((row) => (
                <ToolComparisonRow key={`${row.toolId}-${row.selectedPlan}`} row={row} />
              ))}
              {visibleRows.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  All tools are currently stable. Toggle unchanged tools to inspect the full side-by-side comparison.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
