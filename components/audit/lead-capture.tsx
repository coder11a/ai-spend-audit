"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadInputSchema, type LeadInputValues } from "@/lib/validation";
import type { AuditResult } from "@/types/audit";

export function LeadCapture({ result }: { result: AuditResult }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LeadInputValues>({
    resolver: zodResolver(leadInputSchema),
    defaultValues: {
      email: "",
      companyName: "",
      role: "",
      teamSize: result.teamSize,
      shareId: result.shareId,
      website: ""
    }
  });

  async function onSubmit(values: LeadInputValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save lead");
      toast.success("Report sent", { description: "Check your inbox for the audit summary." });
      form.reset({ ...values, email: "" });
    } catch (error) {
      toast.error("Could not send email", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="h-full rounded-xl border bg-card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Email this report</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Send a confirmation and report link to your inbox.</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input className="h-12 text-base" type="email" placeholder="you@company.com" {...form.register("email")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <Label>Company</Label>
            <Input placeholder="Acme AI" {...form.register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input placeholder="CTO" {...form.register("role")} />
          </div>
        </div>
        <input tabIndex={-1} autoComplete="off" className="hidden" {...form.register("website")} />
        <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
