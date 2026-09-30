"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusCircle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { ExecutiveProfitSimulator } from "@/components/charts/ExecutiveProfitSimulator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface PortfolioItem {
  id: string;
  title: string;
  asset: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  remediation_cost: number;
  current_risk: number;
  risk_reduction: number;
  eal_saved: number;
}

const DEFAULT_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "rsk_1",
    title: "Payment Gateway Emergency Patch & Zero-Trust Verification",
    asset: "Payment Processing Gateway API",
    severity: "CRITICAL",
    remediation_cost: 500000,
    current_risk: 52.03,
    risk_reduction: 28.5,
    eal_saved: 8500000,
  },
  {
    id: "rsk_2",
    title: "Database Confidential Computing & PII Tokenization",
    asset: "Primary Customer Core Database",
    severity: "CRITICAL",
    remediation_cost: 1500000,
    current_risk: 55.08,
    risk_reduction: 32.0,
    eal_saved: 9500000,
  },
  {
    id: "rsk_3",
    title: "Next-Gen API Shield & Managed Behavioral WAF",
    asset: "Payment Processing Gateway API",
    severity: "HIGH",
    remediation_cost: 1200000,
    current_risk: 42.65,
    risk_reduction: 24.0,
    eal_saved: 7200000,
  },
  {
    id: "rsk_4",
    title: "Cloud Storage IAM Hardening & Object ACL Enforcement",
    asset: "Customer Documents S3/GCS Bucket",
    severity: "HIGH",
    remediation_cost: 650000,
    current_risk: 33.05,
    risk_reduction: 19.5,
    eal_saved: 3000000,
  },
  {
    id: "rsk_5",
    title: "Endpoint Kernel Patching & Automated EDR Response",
    asset: "Staff Enterprise Laptops Fleet",
    severity: "MEDIUM",
    remediation_cost: 350000,
    current_risk: 16.18,
    risk_reduction: 14.0,
    eal_saved: 3200000,
  },
  {
    id: "rsk_6",
    title: "Enterprise Spear-Phishing & Social Engineering Drills",
    asset: "Global Operations Admin Portal",
    severity: "MEDIUM",
    remediation_cost: 400000,
    current_risk: 26.83,
    risk_reduction: 11.5,
    eal_saved: 1800000,
  },
];

export default function InvestmentsPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [datasetBudget, setDatasetBudget] = useState<number>(2500000);

  const load = () =>
    api.getLatestDatasetAnalysis().then((data: any) => {
      if (data && Array.isArray(data.valid_records) && data.valid_records.length > 0) {
        setAnalysis(data);
        setDatasetBudget(data?.optimization?.available_budget || 2500000);
      } else {
        setAnalysis(null);
      }
    });

  useEffect(() => {
    load();
  }, []);

  const hasUploadedData = Boolean(
    analysis && Array.isArray(analysis.valid_records) && analysis.valid_records.length > 0
  );

  const risks: PortfolioItem[] = useMemo(() => {
    if (hasUploadedData) {
      return analysis.valid_records.map((r: any, idx: number) => ({
        id: r.risk_id || `upl_${idx}`,
        title: r.risk_title || r.vulnerability_name || r.asset_name || `Risk Item #${idx + 1}`,
        asset: r.asset_name || "Enterprise Asset",
        severity: (r.severity || "HIGH").toUpperCase(),
        remediation_cost: Number(r.remediation_cost) || 400000,
        current_risk: Number(r.current_risk) || 40,
        risk_reduction: Number(r.risk_reduction) || 20,
        eal_saved: Number(r.risk_reduction || 20) * 250000,
      }));
    }
    return DEFAULT_PORTFOLIO_ITEMS;
  }, [analysis, hasUploadedData]);

  const maxTotalCost = useMemo(
    () => Math.max(risks.reduce((sum, r) => sum + (r.remediation_cost || 0), 0), 1000000),
    [risks]
  );

  const datasetResult = useMemo(() => {
    // Sort by highest risk_reduction per rupee (ROI efficiency), then total reduction
    const ordered = [...risks].sort((a, b) => {
      const effA = (a.risk_reduction || 0) / Math.max(a.remediation_cost || 1, 1);
      const effB = (b.risk_reduction || 0) / Math.max(b.remediation_cost || 1, 1);
      if (Math.abs(effB - effA) > 1e-9) return effB - effA;
      return (b.risk_reduction || 0) - (a.risk_reduction || 0);
    });

    let spend = 0;
    let reduction = 0;
    let ealSaved = 0;
    const selectedIds = new Set<string>();

    for (const r of ordered) {
      if (spend + (r.remediation_cost || 0) <= datasetBudget) {
        spend += r.remediation_cost || 0;
        reduction += r.risk_reduction || 0;
        ealSaved += r.eal_saved || 0;
        selectedIds.add(r.id);
      }
    }

    const totalCurrentRisk = risks.reduce((t, r) => t + (r.current_risk || 0), 0);
    const totalPossibleReduction = risks.reduce((t, r) => t + (r.risk_reduction || 0), 0);
    const reductionPct = totalCurrentRisk > 0 ? (reduction / totalCurrentRisk) * 100 : 0;
    const coveragePct = totalPossibleReduction > 0 ? (reduction / totalPossibleReduction) * 100 : 0;

    return {
      spend,
      reduction,
      ealSaved,
      count: selectedIds.size,
      selectedIds,
      ordered,
      totalCurrentRisk,
      reductionPct,
      coveragePct,
      remaining: Math.max(0, datasetBudget - spend),
    };
  }, [risks, datasetBudget]);

  return (
    <PageShell
      title="Investment Optimization & Capital Allocation"
      description="Model security initiatives, calculate expected loss reduction, and compare decision scenarios"
      onOpenStudio={() => setOpen(true)}
      actions={
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Real Investment</span>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* 1. Executive Interactive Sliders & Profit Simulator */}
        <ExecutiveProfitSimulator />

        {/* 2. Dataset-Based Authoritative Allocation Scenario */}
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base text-slate-100">
                Dataset Portfolio Allocation Scenario
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate dynamic budget changes across {risks.length} prioritized company risk initiatives
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-lg font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {hasUploadedData ? "Uploaded Company Dataset" : "Enterprise Portfolio Model"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* Interactive Budget Slider */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="mb-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">
                  Available Cybersecurity Dataset Budget
                </span>
                <output className="text-sm font-bold text-cyan-300 font-mono" aria-live="polite">
                  {formatCurrency(datasetBudget)}
                </output>
              </div>
              <input
                aria-label="Scenario cybersecurity budget"
                type="range"
                min={0}
                max={maxTotalCost}
                step={50000}
                value={datasetBudget}
                onChange={(e) => setDatasetBudget(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-medium">
                <span>₹0 (Unfunded)</span>
                <span>Midpoint ({formatCurrency(Math.round(maxTotalCost / 2))})</span>
                <span>Full Portfolio ({formatCurrency(maxTotalCost)})</span>
              </div>
            </div>

            {/* 4 Key Scenario Metrics */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Scenario Spend"
                value={formatCurrency(datasetResult.spend)}
                sub={`${Math.round((datasetResult.spend / Math.max(datasetBudget, 1)) * 100)}% of budget utilized`}
                tone="cyan"
              />
              <Metric
                label="Remaining Budget"
                value={formatCurrency(datasetResult.remaining)}
                sub="Unallocated reserve capital"
                tone="emerald"
              />
              <Metric
                label="Selected Risks"
                value={`${datasetResult.count} of ${risks.length}`}
                sub={`${risks.length - datasetResult.count} deferred by budget`}
                tone="blue"
              />
              <Metric
                label="Modeled Reduction"
                value={`${datasetResult.reductionPct.toFixed(1)}%`}
                sub={`${datasetResult.coveragePct.toFixed(0)}% of max reducible risk`}
                tone="purple"
              />
            </div>

            {/* Prioritized Risk Initiatives Breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Prioritized Remediation Queue (Ranked by ROI Efficiency)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Est. EAL Preserved: {formatCurrency(datasetResult.ealSaved)}
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {datasetResult.ordered.map((item) => {
                  const isSelected = datasetResult.selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-100"
                          : "bg-slate-950/40 border-slate-800/70 text-slate-400 opacity-75"
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <p className="text-xs font-semibold truncate">{item.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate pl-6">{item.asset}</p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-xs font-mono font-bold text-slate-200">
                          {formatCurrency(item.remediation_cost)}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {isSelected ? "Funded" : "Deferred"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RealDataStudioModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onComplete={load}
      />
    </PageShell>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "cyan" | "emerald" | "blue" | "purple";
}) {
  const tones = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className={`text-[10px] uppercase font-semibold tracking-wider ${tones[tone]}`}>{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-100 font-mono">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}
