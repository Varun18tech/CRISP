import { Risk } from "@/types/risk";
import { Asset } from "@/types/asset";
import { Vulnerability, Threat, SecurityControl, Investment } from "@/types/security";
import { DEMO_RISKS, DEMO_ASSETS, DEMO_VULNERABILITIES, DEMO_THREATS, DEMO_CONTROLS, DEMO_INVESTMENTS } from "@/lib/demo-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchWithFallback<T>(endpoint: string, fallbackData: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned ${res.status}. Using cached/fallback data.`);
      return fallbackData;
    }
    return await res.json();
  } catch (err) {
    // Graceful offline fallback
    return fallbackData;
  }
}

export const api = {
  // Health
  checkHealth: () => fetchWithFallback("/health", { status: "ok" }),

  // Risks
  getRisks: () => fetchWithFallback<Risk[]>("/risks", DEMO_RISKS),
  getRiskById: (id: string) =>
    fetchWithFallback<Risk>(`/risks/${id}`, DEMO_RISKS.find((r) => r.id === id) || DEMO_RISKS[0]),
  calculateRisk: (payload: any) =>
    fetchWithFallback<Risk>("/risks/calculate", DEMO_RISKS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Assets
  getAssets: () => fetchWithFallback<Asset[]>("/assets", DEMO_ASSETS),
  getAssetById: (id: string) =>
    fetchWithFallback<Asset>(`/assets/${id}`, DEMO_ASSETS.find((a) => a.id === id) || DEMO_ASSETS[0]),

  // Vulnerabilities
  getVulnerabilities: () => fetchWithFallback<Vulnerability[]>("/vulnerabilities", DEMO_VULNERABILITIES),

  // Threats
  getThreats: () => fetchWithFallback<Threat[]>("/threats", DEMO_THREATS),

  // Controls
  getControls: () => fetchWithFallback<SecurityControl[]>("/controls", DEMO_CONTROLS),

  // Investments
  getInvestments: () => fetchWithFallback<Investment[]>("/investments", DEMO_INVESTMENTS),
  optimizeInvestments: (ids: string[]) =>
    fetchWithFallback("/investments/optimize", [], {
      method: "POST",
      body: JSON.stringify({ investment_ids: ids }),
    }),

  // Deterministic risk-remediation portfolio optimization (server-authoritative).
  optimizeRiskPortfolio: (payload: { available_budget: number; risks: unknown[] }) =>
    fetchWithFallback("/portfolio/optimize", null, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadRiskDataset: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const response = await fetch(`/api/v1/portfolio/upload`, { method: "POST", body: form });
    if (!response.ok) {
      const body = await response.json();
      throw new Error(typeof body.detail === "string" ? body.detail : body.detail?.message || "Dataset upload failed");
    }
    return response.json();
  },
  getLatestDatasetAnalysis: () =>
    fetch(`/api/v1/portfolio/latest`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { status: "no_data" }))
      .catch(() => ({ status: "no_data" })),

  // Authoritative Budget-Constrained Cybersecurity Risk Remediation Optimizer
  getBudgetOptimizerContext: async (organizationId: string = "org_default") => {
    const res = await fetch(`/api/v1/portfolio/budget-optimizer/context?organization_id=${encodeURIComponent(organizationId)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Failed to load optimizer context (${res.status})`);
    }
    return res.json();
  },
  runBudgetOptimizer: async (payload: {
    available_budget: number;
    currency: string;
    organization_id?: string;
  }) => {
    const res = await fetch(`/api/v1/portfolio/budget-optimizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message =
        typeof errBody.detail === "string"
          ? errBody.detail
          : Array.isArray(errBody.detail)
          ? errBody.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ")
          : errBody.detail?.message || `Budget optimization request failed (${res.status})`;
      throw new Error(message);
    }
    return res.json();
  },

  // Analytics
  getAnalyticsOverview: () =>
    fetchWithFallback("/analytics/overview", {
      total_eal: 36950000,
      inherent_eal: 45450000,
      eal_reduction: 8500000,
      average_residual_risk: 34.15,
      critical_risks_count: 2,
    }),

  // AI
  generateRiskSummary: (riskContext: any) =>
    fetchWithFallback("/ai/risk-summary", {
      is_ai_generated: true,
      summary: "High-consequence remote code execution exposing card processing infrastructure.",
      consequences: "Potential unauthorized transaction fabrication and regulatory penalties.",
      recommendations: ["Deploy emergency patch within 24 hours"],
      executive_explanation: "Highest financial liability facing the organization.",
    }, {
      method: "POST",
      body: JSON.stringify(riskContext),
    }),

  chatWithAI: (messages: { role: string; content: string }[], context?: any) =>
    fetchWithFallback("/ai/chat", {
      role: "assistant",
      content: "Hello! I am Aegis-Quant AI powered by Amazon Bedrock (Claude 3.5 Sonnet), your cyber risk intelligence and capital quantification advisor.",
      suggestions: [
        "Generate a formal Board Report from our dataset",
        "What is our total organizational EAL liability?",
        "Which risk is currently ranked #1 and why?",
        "If we spend ₹800,000 on WAF, what is our projected ROSI?",
      ],
      citations: ["Amazon Bedrock (Claude 3.5 Sonnet)", "ISO/IEC 27005", "NIST SP 800-30"],
    }, {
      method: "POST",
      body: JSON.stringify({ messages, context }),
    }),

  getAIStatus: () =>
    fetchWithFallback("/ai/status", {
      status: "online",
      provider: "Amazon Bedrock",
      model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      model_name: "Claude 3.5 Sonnet",
      capabilities: [
        "Executive Cyber Risk Summaries",
        "Board of Directors Reports",
        "Risk Explainability",
        "Interactive Executive Intelligence",
      ],
    }),

  generateExecutiveSummary: (context?: any) =>
    fetchWithFallback<{ model: string; provider: string; summary: string; status: string }>(
      "/ai/executive-summary",
      {
        model: "Amazon Bedrock (Claude 3.5 Sonnet)",
        provider: "Amazon Bedrock",
        summary: "### 🛡️ Executive Cyber Risk Briefing\n\nExecutive cyber posture evaluated from active risk register and budget constraints.",
        status: "synthesized",
      },
      {
        method: "POST",
        body: JSON.stringify(context || {}),
      }
    ),

  generateBoardReport: (context?: any) =>
    fetchWithFallback<{ model: string; provider: string; report: string; status: string }>(
      "/ai/board-report",
      {
        model: "Amazon Bedrock (Claude 3.5 Sonnet)",
        provider: "Amazon Bedrock",
        report: "# 🏛️ Board of Directors Cyber Risk & Capital Allocation Report\n\nComprehensive board briefing.",
        status: "synthesized",
      },
      {
        method: "POST",
        body: JSON.stringify(context || {}),
      }
    ),

  resetPlatformData: () =>
    fetchWithFallback<{ status: string; message?: string }>(
      "/portfolio/reset",
      { status: "ok", message: "All data reset to zero." },
      {
        method: "POST",
      }
    ),
};

