"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Coins, RefreshCw, ShieldAlert, TrendingDown } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RiskHorizon } from "@/components/dashboard/RiskHorizon";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/api";

type PortfolioRisk = {
  severity?: string;
  risk_level?: string;
  remediation_cost?: number;
  allocated_budget?: number;
};

type Analysis = {
  valid_count?: number;
  valid_records?: any[];
  optimization?: {
    available_budget: number;
    recommended_total_investment?: number;
    allocated_budget?: number;
    recommended_investment?: number;
    remaining_budget: number;
    total_current_risk: number;
    total_estimated_risk_reduction?: number;
    total_risk_reduction?: number;
    overall_risk_reduction_percent: number;
    selected_risks: PortfolioRisk[];
    deferred_risks: PortfolioRisk[];
  };
};

const money = (value?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const load = async () => {
    try {
      const data = (await api.getLatestDatasetAnalysis()) as any;
      let finalData = data;
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("crisp_budget_optimizer_state_v1") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.result && parsed.result.status === "ok") {
            const optRes = parsed.result;
            if (!finalData || finalData.status === "no_data") {
              finalData = {
                valid_count: optRes.all_risk_allocations?.length || 0,
                valid_records: optRes.all_risk_allocations || [],
                optimization: {
                  available_budget: optRes.budget?.entered_amount || 0,
                  allocated_budget: optRes.recommended_investment,
                  recommended_total_investment: optRes.recommended_investment,
                  recommended_investment: optRes.recommended_investment,
                  remaining_budget: optRes.remaining_budget,
                  selected_risks: optRes.selected_risks || [],
                  deferred_risks: optRes.deferred_risks || [],
                  total_current_risk: optRes.total_current_risk,
                  total_post_remediation_risk: optRes.total_post_remediation_risk,
                  estimated_post_remediation_risk: optRes.total_post_remediation_risk,
                  total_risk_reduction: optRes.total_risk_reduction,
                  total_estimated_risk_reduction: optRes.total_risk_reduction,
                  overall_risk_reduction_percent: optRes.overall_risk_reduction_percent,
                  recommendation: optRes.explanation?.summary,
                },
              };
            } else if (finalData.optimization) {
              finalData = {
                ...finalData,
                optimization: {
                  ...finalData.optimization,
                  available_budget: optRes.budget?.entered_amount ?? finalData.optimization.available_budget,
                  allocated_budget: optRes.recommended_investment ?? finalData.optimization.allocated_budget,
                  recommended_total_investment: optRes.recommended_investment ?? finalData.optimization.recommended_total_investment,
                  recommended_investment: optRes.recommended_investment ?? finalData.optimization.recommended_investment,
                  remaining_budget: optRes.remaining_budget ?? finalData.optimization.remaining_budget,
                  selected_risks: optRes.selected_risks ?? finalData.optimization.selected_risks,
                  deferred_risks: optRes.deferred_risks ?? finalData.optimization.deferred_risks,
                  total_current_risk: optRes.total_current_risk ?? finalData.optimization.total_current_risk,
                  total_post_remediation_risk: optRes.total_post_remediation_risk ?? finalData.optimization.total_post_remediation_risk,
                  estimated_post_remediation_risk: optRes.total_post_remediation_risk ?? finalData.optimization.estimated_post_remediation_risk,
                  total_risk_reduction: optRes.total_risk_reduction ?? finalData.optimization.total_risk_reduction,
                  total_estimated_risk_reduction: optRes.total_risk_reduction ?? finalData.optimization.total_estimated_risk_reduction,
                  overall_risk_reduction_percent: optRes.overall_risk_reduction_percent ?? finalData.optimization.overall_risk_reduction_percent,
                },
              };
            }
          }
        }
      } catch {}
      setAnalysis(finalData);
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener("crisp_budget_optimizer_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("crisp_budget_optimizer_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const result = analysis?.optimization;
  const selected = result?.selected_risks || [];
  const deferred = result?.deferred_risks || [];

  // All risks evaluated (from valid_records if available, otherwise selected + deferred)
  const allRisks = useMemo(() => {
    if (Array.isArray(analysis?.valid_records) && analysis.valid_records.length > 0) {
      return analysis.valid_records;
    }
    return [...selected, ...deferred];
  }, [analysis, selected, deferred]);

  // Robust severity classifier from explicit fields, CVSS score, or calculated risk
  const getSeverity = (risk: any): string => {
    if (risk.severity) return String(risk.severity).toUpperCase();
    if (risk.risk_level) return String(risk.risk_level).toUpperCase();
    if (risk.severity_level) return String(risk.severity_level).toUpperCase();
    const cvss = Number(risk.cvss_score ?? risk.cvss);
    if (Number.isFinite(cvss) && cvss > 0) {
      if (cvss >= 9.0) return "CRITICAL";
      if (cvss >= 7.0) return "HIGH";
      if (cvss >= 4.0) return "MEDIUM";
      return "LOW";
    }
    const cur = Number(risk.current_risk ?? risk.residual_risk);
    if (Number.isFinite(cur) && cur > 0) {
      if (cur >= 75) return "CRITICAL";
      if (cur >= 45) return "HIGH";
      if (cur >= 25) return "MEDIUM";
      return "LOW";
    }
    return "MEDIUM";
  };

  // Case-insensitive critical & high risk count
  const criticalCount = useMemo(() => {
    return allRisks.filter((risk: any) => {
      const s = getSeverity(risk);
      return s === "HIGH" || s === "CRITICAL";
    }).length;
  }, [allRisks]);

  const selectedCost = selected.reduce(
    (total: number, risk: any) =>
      total + Number(risk.remediation_cost ?? risk.allocated_budget ?? 0),
    0
  );

  const highestAllocation = selected.reduce(
    (highest: number, risk: any) =>
      Math.max(highest, Number(risk.remediation_cost ?? risk.allocated_budget ?? 0)),
    0
  );

  // Recommended investment (supports allocated_budget, recommended_total_investment, or selectedCost)
  const recInvestment = Number(
    result?.recommended_total_investment ??
      result?.allocated_budget ??
      result?.recommended_investment ??
      (selectedCost > 0 ? selectedCost : 0)
  );

  const availBudget = Number(result?.available_budget || 0);
  const budgetUse = availBudget > 0 ? Math.min(100, Math.round((recInvestment / availBudget) * 100)) : 0;

  // Reduction value (supports total_estimated_risk_reduction or total_risk_reduction)
  const reductionVal = Number(
    result?.total_estimated_risk_reduction ?? result?.total_risk_reduction ?? 0
  );

  const assetCount = useMemo(() => {
    if (analysis?.valid_count && analysis.valid_count > 0) {
      return analysis.valid_count;
    }
    if (allRisks.length > 0) {
      const uniqueAssets = new Set(
        allRisks.map((r: any) => r.asset_name || r.asset || "Enterprise Asset")
      );
      return uniqueAssets.size;
    }
    return 0;
  }, [analysis, allRisks]);

  return (
    <PageShell
      title="Executive Cyber Risk & Financial Profit Intelligence"
      description="Dataset-derived cyber risk analysis and budget allocation"
      onOpenStudio={() => setIsStudioOpen(true)}
    >
      <RiskHorizon
        posture={result ? "ANALYSIS READY" : "AWAITING DATA"}
        riskCount={criticalCount}
        assetCount={assetCount}
        onOpenStudio={() => setIsStudioOpen(true)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Critical & High Risks"
          value={result ? criticalCount : 0}
          subtitle={result ? "From uploaded company data" : "Upload data to classify risks"}
          change={result ? `${selected.length} selected for remediation` : "No dataset analyzed"}
          isPositive={false}
          icon={AlertTriangle}
          variant="critical"
        />
        <StatCard
          title="Total Current Risk"
          value={result ? result.total_current_risk : "—"}
          subtitle="Portfolio risk before remediation"
          change={
            result
              ? `${reductionVal > 0 ? reductionVal.toFixed(2) : "0.00"} modeled reduction`
              : "Awaiting company dataset"
          }
          isPositive={true}
          icon={ShieldAlert}
          variant="warning"
        />
        <StatCard
          title="Modeled Risk Reduction"
          value={result ? `${result.overall_risk_reduction_percent}%` : "—"}
          subtitle="After selected remediation"
          change={result ? "Budget-constrained recommendation" : "Calculated after upload"}
          isPositive={true}
          icon={TrendingDown}
          variant="success"
        />
        <StatCard
          title="Recommended Investment"
          value={result ? money(recInvestment) : "—"}
          subtitle="Remediation spend selected"
          change={result && availBudget > 0 ? `${budgetUse}% of available budget` : "No budget supplied"}
          isPositive={true}
          icon={Coins}
          variant="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AllocationCard
          label="Available Budget"
          value={result ? money(result.available_budget) : "—"}
          detail="From uploaded dataset"
          tone="blue"
        />
        <AllocationCard
          label="Allocated to Remediation"
          value={result ? money(recInvestment) : "—"}
          detail={`${selected.length} selected risk${selected.length === 1 ? "" : "s"}`}
          tone="cyan"
        />
        <AllocationCard
          label="Remaining Budget"
          value={result ? money(result.remaining_budget) : "—"}
          detail="Unallocated after recommendation"
          tone="emerald"
        />
        <AllocationCard
          label="Largest Risk Allocation"
          value={result ? money(highestAllocation) : "—"}
          detail="Highest selected remediation cost"
          tone="violet"
        />
        <AllocationCard
          label="Deferred Risks"
          value={result ? deferred.length : "—"}
          detail="Outside the budget-feasible portfolio"
          tone="amber"
        />
      </div>

      <RealDataStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onComplete={load}
      />
    </PageShell>
  );
}

function AllocationCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "blue" | "cyan" | "emerald" | "violet" | "amber";
}) {
  const tones = {
    blue: "text-blue-400",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    violet: "text-violet-300",
    amber: "text-amber-300",
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}
