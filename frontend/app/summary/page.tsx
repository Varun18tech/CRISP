"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, WalletCards } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function SummaryPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const load = () => api.getLatestDatasetAnalysis().then(setAnalysis);
  useEffect(() => { load(); }, []);
  const result = analysis?.optimization;

  return <PageShell title="Company risk summary" description="A deterministic summary of the latest uploaded company dataset." onOpenStudio={() => setOpen(true)}>
    {!result ? <Card><CardContent className="py-14 text-center"><BarChart3 className="mx-auto mb-3 h-8 w-8 text-blue-400" /><p className="font-semibold text-slate-100">No company dataset has been analyzed</p><p className="mt-2 text-sm text-slate-400">Use ADD DATA to upload the organization’s risk records.</p></CardContent></Card> : <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={WalletCards} label="Available budget" value={result.available_budget} />
        <Metric icon={ShieldCheck} label="Recommended investment" value={result.recommended_total_investment} />
        <Metric icon={BarChart3} label="Modeled risk reduction" value={`${result.overall_risk_reduction_percent}%`} />
      </div>
      <Card><CardHeader><CardTitle>Recommendation</CardTitle><CardDescription>Generated from remediation cost, current risk, residual risk, and business criticality in the uploaded data.</CardDescription></CardHeader><CardContent className="text-sm leading-6 text-slate-300">{result.recommendation}</CardContent></Card>
      <Card><CardHeader><CardTitle>Selected remediation portfolio</CardTitle><CardDescription>{result.selected_risks.length} risk item(s) fit the supplied budget.</CardDescription></CardHeader><CardContent className="space-y-2">{result.selected_risks.map((risk: any) => <RiskRow key={risk.risk_id} risk={risk} selected />)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Deferred risks</CardTitle><CardDescription>These items remain in the projected untreated-risk scenario.</CardDescription></CardHeader><CardContent className="space-y-2">{result.deferred_risks.map((risk: any) => <RiskRow key={risk.risk_id} risk={risk} />)}</CardContent></Card>
    </div>}
    <RealDataStudioModal isOpen={open} onClose={() => setOpen(false)} onComplete={load} />
  </PageShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string | number }) { return <Card><CardContent className="flex items-center gap-3 p-5"><Icon className="h-5 w-5 text-cyan-300" /><div><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold text-slate-100">{value}</p></div></CardContent></Card>; }
function RiskRow({ risk, selected = false }: { risk: any; selected?: boolean }) { return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm"><div><p className="font-medium text-slate-100">{risk.risk_name}</p><p className="text-xs text-slate-400">{risk.risk_id} · {risk.severity || "Unclassified"}</p></div><p className={selected ? "text-emerald-300" : "text-amber-300"}>{selected ? `${risk.expected_risk_reduction_percent}% reduction` : `${risk.projected_untreated_risk_increase_percent}% projected increase`}</p></div>; }
