import { describe, it, expect } from "vitest";
import { calculateAudit } from "./audit-engine";
import { AuditInput } from "@/types/audit";

describe("Audit Engine Tests", () => {
  it("calculates zero savings if no tools are provided", () => {
    const input: AuditInput = {
      companyName: "Test Co",
      role: "CTO",
      teamSize: 10,
      primaryUseCase: "coding",
      tools: []
    };
    const result = calculateAudit(input);
    expect(result.monthlySavings).toBe(0);
    expect(result.annualSavings).toBe(0);
  });

  it("recommends downgrading when team size is small but enterprise plan is used", () => {
    const input: AuditInput = {
      companyName: "Test Co",
      role: "CTO",
      teamSize: 10,
      primaryUseCase: "coding",
      tools: [
        { toolId: "cursor", plan: "enterprise", seats: 5, monthlySpend: 400 }
      ]
    };
    const result = calculateAudit(input);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toContain("Move from Enterprise to");
    expect(rec.severity).toBe("high");
  });

  it("calculates correct savings when over-seated", () => {
    const input: AuditInput = {
      companyName: "Test Co",
      role: "CTO",
      teamSize: 5,
      primaryUseCase: "coding",
      tools: [
        { toolId: "cursor", plan: "pro", seats: 10, monthlySpend: 300 }
      ]
    };
    const result = calculateAudit(input);
    const cursorRec = result.recommendations.find(r => r.toolId === "cursor");
    expect(cursorRec?.recommendedAction).toContain("Audit unused paid seats");
    expect(cursorRec?.optimizedSpend).toBe(200); // 10 * 20
  });

  it("recommends adding model routing when API spend is high for a small team", () => {
    const input: AuditInput = {
      companyName: "Test Co",
      role: "CTO",
      teamSize: 5,
      primaryUseCase: "coding",
      tools: [
        { toolId: "anthropic-api", plan: "payg", seats: 0, monthlySpend: 2000 }
      ]
    };
    const result = calculateAudit(input);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toBe("Add model routing, caching, and hard monthly caps");
    expect(rec.optimizedSpend).toBe(1440); // 2000 * 0.72
  });

  it("keeps the current plan if it is the best fit", () => {
    const input: AuditInput = {
      companyName: "Test Co",
      role: "CTO",
      teamSize: 5,
      primaryUseCase: "mixed",
      tools: [
        { toolId: "chatgpt", plan: "team", seats: 5, monthlySpend: 150 }
      ]
    };
    const result = calculateAudit(input);
    const rec = result.recommendations[0];
    expect(rec.recommendedAction).toContain("Keep Team");
    expect(rec.optimizedSpend).toBe(150);
  });
});
