"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Scale } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface AssetRisk {
  risk_id?: string;
  risk_name?: string;
  asset?: string;
  asset_name?: string;
  current_risk?: number;
  residual_risk?: number;
  business_criticality?: number;
  projected_untreated_risk?: number;
  severity?: string;
  optimization_state?: string;
  allocated_budget?: number;
}

export default function AssetsPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [baselineAssets, setBaselineAssets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const load = () => {
    api.getLatestDatasetAnalysis().then((data: any) => {
      setAnalysis(data);
      if (!data || !Array.isArray(data.valid_records) || data.valid_records.length === 0) {
        api.getAssets().then((demo: any) => {
          if (Array.isArray(demo)) setBaselineAssets(demo);
        });
      }
    });
  };

  useEffect(() => {
    load();
    const handleOptimizerUpdate = () => load();
    window.addEventListener("crisp_budget_optimizer_updated", handleOptimizerUpdate);
    window.addEventListener("storage", handleOptimizerUpdate);
    return () => {
      window.removeEventListener("crisp_budget_optimizer_updated", handleOptimizerUpdate);
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

  const rows = useMemo(() => {
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

    const map = new Map<string, AssetRisk[]>();

    if (analysis && Array.isArray(analysis.valid_records) && analysis.valid_records.length > 0) {
      analysis.valid_records.forEach((r: any) => {
        const key = r.asset_name || r.asset || "Enterprise Asset";
        const alloc = allocMap.get(String(r.risk_id || r.id));
        const remCost = Number(alloc?.remediation_cost ?? r.remediation_cost ?? 0);
        const optState = alloc?.optimization_state ?? r.optimization_state;
        const allocatedBudget = Number(
          alloc?.allocated_budget ??
            r.allocated_budget ??
            (optState === "Selected for Remediation" ? remCost : 0)
        );

        map.set(key, [
          ...(map.get(key) || []),
          {
            ...r,
            asset: key,
            asset_name: key,
            severity: getSeverity(r),
            optimization_state: optState,
            allocated_budget: allocatedBudget,
          },
        ]);
      });
    } else if (baselineAssets.length > 0) {
      baselineAssets.forEach((a: any) => {
        map.set(a.name, [
          {
            asset: a.name,
            asset_name: a.name,
            severity: (a.criticality || "MEDIUM").toUpperCase(),
            business_criticality: a.data_sensitivity || 70,
            projected_untreated_risk: Number(a.max_residual_risk || 30),
          },
        ]);
      });
    }

    return [...map].filter(([name]) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [analysis, baselineAssets, search]);

  const hasOptimizerState = rows.some(([, risks]) =>
    risks.some((r) => r.optimization_state)
  );

  return (
    <PageShell
      title="Asset Inventory"
      description="Assets and exposure profiles synchronized with the active risk dataset and Budget Optimizer."
      onOpenStudio={() => setOpen(true)}
    >
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-9 bg-slate-950 border-slate-700/80 text-xs"
              placeholder="Search enterprise assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                    <TableHead className="py-3 px-4">Asset Name</TableHead>
                    <TableHead className="py-3 px-3 text-center">Mapped Risks</TableHead>
                    <TableHead className="py-3 px-3">Highest Severity</TableHead>
                    <TableHead className="py-3 px-3">Criticality</TableHead>
                    <TableHead className="py-3 px-3">Projected Untreated Risk</TableHead>
                    {hasOptimizerState && (
                      <TableHead className="py-3 px-3">Remediation Coverage</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/60 text-xs">
                  {rows.map(([name, risks]) => {
                    const sev = risks.some((r) => r.severity === "CRITICAL")
                      ? "CRITICAL"
                      : risks.some((r) => r.severity === "HIGH")
                      ? "HIGH"
                      : "MEDIUM";
                    const maxCrit = Math.max(
                      ...risks.map((r) => r.business_criticality || 0)
                    );

                    const getUntreated = (r: AssetRisk) => {
                      if (r.projected_untreated_risk !== undefined && Number(r.projected_untreated_risk) > 0) {
                        return Number(r.projected_untreated_risk);
                      }
                      const cur = Number(r.current_risk || 0);
                      if (cur > 0) {
                        const threat = Number((r as any).threat_activity ?? 50);
                        const expo = Number((r as any).exposure ?? 50);
                        const crit = Number(r.business_criticality ?? 50);
                        const growth = Math.min(0.50, 0.03 + (threat / 1000) + (expo / 2000) + (crit / 4000));
                        return Number((cur * (1 + growth)).toFixed(2));
                      }
                      return 0;
                    };

                    const maxUntreated = Math.max(0, ...risks.map(getUntreated));
                    const maxCurrent = Math.max(0, ...risks.map((r) => Number(r.current_risk || 0)));
                    const pctIncrease =
                      maxCurrent > 0 && maxUntreated > maxCurrent
                        ? Number((((maxUntreated - maxCurrent) / maxCurrent) * 100).toFixed(0))
                        : 15;

                    const selectedCount = risks.filter(
                      (r) => r.optimization_state === "Selected for Remediation"
                    ).length;

                    return (
                      <TableRow key={name} className="hover:bg-slate-800/40">
                        <TableCell className="py-3.5 px-4 font-semibold text-slate-100">
                          {name}
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-center font-mono font-bold text-slate-200">
                          {risks.length}
                        </TableCell>
                        <TableCell className="py-3.5 px-3">
                          <Badge
                            variant={
                              sev === "CRITICAL"
                                ? "critical"
                                : sev === "HIGH"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {sev}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5 px-3 text-slate-300">
                          {maxCrit > 0 ? `${maxCrit} pts` : "Standard"}
                        </TableCell>
                        <TableCell className="py-3.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {maxUntreated > 0 ? (
                            <span>
                              {maxUntreated.toFixed(2)}{" "}
                              <span className="text-[10px] text-amber-400 font-sans">
                                (+{pctIncrease}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </TableCell>
                        {hasOptimizerState && (
                          <TableCell className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                selectedCount > 0
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                                  : "bg-amber-500/15 text-amber-300 border-amber-500/35"
                              }`}
                            >
                              {selectedCount > 0
                                ? `${selectedCount}/${risks.length} Funded`
                                : "Deferred"}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="font-medium text-slate-200">No asset records available</p>
              <p className="mt-1 text-xs text-slate-400">
                Upload a dataset to map risks and budget allocations to enterprise assets.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <RealDataStudioModal isOpen={open} onClose={() => setOpen(false)} onComplete={load} />
    </PageShell>
  );
}
