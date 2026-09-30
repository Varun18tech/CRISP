"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  Eye,
  FileWarning,
  Info,
  Layers,
  Lock,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn, getRiskLevelColor } from "@/lib/utils";

interface CurrencyOption {
  code: string;
  rate_to_inr: number;
  symbol: string;
  name: string;
}

interface OptimizerContext {
  status: "ready" | "awaiting_upload" | "no_data";
  has_uploaded_dataset?: boolean;
  dataset_source: string;
  dataset_budget?: number | null;
  dataset_currency?: string;
  company_name?: string | null;
  total_risks_available: number;
  eligible_risks_count: number;
  data_insufficient_count: number;
  already_remediated_count: number;
  supported_currencies: CurrencyOption[];
}

interface TraceabilityMap {
  cvss_source: string;
  current_risk_source: string;
  remediation_cost_source: string;
  business_criticality_source: string;
  threat_source: string;
  exposure_source: string;
}

interface ProfiledRiskAllocation {
  risk_id: string;
  risk_name: string;
  asset_name: string;
  vulnerability_name: string | null;
  cve_id: string | null;
  remediation_name: string | null;
  remediation_category: string;
  cvss_score: number | null;
  severity: "Critical" | "High" | "Medium" | "Low";
  business_importance: string;
  business_criticality_score: number | null;
  exposure_classification: string;
  threat_classification: string;
  remediation_state: string;
  eligibility_status: string;
  ineligibility_reason: string | null;
  optimization_state:
    | "Selected for Remediation"
    | "Deferred"
    | "Data Insufficient"
    | "Already Remediated";
  decision_reason: string;
  current_risk: number | null;
  expected_residual_risk: number | null;
  post_optimization_risk: number | null;
  risk_reduction: number | null;
  expected_risk_reduction_percent: number | null;
  remediation_cost_inr: number | null;
  remediation_cost: number | null;
  allocated_budget_inr: number;
  allocated_budget: number;
  allocation_share_percent: number;
  display_currency: string;
  eal_inr: number | null;
  eal: number | null;
  expected_eal_reduction_inr: number | null;
  expected_eal_reduction: number | null;
  budget_efficiency_per_lakh_inr: number | null;
  composite_priority_score: number | null;
  traceability: TraceabilityMap;
}

interface CategoryBreakdownItem {
  category: string;
  allocated: number;
  allocated_inr: number;
  risk_count: number;
  risk_reduction: number;
  share_of_allocated_percent: number;
  share_of_total_budget_percent: number;
}

interface BudgetOptimizationResponse {
  status: "ok" | "no_data";
  dataset_source: string;
  budget: {
    entered_amount: number;
    entered_currency: string;
    currency_symbol: string;
    currency_name: string;
    normalized_amount_inr: number;
    conversion_rate_to_inr: number;
    conversion_source: string;
  };
  recommended_investment: number;
  recommended_investment_inr: number;
  remaining_budget: number;
  remaining_budget_inr: number;
  total_eligible_remediation_cost: number;
  total_eligible_remediation_cost_inr: number;
  budget_constraint_active: boolean;
  selected_count: number;
  deferred_count: number;
  data_insufficient_count: number;
  already_remediated_count: number;
  total_current_risk: number;
  total_post_remediation_risk: number;
  total_risk_reduction: number;
  overall_risk_reduction_percent: number;
  total_current_eal: number;
  total_eal_reduction: number;
  selected_risks: ProfiledRiskAllocation[];
  deferred_risks: ProfiledRiskAllocation[];
  data_insufficient_risks: ProfiledRiskAllocation[];
  already_remediated_risks: ProfiledRiskAllocation[];
  all_risk_allocations: ProfiledRiskAllocation[];
  category_breakdown: CategoryBreakdownItem[];
  classification_summary: {
    by_severity: Record<string, number>;
    by_state: Record<string, number>;
    by_exposure: Record<string, number>;
    by_business_importance: Record<string, number>;
  };
  explanation: {
    headline: string;
    summary: string;
    details: string[];
    unused_budget_reason: string | null;
  };
  warnings: string[];
}

const DEFAULT_CURRENCIES: CurrencyOption[] = [
  { code: "INR", rate_to_inr: 1.0, symbol: "₹", name: "Indian Rupee" },
  { code: "USD", rate_to_inr: 83.5, symbol: "$", name: "US Dollar" },
  { code: "EUR", rate_to_inr: 90.0, symbol: "€", name: "Euro" },
  { code: "GBP", rate_to_inr: 105.0, symbol: "£", name: "British Pound" },
];

function formatExactCurrency(amount: number | null | undefined, currencyCode: string = "INR"): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "Unavailable";
  }
  const num = Number(amount);
  const locale = currencyCode === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    }).format(num);
  } catch {
    return `${currencyCode} ${num.toLocaleString(locale)}`;
  }
}

export default function BudgetOptimizerPage() {
  const [context, setContext] = useState<OptimizerContext | null>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(true);
  const [contextError, setContextError] = useState<string | null>(null);

  // User budget input state (not pre-populated with fake company budgets)
  const [budgetInputRaw, setBudgetInputRaw] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Optimization execution state
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [result, setResult] = useState<BudgetOptimizationResponse | null>(null);

  // Table filter & pagination for large datasets
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Drill-down risk modal state
  const [activeRiskDetail, setActiveRiskDetail] = useState<ProfiledRiskAllocation | null>(null);

  // Existing CRISP upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  const currencies = useMemo(() => {
    return context?.supported_currencies?.length ? context.supported_currencies : DEFAULT_CURRENCIES;
  }, [context]);

  const activeCurrencyMeta = useMemo(() => {
    return currencies.find((c) => c.code === selectedCurrency) || DEFAULT_CURRENCIES[0];
  }, [currencies, selectedCurrency]);

  // Parse and validate budget input
  const validateBudgetInput = useCallback(
    (rawValue: string, currencyCode: string): { valid: boolean; numericValue: number | null; error: string | null } => {
      const trimmed = rawValue.trim();
      if (!trimmed) {
        return {
          valid: false,
          numericValue: null,
          error: "Please enter an available cybersecurity budget amount.",
        };
      }
      // Remove commas/spaces if user typed formatted digits like 10,00,000
      const cleaned = trimmed.replace(/,/g, "").replace(/\s+/g, "");
      if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
        return {
          valid: false,
          numericValue: null,
          error: "Enter a valid numeric budget amount (digits and optional decimal point only).",
        };
      }
      const parsed = Number(cleaned);
      if (!Number.isFinite(parsed)) {
        return {
          valid: false,
          numericValue: null,
          error: "Budget value is out of supported numerical range.",
        };
      }
      if (parsed < 0) {
        return {
          valid: false,
          numericValue: null,
          error: "Available budget cannot be negative.",
        };
      }
      if (parsed > 1e13) {
        return {
          valid: false,
          numericValue: null,
          error: "Entered budget exceeds maximum supported limit.",
        };
      }
      if (!currencies.some((c) => c.code === currencyCode)) {
        return {
          valid: false,
          numericValue: null,
          error: `Unsupported currency '${currencyCode}'.`,
        };
      }

      // Enforce strict match with Available Budget from uploaded dataset / Dashboard
      if (
        context?.has_uploaded_dataset &&
        context.dataset_budget !== null &&
        context.dataset_budget !== undefined
      ) {
        const expectedBudget = Number(context.dataset_budget);
        const expectedCurrency = context.dataset_currency || "INR";
        if (currencyCode !== expectedCurrency) {
          return {
            valid: false,
            numericValue: null,
            error: `Currency Mismatch: Selected currency (${currencyCode}) must match the Available Budget currency in Dashboard (${expectedCurrency}).`,
          };
        }
        if (Math.abs(parsed - expectedBudget) > 0.001) {
          return {
            valid: false,
            numericValue: null,
            error: `Budget Mismatch: Entered budget (${formatExactCurrency(parsed, currencyCode)}) does not match the Available Budget in Dashboard (${formatExactCurrency(expectedBudget, expectedCurrency)}).`,
          };
        }
      }

      return { valid: true, numericValue: parsed, error: null };
    },
    [currencies, context]
  );

  // Live detection of mismatch with dashboard available budget
  const liveBudgetMismatch = useMemo(() => {
    if (!context?.has_uploaded_dataset || context.dataset_budget === null || context.dataset_budget === undefined) {
      return null;
    }
    const trimmed = budgetInputRaw.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/,/g, "").replace(/\s+/g, "");
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return null;
    const expectedBudget = Number(context.dataset_budget);
    const expectedCurrency = context.dataset_currency || "INR";
    if (selectedCurrency !== expectedCurrency) {
      return `Currency Mismatch: Currency (${selectedCurrency}) does not match the Dashboard dataset currency (${expectedCurrency}).`;
    }
    if (Math.abs(num - expectedBudget) > 0.001) {
      return `Budget Mismatch: Entered budget (${formatExactCurrency(num, selectedCurrency)}) does not match the Available Budget in Dashboard (${formatExactCurrency(expectedBudget, expectedCurrency)}).`;
    }
    return null;
  }, [context, budgetInputRaw, selectedCurrency]);

  const isBudgetMatchingDashboard = useMemo(() => {
    if (!context?.has_uploaded_dataset || context.dataset_budget === null || context.dataset_budget === undefined) {
      return false;
    }
    const trimmed = budgetInputRaw.trim();
    if (!trimmed) return false;
    const cleaned = trimmed.replace(/,/g, "").replace(/\s+/g, "");
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return false;
    const expectedBudget = Number(context.dataset_budget);
    const expectedCurrency = context.dataset_currency || "INR";
    return Math.abs(num - expectedBudget) < 0.001 && selectedCurrency === expectedCurrency;
  }, [context, budgetInputRaw, selectedCurrency]);


  // Live formatted preview of the entered budget
  const formattedPreview = useMemo(() => {
    const trimmed = budgetInputRaw.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/,/g, "").replace(/\s+/g, "");
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
    const num = Number(cleaned);
    if (!Number.isFinite(num) || num < 0) return null;
    return `${formatExactCurrency(num, selectedCurrency)} ${selectedCurrency}`;
  }, [budgetInputRaw, selectedCurrency]);

  // Key for persisting optimization state across route changes & refreshes
  const STORAGE_KEY = "crisp_budget_optimizer_state_v1";

  // Hydrate saved optimizer state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.result && parsed.result.status === "ok") {
          setBudgetInputRaw(parsed.budgetInputRaw || String(parsed.result.budget?.entered_amount || ""));
          setSelectedCurrency(parsed.selectedCurrency || parsed.result.budget?.entered_currency || "INR");
          setResult(parsed.result);
          return;
        }
      }
    } catch {
      // ignore JSON storage read issues
    }

    // If not in localStorage, check if server snapshot already has an active optimizer result
    api.getLatestDatasetAnalysis().then((latest: any) => {
      if (latest && latest.budget_optimizer_result && latest.budget_optimizer_result.status === "ok") {
        const bRes = latest.budget_optimizer_result;
        setBudgetInputRaw(String(bRes.budget?.entered_amount || ""));
        setSelectedCurrency(bRes.budget?.entered_currency || "INR");
        setResult(bRes);
      }
    });
  }, []);

  // Load dataset context from backend
  const fetchContext = useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const ctx: OptimizerContext = await api.getBudgetOptimizerContext("org_default");
      setContext(ctx);

      // If dataset is uploaded with a defined budget, auto-fill input if not already set or optimized
      if (ctx && ctx.has_uploaded_dataset) {
        if (ctx.dataset_currency) {
          setSelectedCurrency(ctx.dataset_currency);
        }
        if (ctx.dataset_budget !== null && ctx.dataset_budget !== undefined) {
          setBudgetInputRaw((prev) => (prev.trim() === "" ? String(ctx.dataset_budget) : prev));
        }
      }
    } catch (err: any) {
      setContextError(err?.message || "Unable to connect to CRISP backend optimization service.");
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Execute authoritative backend optimization and persist result
  const executeOptimization = useCallback(
    async (budgetAmount: number, currencyCode: string) => {
      setOptimizing(true);
      setOptimizationError(null);
      try {
        const res: BudgetOptimizationResponse = await api.runBudgetOptimizer({
          available_budget: budgetAmount,
          currency: currencyCode,
          organization_id: "org_default",
        });
        setResult(res);
        setCurrentPage(1);

        // Persist to localStorage so the output remains stable across navigation
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              budgetInputRaw: String(budgetAmount),
              selectedCurrency: currencyCode,
              result: res,
              timestamp: Date.now(),
            })
          );
          // Notify other pages (Risks, Assets, Vulnerabilities) that budget optimization was updated
          window.dispatchEvent(new CustomEvent("crisp_budget_optimizer_updated", { detail: res }));
        } catch {
          // ignore storage quota issues
        }
      } catch (err: any) {
        setOptimizationError(err?.message || "Backend optimization failed. Please verify the service is running.");
      } finally {
        setOptimizing(false);
      }
    },
    []
  );

  const handleResetOptimizer = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setResult(null);
    setBudgetInputRaw("");
    setValidationError(null);
    setOptimizationError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateBudgetInput(budgetInputRaw, selectedCurrency);
    if (!check.valid || check.numericValue === null) {
      setValidationError(check.error);
      return;
    }
    setValidationError(null);
    await executeOptimization(check.numericValue, selectedCurrency);
  };

  // Detect if user changed the budget/currency compared to the active result
  const isInputModifiedSinceLastRun = useMemo(() => {
    if (!result) return false;
    const cleaned = budgetInputRaw.trim().replace(/,/g, "").replace(/\s+/g, "");
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return true;
    return num !== result.budget.entered_amount || selectedCurrency !== result.budget.entered_currency;
  }, [result, budgetInputRaw, selectedCurrency]);

  // Filtered and paginated table rows
  const filteredAllocations = useMemo(() => {
    if (!result) return [];
    const all = result.all_risk_allocations || [];
    if (statusFilter === "ALL") return all;
    return all.filter((r) => r.optimization_state === statusFilter);
  }, [result, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAllocations.length / pageSize));
  const paginatedAllocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAllocations.slice(start, start + pageSize);
  }, [filteredAllocations, currentPage]);

  const getOptimizationStatusBadge = (state: ProfiledRiskAllocation["optimization_state"]) => {
    switch (state) {
      case "Selected for Remediation":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/35";
      case "Deferred":
        return "bg-amber-500/15 text-amber-300 border-amber-500/35";
      case "Data Insufficient":
        return "bg-rose-500/15 text-rose-300 border-rose-500/35";
      case "Already Remediated":
        return "bg-slate-700/50 text-slate-300 border-slate-600/50";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const SEGMENT_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-teal-500",
  ];

  return (
    <PageShell>
      {/* Existing CRISP Dataset Upload Modal */}
      <RealDataStudioModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onComplete={async () => {
          setUploadModalOpen(false);
          await fetchContext();
          try {
            const latestCtx: OptimizerContext = await api.getBudgetOptimizerContext("org_default");
            setContext(latestCtx);
            if (
              latestCtx &&
              latestCtx.has_uploaded_dataset &&
              latestCtx.dataset_budget !== null &&
              latestCtx.dataset_budget !== undefined
            ) {
              setBudgetInputRaw(String(latestCtx.dataset_budget));
              if (latestCtx.dataset_currency) {
                setSelectedCurrency(latestCtx.dataset_currency);
              }
              await executeOptimization(latestCtx.dataset_budget, latestCtx.dataset_currency || "INR");
            } else {
              setResult(null);
            }
          } catch {
            // Context fetch failure handled by error state
          }
        }}
      />

      {/* Risk Drill-Down & Traceability Modal (Section 50) */}
      {activeRiskDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="risk-detail-modal-title"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">{activeRiskDetail.risk_id}</span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      getRiskLevelColor(activeRiskDetail.severity).badgeBg
                    )}
                  >
                    {activeRiskDetail.severity}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                      getOptimizationStatusBadge(activeRiskDetail.optimization_state)
                    )}
                  >
                    {activeRiskDetail.optimization_state}
                  </span>
                </div>
                <h3 id="risk-detail-modal-title" className="text-base font-semibold text-slate-100 mt-1.5">
                  {activeRiskDetail.risk_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRiskDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Close risk traceability details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Allocation Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Allocated Budget</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    {formatExactCurrency(activeRiskDetail.allocated_budget, activeRiskDetail.display_currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeRiskDetail.allocation_share_percent}% of recommended spend
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Remediation Cost</p>
                  <p className="text-lg font-bold text-slate-100 mt-1">
                    {activeRiskDetail.remediation_cost !== null
                      ? formatExactCurrency(activeRiskDetail.remediation_cost, activeRiskDetail.display_currency)
                      : "Cost unavailable"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeRiskDetail.remediation_state}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Modeled Risk Reduction</p>
                  <p className="text-lg font-bold text-blue-400 mt-1">
                    {activeRiskDetail.risk_reduction !== null
                      ? `${activeRiskDetail.risk_reduction} pts (${activeRiskDetail.expected_risk_reduction_percent ?? 0}%)`
                      : "Risk reduction unavailable"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeRiskDetail.current_risk ?? "N/A"} → {activeRiskDetail.expected_residual_risk ?? "N/A"} residual
                  </p>
                </div>
              </div>

              {/* Decision Rationale */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Optimizer Decision Rationale
                </p>
                <p className="text-slate-200 mt-1 leading-relaxed">{activeRiskDetail.decision_reason}</p>
              </div>

              {/* Risk Classifications & Context */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Multi-Factor Risk Classification & Context
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Target Asset</span>
                    <span className="font-medium text-slate-200">{activeRiskDetail.asset_name}</span>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Business Importance</span>
                    <span className="font-medium text-slate-200">{activeRiskDetail.business_importance}</span>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Exposure</span>
                    <span className="font-medium text-slate-200">{activeRiskDetail.exposure_classification}</span>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Threat / Exploitability</span>
                    <span className="font-medium text-slate-200">{activeRiskDetail.threat_classification}</span>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">CVSS Score</span>
                    <span className="font-medium text-slate-200">
                      {activeRiskDetail.cvss_score !== null ? activeRiskDetail.cvss_score.toFixed(1) : "Not specified"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <span className="text-[10px] text-slate-400 block">Budget Efficiency</span>
                    <span className="font-medium text-slate-200">
                      {activeRiskDetail.budget_efficiency_per_lakh_inr !== null
                        ? `${activeRiskDetail.budget_efficiency_per_lakh_inr} pts / ₹1L`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Traceability (Section 50) */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Source Traceability & Model Provenance
                </h4>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80">
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">CVSS / Vulnerability</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.cvss_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">Current Risk Score</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.current_risk_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">Remediation Cost</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.remediation_cost_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">Business Criticality</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.business_criticality_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">Threat Activity / Exploitability</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.threat_source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-slate-400">Asset Exposure</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {activeRiskDetail.traceability.exposure_source}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 px-6 py-3.5 bg-slate-950/60 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveRiskDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header (Section 51) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calculator className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Budget Optimizer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Optimize cybersecurity remediation spending based on available budget and modeled risk reduction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {context && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Source:</span>
              <span className="font-medium text-slate-100">{context.dataset_source}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-medium">{context.eligible_risks_count} eligible</span>
              <span className="text-slate-400">of {context.total_risks_available} risks</span>
            </div>
          )}
          <Button
            onClick={() => setUploadModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-blue-500/40 bg-blue-950/20 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100 text-xs shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            {context?.has_uploaded_dataset ? "Upload New Dataset" : "Upload Dataset"}
          </Button>
        </div>
      </div>

      {/* Backend Connection Error State (Section 57) */}
      {contextError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-rose-200">Backend Optimization Service Unavailable</h2>
              <p className="text-xs text-rose-300/90 mt-0.5">{contextError}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchContext} className="shrink-0">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Connection
          </Button>
        </div>
      )}

      {/* Upload Required Gate — Only allow budget input after dataset upload */}
      {!contextLoading && context && !context.has_uploaded_dataset && (
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900 shadow-xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-slate-100">Upload Company Dataset to Unlock Budget Optimizer</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                To prevent arbitrary or random budget allocations, the Budget Optimizer requires your organization&apos;s
                uploaded risk dataset. The cybersecurity budget specified in your dataset (<code className="text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded font-mono text-[11px]">security_budget</code> or <code className="text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded font-mono text-[11px]">available_budget</code>)
                will be extracted and used to calculate the highest-ROI remediation allocations without arbitrary numbers.
              </p>
            </div>
            <div className="pt-2">
              <Button
                id="upload-dataset-gate-btn"
                onClick={() => setUploadModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Company Dataset (CSV / JSON)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Detected Budget Callout */}
      {!contextLoading && context && context.has_uploaded_dataset && (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-slate-900/95 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Dataset Security Budget Identified
                </span>
                {context.company_name && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {context.company_name}
                  </span>
                )}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  {context.dataset_source}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1">
                Designated Security Budget in Data:{" "}
                <span className="text-emerald-300 font-bold text-base">
                  {context.dataset_budget !== null && context.dataset_budget !== undefined
                    ? formatExactCurrency(context.dataset_budget, context.dataset_currency || "INR")
                    : "Not specified"}
                </span>
              </p>
            </div>
          </div>
          {context.dataset_budget !== null && context.dataset_budget !== undefined && (
            <Button
              type="button"
              onClick={() => {
                setBudgetInputRaw(String(context.dataset_budget));
                if (context.dataset_currency) {
                  setSelectedCurrency(context.dataset_currency);
                }
                setValidationError(null);
              }}
              variant="outline"
              size="sm"
              className="border-emerald-500/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30 hover:text-emerald-200 shrink-0 self-start sm:self-auto font-medium"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              Apply Dataset Budget
            </Button>
          )}
        </div>
      )}

      {/* SECTION 1 — FIRST SCREEN: ASK FOR THE USER'S BUDGET (Sections 2, 3, 29, 30, 45) */}
      <Card className="border-slate-800/90 bg-slate-900/60 shadow-lg">
        <CardHeader className="pb-3 border-b border-slate-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 block">
                Step 1 — Optimization Constraint
              </span>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-100 mt-0.5">
                What is your available cybersecurity remediation budget?
              </CardTitle>
            </div>
            {formattedPreview && context?.has_uploaded_dataset && (
              <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-300">
                Budget: {formattedPreview}
              </div>
            )}
            {!context?.has_uploaded_dataset && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 flex items-center gap-1.5 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" />
                Upload Dataset Required
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Currency Selector */}
              <div className="md:col-span-3">
                <label
                  htmlFor="budget-currency-select"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Currency
                </label>
                <select
                  id="budget-currency-select"
                  disabled={!context?.has_uploaded_dataset}
                  value={selectedCurrency}
                  onChange={(e) => {
                    setSelectedCurrency(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className={cn(
                    "w-full h-11 rounded-xl border bg-slate-950 px-3.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                    !context?.has_uploaded_dataset ? "opacity-50 cursor-not-allowed border-slate-800" : "border-slate-700/80"
                  )}
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numeric Budget Input */}
              <div className="md:col-span-6">
                <label
                  htmlFor="available-budget-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Available Cybersecurity Budget ({activeCurrencyMeta.symbol} {activeCurrencyMeta.code})
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm pointer-events-none">
                    {activeCurrencyMeta.symbol}
                  </span>
                  <input
                    id="available-budget-input"
                    type="text"
                    inputMode="decimal"
                    disabled={!context?.has_uploaded_dataset}
                    value={budgetInputRaw}
                    onChange={(e) => {
                      setBudgetInputRaw(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder={
                      !context?.has_uploaded_dataset
                        ? "Upload company dataset first to enter budget"
                        : `Enter available budget in ${activeCurrencyMeta.code}`
                    }
                    aria-invalid={Boolean(validationError || liveBudgetMismatch)}
                    aria-describedby={
                      validationError || liveBudgetMismatch ? "budget-input-error" : "budget-input-help"
                    }
                    className={cn(
                      "w-full h-11 rounded-xl border bg-slate-950 pl-9 pr-4 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all",
                      !context?.has_uploaded_dataset
                        ? "opacity-50 cursor-not-allowed border-slate-800"
                        : validationError || liveBudgetMismatch
                        ? "border-rose-500/70 focus:ring-rose-500/40 bg-rose-950/10 text-rose-100"
                        : isBudgetMatchingDashboard
                        ? "border-emerald-500/60 focus:ring-emerald-500/40"
                        : "border-slate-700/80 focus:ring-blue-500/50 focus:border-blue-500"
                    )}
                  />
                </div>
                {!context?.has_uploaded_dataset ? (
                  <p id="budget-input-help" className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Upload your company risk dataset with designated security budget to enable optimization.</span>
                  </p>
                ) : validationError || liveBudgetMismatch ? (
                  <div className="space-y-1.5 mt-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/25">
                    <p id="budget-input-error" className="text-xs text-rose-300 flex items-start gap-1.5 font-medium leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{validationError || liveBudgetMismatch}</span>
                    </p>
                    {context?.dataset_budget !== null && context?.dataset_budget !== undefined && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setBudgetInputRaw(String(context.dataset_budget));
                          if (context.dataset_currency) {
                            setSelectedCurrency(context.dataset_currency);
                          }
                          setValidationError(null);
                        }}
                        className="h-7 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg px-2.5 flex items-center gap-1.5 mt-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Match Dashboard Budget ({formatExactCurrency(context.dataset_budget, context.dataset_currency || "INR")})</span>
                      </Button>
                    )}
                  </div>
                ) : isBudgetMatchingDashboard ? (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Matches Available Budget in Dashboard ({formatExactCurrency(context?.dataset_budget, context?.dataset_currency || "INR")})</span>
                  </p>
                ) : (
                  <p id="budget-input-help" className="text-[11px] text-slate-400 mt-1.5">
                    CRISP automatically evaluates all eligible risks in your uploaded dataset and solves for the optimal
                    remediation portfolio within this constraint.
                  </p>
                )}
              </div>

              {/* Submit / Recalculate Action */}
              <div className="md:col-span-3 md:pt-6 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    id="optimize-budget-submit-btn"
                    type="submit"
                    disabled={
                      optimizing ||
                      !context?.has_uploaded_dataset ||
                      Boolean(validationError || liveBudgetMismatch) ||
                      (context?.total_risks_available === 0)
                    }
                    className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : !context?.has_uploaded_dataset ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Upload Dataset First</span>
                      </>
                    ) : (validationError || liveBudgetMismatch) ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-300" />
                        <span>Budget Mismatch</span>
                      </>
                    ) : result ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Recalculate</span>
                      </>
                    ) : (
                      <>
                        <Scale className="w-4 h-4" />
                        <span>Optimize Budget</span>
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetOptimizer}
                      className="h-11 px-3 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs"
                      title="Clear saved budget constraint and output"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                {result && !isInputModifiedSinceLastRun && (
                  <p className="text-[10px] text-emerald-400/90 flex items-center gap-1 justify-center sm:justify-start">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Allocations saved & stable</span>
                  </p>
                )}
              </div>
            </div>

            {/* Prompt when user alters budget after a calculation (Sections 29 & 30) */}
            {result && isInputModifiedSinceLastRun && !validationError && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/25 px-3.5 py-2 flex items-center justify-between text-xs text-blue-200">
                <span>
                  You modified the budget constraint. Click <strong>Recalculate</strong> to run the backend optimizer
                  with the updated budget. The current allocation remains active until recalculated.
                </span>
              </div>
            )}
          </form>

          {optimizationError && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/25 p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Optimization Error</p>
                <p className="mt-0.5 text-rose-300">{optimizationError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AUTHORITATIVE OPTIMIZATION RESULTS (Displayed once user runs Optimize Budget) */}
      {result && result.status === "ok" && (
        <div className="space-y-6">
          {/* Status Banners: Zero Budget, Over-Budget Constraint, or Surplus Budget (Sections 24, 25, 26, 27) */}
          {result.budget.entered_amount === 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h3 className="font-semibold text-amber-200 text-sm">
                  Available Budget: {formatExactCurrency(0, result.budget.entered_currency)} — All eligible remediations deferred
                </h3>
                <p className="text-amber-300/90 mt-1">
                  With zero available budget, recommended investment is{" "}
                  {formatExactCurrency(0, result.budget.entered_currency)}. All {result.deferred_count} eligible
                  remediations remain deferred and organizational risk remains at {result.total_current_risk} pts.
                </p>
              </div>
            </div>
          )}

          {result.budget.entered_amount > 0 && result.budget_constraint_active && (
            <div className="rounded-xl border border-blue-500/35 bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-200 text-sm">Budget Constraint Active</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Combinatorial Portfolio Selected
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    Total eligible remediations require{" "}
                    <strong className="text-slate-100">
                      {formatExactCurrency(result.total_eligible_remediation_cost, result.budget.entered_currency)}
                    </strong>
                    , which exceeds your available budget of{" "}
                    <strong className="text-slate-100">
                      {formatExactCurrency(result.budget.entered_amount, result.budget.entered_currency)}
                    </strong>
                    . CRISP selected the optimal subset of{" "}
                    <strong className="text-emerald-300">{result.selected_count} risk(s)</strong> and deferred{" "}
                    <strong className="text-amber-300">{result.deferred_count} risk(s)</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.budget.entered_amount > result.total_eligible_remediation_cost &&
            result.total_eligible_remediation_cost > 0 &&
            result.deferred_count === 0 && (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h3 className="font-semibold text-emerald-200 text-sm">
                    All Eligible Remediations Funded Without Forcing Full Budget Utilization
                  </h3>
                  <p className="text-slate-300 mt-1">
                    Your available budget (
                    <strong>{formatExactCurrency(result.budget.entered_amount, result.budget.entered_currency)}</strong>
                    ) exceeds the combined cost of all eligible remediations (
                    <strong>
                      {formatExactCurrency(result.total_eligible_remediation_cost, result.budget.entered_currency)}
                    </strong>
                    ). CRISP recommends investing only the justified{" "}
                    <strong>{formatExactCurrency(result.recommended_investment, result.budget.entered_currency)}</strong>{" "}
                    and retaining{" "}
                    <strong>{formatExactCurrency(result.remaining_budget, result.budget.entered_currency)}</strong> as
                    unallocated budget.
                  </p>
                </div>
              </div>
            )}

          {/* SECTION 2 — MAIN RESULT: RECOMMENDED BUDGET ALLOCATION (Sections 19, 35, 40) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">Recommended Budget Allocation</h2>
                <p className="text-xs text-slate-400">
                  Planning recommendation calculated by the CRISP combinatorial portfolio optimizer (distinct from
                  actual historical spend).
                </p>
              </div>
              {result.budget.entered_currency !== "INR" && (
                <div className="text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
                  Normalized internally at 1 {result.budget.entered_currency} = ₹
                  {result.budget.conversion_rate_to_inr} INR (
                  {formatExactCurrency(result.budget.normalized_amount_inr, "INR")})
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* Available Budget */}
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available Budget</p>
                  <p className="text-xl font-bold text-slate-100 mt-1.5 break-words">
                    {formatExactCurrency(result.budget.entered_amount, result.budget.entered_currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Constraint in {result.budget.entered_currency}
                  </p>
                </CardContent>
              </Card>

              {/* Recommended Investment / Allocation */}
              <Card className="border-emerald-500/30 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Recommended Investment
                  </p>
                  <p className="text-xl font-bold text-emerald-300 mt-1.5 break-words">
                    {formatExactCurrency(result.recommended_investment, result.budget.entered_currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {result.budget.entered_amount > 0
                      ? `${((result.recommended_investment / result.budget.entered_amount) * 100).toFixed(1)}% of budget allocated`
                      : "0% allocated"}
                  </p>
                </CardContent>
              </Card>

              {/* Remaining Budget */}
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Remaining Budget</p>
                  <p className="text-xl font-bold text-slate-100 mt-1.5 break-words">
                    {formatExactCurrency(result.remaining_budget, result.budget.entered_currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Unallocated reserve</p>
                </CardContent>
              </Card>

              {/* Risks Selected */}
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Risks Selected</p>
                  <p className="text-xl font-bold text-blue-400 mt-1.5">{result.selected_count}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Funded for remediation</p>
                </CardContent>
              </Card>

              {/* Risks Deferred */}
              <Card className="border-slate-800 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Risks Deferred</p>
                  <p className="text-xl font-bold text-amber-400 mt-1.5">{result.deferred_count}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {result.data_insufficient_count > 0
                      ? `+ ${result.data_insufficient_count} missing data`
                      : "Unfunded eligible risks"}
                  </p>
                </CardContent>
              </Card>

              {/* Modeled Risk Reduction */}
              <Card className="border-blue-500/30 bg-slate-900/60">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                    Modeled Risk Reduction
                  </p>
                  <p className="text-xl font-bold text-blue-300 mt-1.5">
                    {result.overall_risk_reduction_percent}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {result.total_current_risk} → {result.total_post_remediation_risk} pts (-{result.total_risk_reduction})
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* SECTION 4 — BUDGET DISTRIBUTION & BEFORE VS AFTER RISK VISUALIZATION (Sections 22, 23, 35, 39, 54) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Per-Risk & Category Budget Distribution */}
            <Card className="lg:col-span-7 border-slate-800 bg-slate-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-100 flex items-center justify-between">
                  <span>Budget Distribution Breakdown</span>
                  <span className="text-xs font-normal text-slate-400">
                    Total: {formatExactCurrency(result.budget.entered_amount, result.budget.entered_currency)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Segmented Horizontal Allocation Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>Allocated vs. Remaining Share of Budget</span>
                    <span>
                      {formatExactCurrency(result.recommended_investment, result.budget.entered_currency)} allocated /{" "}
                      {formatExactCurrency(result.remaining_budget, result.budget.entered_currency)} remaining
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-800/90 overflow-hidden flex border border-slate-700/60">
                    {result.selected_risks.map((sr, idx) => {
                      const pctOfTotal =
                        result.budget.entered_amount > 0
                          ? Math.max(1, (sr.allocated_budget / result.budget.entered_amount) * 100)
                          : 0;
                      return (
                        <div
                          key={sr.risk_id}
                          style={{ width: `${pctOfTotal}%` }}
                          title={`${sr.risk_name}: ${formatExactCurrency(sr.allocated_budget, sr.display_currency)} (${sr.allocation_share_percent}% of allocated spend)`}
                          className={cn(
                            "h-full transition-all border-r border-slate-950/40",
                            SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Per-Risk Legend */}
                  {result.selected_risks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {result.selected_risks.map((sr, idx) => (
                        <div
                          key={sr.risk_id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={cn(
                                "w-2.5 h-2.5 rounded-sm shrink-0",
                                SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
                              )}
                            />
                            <span className="text-slate-200 truncate font-medium" title={sr.risk_name}>
                              {sr.risk_name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-semibold text-slate-100">
                              {formatExactCurrency(sr.allocated_budget, sr.display_currency)}
                            </span>
                            <span className="text-slate-400 ml-1.5">({sr.allocation_share_percent}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2.5">
                      No risks receive budget allocation under the current budget constraint.
                    </p>
                  )}
                </div>

                {/* Category Spend Summary (Section 39) */}
                {result.category_breakdown.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                      Allocation by Remediation Category
                    </h4>
                    <div className="space-y-2">
                      {result.category_breakdown.map((cat) => (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between text-xs rounded-lg bg-slate-950/40 border border-slate-800/60 px-3 py-2"
                        >
                          <div>
                            <span className="font-medium text-slate-200">{cat.category}</span>
                            <span className="text-slate-400 ml-2">
                              ({cat.risk_count} risk{cat.risk_count > 1 ? "s" : ""} · -{cat.risk_reduction} risk pts)
                            </span>
                          </div>
                          <div className="font-semibold text-emerald-300">
                            {formatExactCurrency(cat.allocated, result.budget.entered_currency)}{" "}
                            <span className="text-slate-400 font-normal">({cat.share_of_allocated_percent}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unallocated / Remaining Budget Explanation (Section 23) */}
                {result.explanation.unused_budget_reason && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-100">Unallocated Budget Note: </span>
                      <span>{result.explanation.unused_budget_reason}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Before vs. After Portfolio Risk & Outcome Summary (Sections 35, 38, 54) */}
            <Card className="lg:col-span-5 border-slate-800 bg-slate-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-100">
                  Portfolio-Level Risk Impact (Before vs. After)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Before Remediation Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Before Remediation (Total Modeled Risk)</span>
                    <span className="font-bold text-rose-400">{result.total_current_risk} pts</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-rose-500/80 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* After Recommended Remediation Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">After Recommended Remediation</span>
                    <span className="font-bold text-emerald-400">{result.total_post_remediation_risk} pts</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${
                          result.total_current_risk > 0
                            ? Math.max(2, (result.total_post_remediation_risk / result.total_current_risk) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Net Risk & Financial EAL Impact */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Overall Risk Reduction
                    </span>
                    <span className="text-lg font-bold text-blue-400 mt-0.5 block">
                      {result.overall_risk_reduction_percent}% (-{result.total_risk_reduction} pts)
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Modeled EAL Reduction
                    </span>
                    <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                      {result.total_eal_reduction > 0
                        ? formatExactCurrency(result.total_eal_reduction, result.budget.entered_currency)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Classification Summary (Section 38) */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Dataset By Severity
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-rose-400">Critical</span>
                        <span className="font-semibold text-slate-200">
                          {result.classification_summary.by_severity.Critical ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-400">High</span>
                        <span className="font-semibold text-slate-200">
                          {result.classification_summary.by_severity.High ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-400">Medium</span>
                        <span className="font-semibold text-slate-200">
                          {result.classification_summary.by_severity.Medium ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Low</span>
                        <span className="font-semibold text-slate-200">
                          {result.classification_summary.by_severity.Low ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Portfolio Outcome
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-300">Selected</span>
                        <span className="font-semibold text-slate-200">{result.selected_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-300">Deferred</span>
                        <span className="font-semibold text-slate-200">{result.deferred_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-300">Data Insufficient</span>
                        <span className="font-semibold text-slate-200">{result.data_insufficient_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Already Remediated</span>
                        <span className="font-semibold text-slate-200">{result.already_remediated_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 6 — OPTIMIZER EXPLANATION ("Why this allocation?", Section 28) */}
          <Card className="border-blue-500/25 bg-slate-900/60">
            <CardContent className="p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Why This Allocation? — Optimization Explanation</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{result.explanation.headline}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{result.explanation.summary}</p>
              {result.explanation.details.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {result.explanation.details.map((detail, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-blue-200/90 bg-blue-950/30 border border-blue-500/25 rounded-lg px-3 py-2"
                    >
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3 — RISK ALLOCATION TABLE (Sections 20, 21, 46, 50) */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-100">
                    Risk-by-Risk Budget Allocation Table
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detailed allocation across all evaluated risks. Click any row to inspect full multi-factor input
                    traceability.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: "ALL", label: `All (${result.all_risk_allocations.length})` },
                    { key: "Selected for Remediation", label: `Selected (${result.selected_count})` },
                    { key: "Deferred", label: `Deferred (${result.deferred_count})` },
                    ...(result.data_insufficient_count > 0
                      ? [{ key: "Data Insufficient", label: `Data Insufficient (${result.data_insufficient_count})` }]
                      : []),
                    ...(result.already_remediated_count > 0
                      ? [
                          {
                            key: "Already Remediated",
                            label: `Already Remediated (${result.already_remediated_count})`,
                          },
                        ]
                      : []),
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(tab.key);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                        statusFilter === tab.key
                          ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                          : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Risk</th>
                      <th className="py-3 px-3">Severity</th>
                      <th className="py-3 px-3 text-right">CVSS</th>
                      <th className="py-3 px-3 text-right">Current Risk</th>
                      <th className="py-3 px-4">Remediation</th>
                      <th className="py-3 px-3 text-right">Cost</th>
                      <th className="py-3 px-3 text-right">Budget Allocated</th>
                      <th className="py-3 px-3 text-right">Residual Risk</th>
                      <th className="py-3 px-3 text-right">Risk Reduction</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Trace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {paginatedAllocations.map((row) => {
                      const sevStyle = getRiskLevelColor(row.severity);
                      const isSelected = row.optimization_state === "Selected for Remediation";
                      return (
                        <tr
                          key={row.risk_id}
                          onClick={() => setActiveRiskDetail(row)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-slate-800/40",
                            isSelected ? "bg-emerald-950/10" : ""
                          )}
                        >
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <div className="font-semibold text-slate-100 truncate" title={row.risk_name}>
                              {row.risk_name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {row.asset_name} {row.cve_id ? `· ${row.cve_id}` : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                                sevStyle.badgeBg
                              )}
                            >
                              {row.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                            {row.cvss_score !== null ? row.cvss_score.toFixed(1) : "—"}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                            {row.current_risk !== null ? row.current_risk.toFixed(2) : "—"}
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <div className="text-slate-200 truncate" title={row.remediation_name || "Unavailable"}>
                              {row.remediation_name || "No remediation specified"}
                            </div>
                            <div className="text-[10px] text-slate-400">{row.business_importance} Importance</div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-200 whitespace-nowrap">
                            {row.remediation_cost !== null
                              ? formatExactCurrency(row.remediation_cost, row.display_currency)
                              : "Cost unavailable"}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isSelected ? "text-emerald-400" : "text-slate-400"}>
                              {formatExactCurrency(row.allocated_budget, row.display_currency)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-200">
                            {row.expected_residual_risk !== null ? row.expected_residual_risk.toFixed(2) : "—"}
                          </td>
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            {row.risk_reduction !== null ? (
                              <div>
                                <span className="font-semibold text-blue-400">-{row.risk_reduction} pts</span>
                                <span className="text-[10px] text-slate-400 block">
                                  ({row.expected_risk_reduction_percent ?? 0}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Unavailable</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                                getOptimizationStatusBadge(row.optimization_state)
                              )}
                            >
                              {row.optimization_state}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRiskDetail(row);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[11px]"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls (Section 46) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
                  <span>
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredAllocations.length)} of {filteredAllocations.length} risks
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2 text-slate-200">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 px-2 text-xs"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 5 — SELECTED FOR REMEDIATION & DEFERRED RISKS VIEWS (Sections 21, 36, 37) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Selected for Remediation View (Sections 21 & 37) */}
            <Card className="border-emerald-500/25 bg-slate-900/50">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-sm font-bold text-emerald-300 flex items-center justify-between">
                  <span>Selected for Remediation ({result.selected_count})</span>
                  <span className="text-xs font-normal text-slate-400">
                    Total Allocated: {formatExactCurrency(result.recommended_investment, result.budget.entered_currency)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {result.selected_risks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No risks were selected for remediation under the current budget constraint.
                  </p>
                ) : (
                  result.selected_risks.map((sr) => (
                    <div
                      key={sr.risk_id}
                      onClick={() => setActiveRiskDetail(sr)}
                      className="rounded-xl border border-emerald-500/25 bg-slate-950/60 p-4 space-y-2.5 cursor-pointer hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{sr.risk_id}</span>
                          <h4 className="text-sm font-semibold text-slate-100">{sr.risk_name}</h4>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0",
                            getRiskLevelColor(sr.severity).badgeBg
                          )}
                        >
                          {sr.severity} {sr.cvss_score !== null ? `· CVSS ${sr.cvss_score.toFixed(1)}` : ""}
                        </span>
                      </div>

                      {/* Prominent Money Allocation Display (Section 21) */}
                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Allocated Budget</span>
                          <span className="font-bold text-emerald-300">
                            {formatExactCurrency(sr.allocated_budget, sr.display_currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Remediation Cost</span>
                          <span className="font-semibold text-slate-200">
                            {formatExactCurrency(sr.remediation_cost, sr.display_currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Expected Risk Reduction</span>
                          <span className="font-bold text-blue-300">
                            {sr.expected_risk_reduction_percent}% (-{sr.risk_reduction} pts)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Remediation: {sr.remediation_name}</span>
                        <span>
                          Risk: {sr.current_risk} → {sr.expected_residual_risk}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{sr.decision_reason}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Deferred Risks View (Section 36) */}
            <Card className="border-amber-500/25 bg-slate-900/50">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-sm font-bold text-amber-300 flex items-center justify-between">
                  <span>Deferred Risks ({result.deferred_count})</span>
                  <span className="text-xs font-normal text-slate-400">Unfunded Eligible Risks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {result.deferred_risks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No eligible risks were deferred — all eligible remediations are funded within the current budget.
                  </p>
                ) : (
                  result.deferred_risks.map((dr) => (
                    <div
                      key={dr.risk_id}
                      onClick={() => setActiveRiskDetail(dr)}
                      className="rounded-xl border border-amber-500/25 bg-slate-950/60 p-4 space-y-2.5 cursor-pointer hover:border-amber-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{dr.risk_id}</span>
                          <h4 className="text-sm font-semibold text-slate-100">{dr.risk_name}</h4>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0",
                            getRiskLevelColor(dr.severity).badgeBg
                          )}
                        >
                          {dr.severity} {dr.cvss_score !== null ? `· CVSS ${dr.cvss_score.toFixed(1)}` : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Required Cost</span>
                          <span className="font-semibold text-amber-300">
                            {formatExactCurrency(dr.remediation_cost, dr.display_currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Current Risk</span>
                          <span className="font-semibold text-slate-200">{dr.current_risk} pts</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Potential Reduction</span>
                          <span className="font-semibold text-slate-300">
                            -{dr.risk_reduction} pts ({dr.expected_risk_reduction_percent}%)
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-200/90 bg-amber-950/25 border border-amber-500/20 rounded-lg px-3 py-2">
                        <strong className="font-semibold">Reason for Deferral: </strong>
                        {dr.decision_reason}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* SECTION 7 — DATA QUALITY WARNINGS & INSUFFICIENT DATA ITEMS (Sections 15, 16, 17, 42) */}
          {(result.warnings.length > 0 ||
            result.data_insufficient_risks.length > 0 ||
            result.already_remediated_risks.length > 0) && (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader className="pb-3 border-b border-slate-800/80">
                <CardTitle className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Data Quality Notices & Excluded Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                {result.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3.5 py-2.5 text-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}

                {result.data_insufficient_risks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="font-semibold text-rose-300 uppercase tracking-wider text-[11px]">
                      Requires Additional Data ({result.data_insufficient_risks.length})
                    </h4>
                    {result.data_insufficient_risks.map((ir) => (
                      <div
                        key={ir.risk_id}
                        className="rounded-lg border border-rose-500/25 bg-rose-950/15 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-slate-100">{ir.risk_name}</span>
                          <span className="text-rose-300 block mt-0.5">{ir.decision_reason}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          {ir.remediation_state}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
