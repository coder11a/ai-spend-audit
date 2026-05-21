"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PRICING } from "@/lib/pricing";
import { auditInputSchema, type AuditInputValues } from "@/lib/validation";
import type { CreateAuditResponse, ToolId } from "@/types/audit";
import { currency } from "@/utils/format";

const defaultValues: Record<string, unknown> = {
  teamSize: "",
  primaryUseCase: "",
  tools: [],
  email: "",
  companyName: "",
  role: "",
  website: ""
};

const useCases = [
  ["coding", "Coding"],
  ["writing", "Writing"],
  ["research", "Research"],
  ["data-analysis", "Data analysis"],
  ["mixed", "Mixed"]
] as const;

export function AuditForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AuditInputValues>({
    resolver: zodResolver(auditInputSchema),
    defaultValues,
    mode: "onBlur"
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tools"
  });

  const watchedTools = useWatch({ control: form.control, name: "tools" });
  const currentSpend = useMemo(() => {
    return watchedTools.reduce((sum, tool) => sum + Number(tool.monthlySpend || 0), 0);
  }, [watchedTools]);

  async function onSubmit(values: AuditInputValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      const payload = (await response.json()) as CreateAuditResponse;
      if (!response.ok || !payload.result) throw new Error(payload.error || "Unable to create audit");

      window.sessionStorage.setItem(
        `audit:${payload.result.shareId}`,
        JSON.stringify({ auditId: payload.auditId ?? null, input: values, result: payload.result })
      );
      toast.success("Audit complete", { description: "Your savings report is ready." });
      router.push(`/audit/${payload.result.shareId}`);
    } catch (error) {
      toast.error("Audit failed", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team profile</CardTitle>
            <CardDescription>Used to size recommendations and separate real usage from plan waste.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team size</Label>
              <Input id="teamSize" type="number" min={1} {...form.register("teamSize", { valueAsNumber: true })} />
              {form.formState.errors.teamSize && (
                <p className="text-sm text-destructive">{form.formState.errors.teamSize.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryUseCase">Primary use case</Label>
              <Select id="primaryUseCase" {...form.register("primaryUseCase")}>
                <option value="" disabled>
                  Select use case
                </option>
                {useCases.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>AI tools</CardTitle>
              <CardDescription>Add each paid tool, plan, monthly spend, and seats.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ toolId: "" as unknown as ToolId, plan: "" as unknown as "free", monthlySpend: "" as unknown as number, seats: "" as unknown as number })}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence initial={false}>
              {fields.map((field, index) => {
                const toolId = form.watch(`tools.${index}.toolId`) as ToolId | "";
                const pricing = toolId ? PRICING[toolId as ToolId] : null;
                const currentPlan = form.watch(`tools.${index}.plan`);
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="rounded-xl border bg-secondary/20 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
                      <div className="space-y-2">
                        <Label>Tool</Label>
                        <Select {...form.register(`tools.${index}.toolId`)}>
                          <option value="" disabled>Select tool</option>
                          {Object.entries(PRICING).map(([id, tool]) => (
                            <option key={id} value={id}>
                              {tool.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Plan</Label>
                        <Select {...form.register(`tools.${index}.plan`)} disabled={!pricing}>
                          <option value="" disabled>Select plan</option>
                          {pricing && Object.entries(pricing.plans).map(([id, plan]) => (
                            <option key={id} value={id} disabled={plan.label === "Not offered"}>
                              {plan.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Monthly spend</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          {...form.register(`tools.${index}.monthlySpend`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Seats</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          {...form.register(`tools.${index}.seats`, { valueAsNumber: true })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={pricing ? `Remove ${pricing.name}` : "Remove tool"}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {pricing && currentPlan && pricing.plans[currentPlan as keyof typeof pricing.plans] && (
                      <p className="mt-3 text-xs text-muted-foreground">{pricing.plans[currentPlan as keyof typeof pricing.plans].notes}</p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {form.formState.errors.tools && <p className="text-sm text-destructive">Add at least one valid tool.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capture report</CardTitle>
            <CardDescription>Email is optional before the audit. You can also send it after seeing results.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Email</Label>
              <Input type="email" placeholder="you@company.com" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Acme AI" {...form.register("companyName")} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input placeholder="Founder, CTO, Finance" {...form.register("role")} />
            </div>
            <input tabIndex={-1} autoComplete="off" className="hidden" {...form.register("website")} />
          </CardContent>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>Audit preview</CardTitle>
            <CardDescription>Your report is generated instantly after validation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Reported monthly AI spend</p>
              <p className="mt-1 text-4xl font-semibold">{currency(currentSpend)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-muted-foreground">Tools</p>
                <p className="text-xl font-semibold">{fields.length}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-muted-foreground">Team</p>
                <p className="text-xl font-semibold">{form.watch("teamSize") || 0}</p>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Running audit..." : "Generate audit"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Protected with a honeypot field and per-IP rate limiting. Public reports exclude email, company, and role.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
