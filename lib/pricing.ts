import type { PlanTier, ToolId, UseCase } from "@/types/audit";

export type PlanRule = {
  label: string;
  monthlyPrice: number;
  seatBased: boolean;
  minTeamSize?: number;
  notes: string;
};

export type ToolPricing = {
  name: string;
  category: "assistant" | "coding" | "api" | "research";
  plans: Record<PlanTier, PlanRule>;
  alternatives: Partial<Record<UseCase, string>>;
};

const unavailable = {
  label: "Not offered",
  monthlyPrice: 0,
  seatBased: false,
  notes: "This plan is not a standard fit for this product."
} satisfies PlanRule;

export const PRICING: Record<ToolId, ToolPricing> = {
  cursor: {
    name: "Cursor",
    category: "coding",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Best for trials and occasional use." },
      pro: { label: "Pro", monthlyPrice: 20, seatBased: true, notes: "Strong default for individual engineers." },
      team: { label: "Business", monthlyPrice: 40, seatBased: true, minTeamSize: 2, notes: "Adds admin and team features." },
      enterprise: { label: "Enterprise", monthlyPrice: 80, seatBased: true, minTeamSize: 25, notes: "Best for larger regulated teams." },
      payg: unavailable
    },
    alternatives: {
      coding: "GitHub Copilot Business",
      mixed: "Windsurf Teams"
    }
  },
  "github-copilot": {
    name: "GitHub Copilot",
    category: "coding",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Limited individual usage." },
      pro: { label: "Pro", monthlyPrice: 10, seatBased: true, notes: "Individual coding assistant." },
      team: { label: "Business", monthlyPrice: 19, seatBased: true, minTeamSize: 2, notes: "Team management and policy controls." },
      enterprise: { label: "Enterprise", monthlyPrice: 39, seatBased: true, minTeamSize: 25, notes: "Enterprise controls and deeper GitHub context." },
      payg: unavailable
    },
    alternatives: {
      coding: "Cursor Pro for power users",
      mixed: "ChatGPT Team for non-code seats"
    }
  },
  claude: {
    name: "Claude",
    category: "assistant",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Good for light usage." },
      pro: { label: "Pro", monthlyPrice: 20, seatBased: true, notes: "Individual assistant plan." },
      team: { label: "Team", monthlyPrice: 30, seatBased: true, minTeamSize: 2, notes: "Collaboration and higher usage limits." },
      enterprise: { label: "Enterprise", monthlyPrice: 60, seatBased: true, minTeamSize: 50, notes: "Governance and support for larger orgs." },
      payg: unavailable
    },
    alternatives: {
      writing: "ChatGPT Team",
      research: "Gemini Advanced",
      mixed: "ChatGPT Team"
    }
  },
  chatgpt: {
    name: "ChatGPT",
    category: "assistant",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Good for occasional usage." },
      pro: { label: "Plus", monthlyPrice: 20, seatBased: true, notes: "Individual assistant plan." },
      team: { label: "Team", monthlyPrice: 30, seatBased: true, minTeamSize: 2, notes: "Workspace features and admin controls." },
      enterprise: { label: "Enterprise", monthlyPrice: 60, seatBased: true, minTeamSize: 50, notes: "Enterprise controls and account support." },
      payg: unavailable
    },
    alternatives: {
      coding: "Cursor Pro for engineering-only seats",
      writing: "Claude Team",
      research: "Gemini Advanced"
    }
  },
  "anthropic-api": {
    name: "Anthropic API",
    category: "api",
    plans: {
      free: unavailable,
      pro: unavailable,
      team: unavailable,
      enterprise: { label: "Committed Use", monthlyPrice: 500, seatBased: false, minTeamSize: 25, notes: "Commit only when traffic is predictable." },
      payg: { label: "Pay as you go", monthlyPrice: 0, seatBased: false, notes: "Variable usage billed by tokens." }
    },
    alternatives: {
      coding: "OpenAI API with strict usage caps",
      writing: "OpenAI API batch workflows",
      mixed: "Model routing between OpenAI and Anthropic"
    }
  },
  "openai-api": {
    name: "OpenAI API",
    category: "api",
    plans: {
      free: unavailable,
      pro: unavailable,
      team: unavailable,
      enterprise: { label: "Committed Use", monthlyPrice: 500, seatBased: false, minTeamSize: 25, notes: "Commit after usage stabilizes." },
      payg: { label: "Pay as you go", monthlyPrice: 0, seatBased: false, notes: "Variable usage billed by tokens." }
    },
    alternatives: {
      coding: "GitHub Copilot for IDE autocomplete",
      "data-analysis": "Cached batch jobs with spend alerts",
      mixed: "Model routing with budget caps"
    }
  },
  gemini: {
    name: "Gemini",
    category: "research",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Good for trials." },
      pro: { label: "Advanced", monthlyPrice: 20, seatBased: true, notes: "Individual productivity plan." },
      team: { label: "Workspace AI", monthlyPrice: 30, seatBased: true, minTeamSize: 2, notes: "Best when Workspace is already core." },
      enterprise: { label: "Enterprise", monthlyPrice: 55, seatBased: true, minTeamSize: 50, notes: "Larger governance needs." },
      payg: { label: "API pay as you go", monthlyPrice: 0, seatBased: false, notes: "API usage only." }
    },
    alternatives: {
      writing: "ChatGPT Team",
      research: "Claude Pro for long context review"
    }
  },
  windsurf: {
    name: "Windsurf",
    category: "coding",
    plans: {
      free: { label: "Free", monthlyPrice: 0, seatBased: true, notes: "Trial and light editing." },
      pro: { label: "Pro", monthlyPrice: 15, seatBased: true, notes: "Individual coding workflow." },
      team: { label: "Teams", monthlyPrice: 30, seatBased: true, minTeamSize: 2, notes: "Shared policy and usage controls." },
      enterprise: { label: "Enterprise", monthlyPrice: 60, seatBased: true, minTeamSize: 25, notes: "Large team administration." },
      payg: unavailable
    },
    alternatives: {
      coding: "Cursor Pro",
      mixed: "GitHub Copilot Business"
    }
  }
};

export const PLAN_ORDER: PlanTier[] = ["free", "pro", "team", "enterprise", "payg"];
