"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Scale } from "lucide-react";
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

interface VulnerabilityRow {
  risk_id: string;
  risk_name: string;
  asset?: string;
  asset_name?: string;
  cve_id?: string;
  cvss_score?: number;
  severity?: string;
  remediation_cost?: number;
  allocated_budget?: number;
  optimization_state?: string;
  expected_risk_reduction_percent?: number;
}

export default function VulnerabilitiesPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [baselineVulns, setBaselineVulns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [open, setOpen] = useState(false);

  const load = () => {
    api.getLatestDatasetAnalysis().then((data: any) => {
      setAnalysis(data);
      if (!data || !Array.isArray(data.valid_records) || data.valid_records.length === 0) {
        setBaselineVulns([]);
      }
    });
  };

  useEffect(() => {
    load();
    const handleOptimizerUpdate = () => load();
    const handleReset = () => {
      setAnalysis(null);
      setBaselineVulns([]);
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

  const rawList: VulnerabilityRow[] = useMemo(() => {
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
        const remCost = Number(alloc?.remediation_cost ?? r.remediation_cost ?? 0);
        const optState = alloc?.optimization_state ?? r.optimization_state;
        const allocatedBudget = Number(
          alloc?.allocated_budget ??
            r.allocated_budget ??
            (optState === "Selected for Remediation" ? remCost : 0)
        );

        return {
          risk_id: r.risk_id || r.id,
          risk_name: r.risk_name || r.vulnerability_name || r.name,
          asset: r.asset_name || r.asset || "Enterprise Asset",
          asset_name: r.asset_name || r.asset || "Enterprise Asset",
          cve_id: r.cve_id,
          cvss_score: r.cvss_score !== undefined && r.cvss_score !== null ? Number(r.cvss_score) : undefined,
          severity: getSeverity(r),
          remediation_cost: remCost,
          allocated_budget: allocatedBudget,
          optimization_state: optState,
          expected_risk_reduction_percent: Number(
            alloc?.expected_risk_reduction_percent ??
              r.expected_risk_reduction_percent ??
              (r.current_risk > 0
                ? (((r.current_risk - (r.expected_residual_risk ?? 0)) / r.current_risk) * 100).toFixed(1)
                : 0)
          ),
        };
      });
    }

    return baselineVulns.map((v: any) => {
      const alloc = allocMap.get(String(v.id));
      const remCost = Number(alloc?.remediation_cost ?? 500000);
      const optState = alloc?.optimization_state;
      const allocatedBudget = Number(
        alloc?.allocated_budget ?? (optState === "Selected for Remediation" ? remCost : 0)
      );

      return {
        risk_id: v.id,
        risk_name: v.name,
        asset: v.asset_name || "Enterprise Asset",
        asset_name: v.asset_name || "Enterprise Asset",
        cve_id: v.cve_id,
        cvss_score: v.cvss_score ? Number(v.cvss_score) : undefined,
        severity: getSeverity(v),
        remediation_cost: remCost,
        allocated_budget: allocatedBudget,
        optimization_state: optState,
        expected_risk_reduction_percent: Number(alloc?.expected_risk_reduction_percent ?? 65),
      };
    });
  }, [analysis, baselineVulns]);

  const rows = useMemo(() => {
    return rawList
      .filter((r) => {
        const matchesSev =
          severity === "all" || r.severity?.toUpperCase() === severity.toUpperCase();
        const searchStr = `${r.risk_id} ${r.risk_name} ${r.cve_id || ""} ${r.asset_name || r.asset || ""}`.toLowerCase();
        return matchesSev && searchStr.includes(search.toLowerCase());
      })
      .sort((a, b) => (b.cvss_score || 0) - (a.cvss_score || 0));
  }, [rawList, search, severity]);

  const hasOptimizerState = rows.some((r) => r.optimization_state);

  return (
    <PageShell
      title="Vulnerability Management"
      description="CVE profiles, CVSS metrics, and budget remediation allocations from the active dataset."
      onOpenStudio={() => setOpen(true)}
    >
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-9 bg-slate-950 border-slate-700/80 text-xs"
                placeholder="Search CVE, risk, or asset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
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
              <span>Remediation Allocations Active</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {rows.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <TableHead className="py-3 px-4">Vulnerability / CVE</TableHead>
                    <TableHead className="py-3 px-3">Target Asset</TableHead>
                    <TableHead className="py-3 px-3 text-right">CVSS</TableHead>
                    <TableHead className="py-3 px-3">Severity</TableHead>
                    <TableHead className="py-3 px-3 text-right">Remediation Cost</TableHead>
                    {hasOptimizerState && (
                      <TableHead className="py-3 px-3 text-right">Allocated Budget</TableHead>
                    )}
                    {hasOptimizerState && <TableHead className="py-3 px-3">Status</TableHead>}
                    <TableHead className="py-3 px-3 text-right">Modeled Reduction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60 text-xs">
                  {rows.map((r: VulnerabilityRow) => {
                    const isSelected = r.optimization_state === "Selected for Remediation";
                    return (
                      <TableRow key={r.risk_id} className="hover:bg-slate-800/40">
                        <TableCell className="py-3.5 px-4 font-medium text-slate-100 max-w-[260px]">
                          <div className="truncate font-semibold">{r.risk_name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {r.cve_id && (
                              <span className="text-[11px] font-mono text-cyan-400 font-medium">
                                {r.cve_id}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">({r.risk_id})</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-slate-200">
                          {r.asset_name || r.asset || "Enterprise Asset"}
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-right font-mono font-bold text-slate-200">
                          {r.cvss_score !== undefined ? r.cvss_score.toFixed(1) : "—"}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-slate-300 text-sm">No vulnerability records match your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <RealDataStudioModal isOpen={open} onClose={() => setOpen(false)} onComplete={load} />
    </PageShell>
  );
}
