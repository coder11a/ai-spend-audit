"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AuditResult } from "@/types/audit";
import { currency } from "@/utils/format";

export function SpendCharts({ result }: { result: AuditResult }) {
  const spendData = [
    { name: "Current", value: result.currentMonthlySpend },
    { name: "Optimized", value: result.optimizedMonthlySpend }
  ];
  const savingsData = result.recommendations
    .filter((item) => item.savings > 0)
    .map((item) => ({ name: item.toolName, value: item.savings }));
  const projectionData = [
    { name: "3 mo", current: result.currentMonthlySpend * 3, optimized: result.optimizedMonthlySpend * 3 },
    { name: "6 mo", current: result.currentMonthlySpend * 6, optimized: result.optimizedMonthlySpend * 6 },
    { name: "12 mo", current: result.currentMonthlySpend * 12, optimized: result.optimizedMonthlySpend * 12 }
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Current vs optimized</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                <Cell fill="hsl(var(--accent))" />
                <Cell fill="hsl(var(--primary))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Savings breakdown</h3>
        <div className="mt-4 h-64">
          {savingsData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={savingsData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={3}>
                  {savingsData.map((entry, index) => (
                    <Cell key={entry.name} fill={index % 2 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => currency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              No material savings found.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Yearly projection</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => currency(Number(value))} />
              <Bar dataKey="current" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="optimized" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
