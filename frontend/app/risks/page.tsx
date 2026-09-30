"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Scale, CheckCircle2, Clock } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface RiskRow {
  risk_id: string;
  risk_name: string;
  asset?: string;
  asset_name?: string;
  severity?: string;
  current_risk: number;
  expected_residual_risk: number;
  risk_reduction?: number;
  expected_risk_reduction_percent?: number;
  projected_untreated_risk?: number;
  projected_untreated_risk_increase_percent?: number;
  remediation_cost?: number;
  allocated_budget?: number;
  optimization_state?: string;
}

export default function RiskRegisterPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [baselineRisks, setBaselineRisks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const load = () => {
    api.getLatestDatasetAnalysis().then((data: any) => {
      setAnalysis(data);
      if (!data || !Array.isArray(data.valid_records) || data.valid_records.length === 0) {
        setBaselineRisks([]);
      }
    });
  };

  useEffect(() => {
    load();
    const handleOptimizerUpdate = () => load();
    const handleReset = () => {
      setAnalysis(null);
      setBaselineRisks([]);
      load();
    };
    window.addEventListener("crisp_budget_optimizer_updated", handleOptimizerUpdate);
    window.addEventListener("crisp_dataset_uploaded", handleOptimizerUpdate);
    window.addEventListener("crisp_data_reset", handleReset);
    window.addEventListener("storage", handleOptimizerUpdate);
    return () => {
      window.removeEventListener("crisp_budget_optimizer_updated", handleOptimizerUpdate);
      window.removeEventListener("crisp_dataset_uploaded", handleOptimizerUpdate);
      window.removeEventListener("crisp_data_reset", handleReset);
      window.removeEventListener("storage", handleOptimizerUpdate);
    };
  }, []);

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

  const rawList: RiskRow[] = useMemo(() => {
    // Read local optimizer allocations map
    const allocMap = new Map<string, any>();
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("crisp_budget_optimizer_state_v1") : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.result?.all_risk_allocations) {
          parsed.result.all_risk_allocations.forEach((a: any) => {
            allocMap.set(String(a.risk_id), a);
          });
        }
      }
    } catch {}

    // Also overlay analysis.optimization if available
    const opt = analysis?.optimization;
    if (opt?.selected_risks) {
      opt.selected_risks.forEach((s: any) => {
        const id = String(s.risk_id || s.id);
        if (!allocMap.has(id)) {
          allocMap.set(id, { ...s, optimization_state: "Selected for Remediation" });
        }
      });
    }
    if (opt?.deferred_risks) {
      opt.deferred_risks.forEach((d: any) => {
        const id = String(d.risk_id || d.id);
        if (!allocMap.has(id)) {
          allocMap.set(id, { ...d, optimization_state: "Deferred" });
        }
      });
    }

    if (analysis && Array.isArray(analysis.valid_records) && analysis.valid_records.length > 0) {
      return analysis.valid_records.map((r: any) => {
        const alloc = allocMap.get(String(r.risk_id || r.id));
        const curRisk = Number(r.current_risk ?? r.residual_risk ?? 40);
        const resRisk = Number(alloc?.post_remediation_risk ?? r.expected_residual_risk ?? (curRisk * 0.4));
        const remCost = Number(alloc?.remediation_cost ?? r.remediation_cost ?? 0);
        const optState = alloc?.optimization_state ?? r.optimization_state;
        const allocatedBudget = Number(
          alloc?.allocated_budget ??
            r.allocated_budget ??
            (optState === "Selected for Remediation" ? remCost : 0)
        );

        return {
          risk_id: r.risk_id || r.id,
          risk_name: r.risk_name || r.title || r.name,
          asset: r.asset_name || r.asset || "Enterprise Asset",
          asset_name: r.asset_name || r.asset || "Enterprise Asset",
          severity: getSeverity(r),
          current_risk: curRisk,
          expected_residual_risk: resRisk,
          remediation_cost: remCost,
          allocated_budget: allocatedBudget,
          optimization_state: optState,
          expected_risk_reduction_percent: Number(
            alloc?.expected_risk_reduction_percent ??
              r.expected_risk_reduction_percent ??
              (curRisk > 0 ? (((curRisk - resRisk) / curRisk) * 100).toFixed(1) : 0)
          ),
          projected_untreated_risk: Number(
            r.projected_untreated_risk ?? (curRisk * 1.15).toFixed(1)
          ),
          projected_untreated_risk_increase_percent: Number(
            r.projected_untreated_risk_increase_percent ?? 15
          ),
        };
      });
    }

    // Baseline seeded risks fallback
    return baselineRisks.map((r: any) => {
      const alloc = allocMap.get(String(r.id));
      const curRisk = Number(r.residual_risk || 40);
      const resRisk = Number(alloc?.post_remediation_risk ?? curRisk * 0.4);
      const remCost = Number(alloc?.remediation_cost ?? 400000);
      const optState = alloc?.optimization_state;
      const allocatedBudget = Number(
        alloc?.allocated_budget ?? (optState === "Selected for Remediation" ? remCost : 0)
      );

      return {
        risk_id: r.id,
        risk_name: r.vulnerability_name || r.name || r.id,
        asset: r.asset_name || "Enterprise Asset",
        asset_name: r.asset_name || "Enterprise Asset",
        severity: getSeverity(r),
        current_risk: curRisk,
        expected_residual_risk: resRisk,
        remediation_cost: remCost,
        allocated_budget: allocatedBudget,
        optimization_state: optState,
        expected_risk_reduction_percent: Number(alloc?.expected_risk_reduction_percent ?? 60),
        projected_untreated_risk: Number(((curRisk) * 1.15).toFixed(1)),
        projected_untreated_risk_increase_percent: 15,
      };
    });
  }, [analysis, baselineRisks]);

  const rows = useMemo(() => {
    return rawList
      .filter((r) => {
        const matchesSev =
          severityFilter === "all" || r.severity?.toUpperCase() === severityFilter.toUpperCase();
        const searchStr = `${r.risk_name} ${r.asset_name || r.asset || ""} ${r.risk_id}`.toLowerCase();
        return matchesSev && searchStr.includes(search.toLowerCase());
      })
      .sort((a, b) => b.current_risk - a.current_risk);
  }, [rawList, search, severityFilter]);

  const hasOptimizerState = rows.some((r) => r.optimization_state);

  return (
    <PageShell
      title="Organizational Risk Register"
      description="Current, residual, and budget-optimized risk remediation state."
      onOpenStudio={() => setOpen(true)}
    >
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-9 bg-slate-950 border-slate-700/80 text-xs"
                placeholder="Search risks, assets, or IDs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border-slate-700/80 text-xs"
              >
                <option value="all">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
          </div>
          {hasOptimizerState && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              <Scale className="w-3.5 h-3.5" />
              <span>Synchronized with Budget Optimizer</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {rows.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <TableHead className="py-3 px-4">Risk Item</TableHead>
                    <TableHead className="py-3 px-3">Asset</TableHead>
                    <TableHead className="py-3 px-3">Severity</TableHead>
                    <TableHead className="py-3 px-3 text-right">Current Risk</TableHead>
                    <TableHead className="py-3 px-3 text-right">Residual Risk</TableHead>
                    <TableHead className="py-3 px-3 text-right">Remediation Cost</TableHead>
                    {hasOptimizerState && (
                      <TableHead className="py-3 px-3 text-right">Allocated Budget</TableHead>
                    )}
                    {hasOptimizerState && <TableHead className="py-3 px-3">Optimizer Status</TableHead>}
                    <TableHead className="py-3 px-3 text-right">Reduction</TableHead>
                    <TableHead className="py-3 px-3 text-right">Untreated Projection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60 text-xs">
                  {rows.map((r: RiskRow) => {
                    const isSelected = r.optimization_state === "Selected for Remediation";
                    return (
                      <TableRow key={r.risk_id} className="hover:bg-slate-800/40">
                        <TableCell className="py-3.5 px-4 font-medium text-slate-100 max-w-[260px]">
                          <div className="truncate font-semibold">{r.risk_name}</div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{r.risk_id}</p>
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-slate-200">
                          {r.asset_name || r.asset || "Enterprise Asset"}
                        </TableCell>
                        <TableCell className="py-3.5 px-3">
                          <Badge
                            variant={
                              r.severity === "CRITICAL"
                                ? "critical"
                                : r.severity === "HIGH"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {r.severity || "MEDIUM"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-right font-mono text-slate-200 font-semibold">
                          {r.current_risk}
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-right font-mono text-slate-200">
                          {r.expected_residual_risk}
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-right font-mono text-slate-200 whitespace-nowrap">
                          {formatCurrency(r.remediation_cost || 0)}
                        </TableCell>
                        {hasOptimizerState && (
                          <TableCell className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <span className={isSelected ? "text-emerald-400 font-bold" : "text-slate-400"}>
                              {formatCurrency(r.allocated_budget || 0)}
                            </span>
                          </TableCell>
                        )}
                        {hasOptimizerState && (
                          <TableCell className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                isSelected
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                                  : r.optimization_state === "Deferred"
                                  ? "bg-amber-500/15 text-amber-300 border-amber-500/35"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {r.optimization_state || "Baseline"}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="py-3.5 px-3 text-right text-blue-400 font-semibold">
                          {r.expected_risk_reduction_percent}%
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          {r.projected_untreated_risk}{" "}
                          <span className="text-[10px] text-amber-400">
                            +{r.projected_untreated_risk_increase_percent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-slate-300 text-sm">No risk records match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <RealDataStudioModal isOpen={open} onClose={() => setOpen(false)} onComplete={load} />
    </PageShell>
  );
}
