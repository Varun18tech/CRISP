"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileWarning } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function DataQualityPage() {
  const [analysis, setAnalysis] = useState<any>(null); const [open, setOpen] = useState(false);
  const load = () => api.getLatestDatasetAnalysis().then(setAnalysis);
  useEffect(() => { load(); }, []);
  return <PageShell title="Data quality" description="Validation results from the latest company dataset upload." onOpenStudio={() => setOpen(true)}>
    <Card><CardHeader><CardTitle>Upload validation</CardTitle><CardDescription>CRISP preserves valid records and reports rows it could not safely analyze.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Status icon={CheckCircle2} label="Valid records" value={analysis?.valid_count ?? 0} color="text-emerald-300" /><Status icon={FileWarning} label="Excluded records" value={analysis?.invalid_count ?? 0} color="text-amber-300" /></CardContent></Card>
    {analysis?.source_files?.length > 0 && <Card><CardHeader><CardTitle>Analyzed files</CardTitle></CardHeader><CardContent className="text-sm text-slate-300">{analysis.source_files.join(", ")}</CardContent></Card>}
    {analysis?.invalid_records?.length > 0 && <Card><CardHeader><CardTitle>Records requiring attention</CardTitle></CardHeader><CardContent className="space-y-2">{analysis.invalid_records.map((item: any, index: number) => <div key={index} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100">{item.file ? `${item.file}: ` : ""}{item.line ? `Line ${item.line}: ` : ""}{item.message}</div>)}</CardContent></Card>}
    <RealDataStudioModal isOpen={open} onClose={() => setOpen(false)} onComplete={load} />
  </PageShell>;
}
function Status({ icon: Icon, label, value, color }: { icon: typeof CheckCircle2; label: string; value: number; color: string }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4"><Icon className={`h-5 w-5 ${color}`} /><div><p className="text-xs text-slate-400">{label}</p><p className="text-xl font-semibold text-slate-100">{value}</p></div></div>; }
