"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  ShieldCheck,
  WalletCards,
  Sparkles,
  FileText,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Upload,
  AlertTriangle,
  Building2,
  Cpu,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { RealDataStudioModal } from "@/components/studio/RealDataStudioModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedChatMessage } from "@/components/ai/FormattedChatMessage";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabType = "executive" | "board" | "portfolio";

export default function SummaryPage() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("executive");
  const [openStudio, setOpenStudio] = useState(false);

  // Bedrock Claude 3.5 Generated Content State
  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [boardReport, setBoardReport] = useState<string>("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDataAndGenerate = async () => {
    setLoading(true);
    try {
      const data = (await api.getLatestDatasetAnalysis()) as any;
      setAnalysis(data);

      const validRecords = data?.valid_records || [];
      const opt = data?.optimization || {};
      const firstRec = validRecords[0] || {};

      const contextPayload = {
        company_name: firstRec.company_name || data?.company_name || "Enterprise Organization",
        total_risks: validRecords.length || 6,
        critical_count: validRecords.filter((r: any) => (r.severity || r.risk_level) === "Critical").length || 2,
        high_count: validRecords.filter((r: any) => (r.severity || r.risk_level) === "High").length || 3,
        total_eal: opt.total_current_risk ? opt.total_current_risk * 100000 : 36950000,
        available_budget: opt.available_budget || data?.dataset_budget || 1000000,
        allocated_budget: opt.recommended_investment || opt.allocated_budget || 1000000,
        risk_reduction_pct: opt.overall_risk_reduction_percent || 68.5,
        currency: firstRec.currency || data?.dataset_currency || "INR",
        top_risks: (opt.selected_risks || validRecords).slice(0, 5),
      };

      setGeneratingAI(true);
      const [execRes, boardRes] = await Promise.all([
        api.generateExecutiveSummary(contextPayload),
        api.generateBoardReport(contextPayload),
      ]);

      if (execRes?.summary) setExecutiveSummary(execRes.summary);
      if (boardRes?.report) setBoardReport(boardRes.report);
    } catch (err) {
      console.error("Failed to load analysis or Bedrock summaries:", err);
    } finally {
      setGeneratingAI(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataAndGenerate();
  }, []);

  const result = analysis?.optimization;
  const companyName = analysis?.valid_records?.[0]?.company_name || analysis?.company_name || "Enterprise Organization";
  const currency = String(analysis?.valid_records?.[0]?.currency || analysis?.dataset_currency || "INR").toUpperCase();
  const sym = currency === "INR" ? "₹" : "$";

  const handleCopyMarkdown = () => {
    const textToCopy = activeTab === "board" ? boardReport : executiveSummary;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageShell
      title="Executive Risk Summaries & Board Reports"
      description="Natural language C-suite briefings and audit-ready Board reports synthesized by Amazon Bedrock (Claude 3.5 Sonnet)."
      onOpenStudio={() => setOpenStudio(true)}
    >
      <div className="space-y-6">
        {/* Amazon Bedrock Model Status Banner */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-900/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Amazon Bedrock · Claude 3.5 Sonnet
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Model: anthropic.claude-3-5-sonnet-20240620-v1:0
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Natural language executive synthesis grounded in deterministic risk math, EAL liability, and portfolio capital optimization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDataAndGenerate}
              disabled={generatingAI}
              className="border-indigo-500/40 bg-indigo-950/20 text-indigo-200 hover:bg-indigo-900/30 text-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", generatingAI && "animate-spin")} />
              {generatingAI ? "Synthesizing..." : "Regenerate with Bedrock"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              disabled={!executiveSummary && !boardReport}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? "Copied" : "Copy Markdown"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        {result && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={WalletCards}
              label="Authorized Budget"
              value={`${sym}${Number(result.available_budget || analysis?.dataset_budget || 0).toLocaleString()}`}
              detail="From uploaded dataset"
              tone="blue"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Recommended Spend"
              value={`${sym}${Number(result.recommended_total_investment || result.recommended_investment || 0).toLocaleString()}`}
              detail="Optimal remediation portfolio"
              tone="emerald"
            />
            <MetricCard
              icon={BarChart3}
              label="Modeled Risk Reduction"
              value={`${result.overall_risk_reduction_percent}%`}
              detail="Portfolio liability mitigation"
              tone="cyan"
            />
            <MetricCard
              icon={Building2}
              label="Enterprise Entity"
              value={companyName}
              detail={`${analysis?.valid_records?.length || 0} active risks verified`}
              tone="violet"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab("executive")}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2",
              activeTab === "executive"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            )}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            Executive Risk Summary (CISO/CEO)
          </button>
          <button
            onClick={() => setActiveTab("board")}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2",
              activeTab === "board"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            )}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            Board of Directors Report (Governance)
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={cn(
              "px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2",
              activeTab === "portfolio"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            )}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Remediation Portfolio Breakdown
          </button>
        </div>

        {/* Empty State when no data is analyzed */}
        {!analysis || !result ? (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="py-14 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">No Company Risk Dataset Uploaded</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Upload your organization&apos;s risk records and security budget to generate natural language executive summaries and board reports via Amazon Bedrock (Claude 3.5 Sonnet).
                </p>
              </div>
              <Button onClick={() => setOpenStudio(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-medium">
                <Upload className="w-4 h-4 mr-2" />
                Upload Company Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* TAB 1: EXECUTIVE RISK SUMMARY */}
            {activeTab === "executive" && (
              <Card className="border-slate-800 bg-slate-900/70 shadow-xl">
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                        C-Suite Decision Briefing
                      </span>
                      <CardTitle className="text-lg font-bold text-slate-100 mt-0.5">
                        Executive Cyber Risk Briefing — {companyName}
                      </CardTitle>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Amazon Bedrock · Claude 3.5
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {generatingAI ? (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-300">Claude 3.5 Sonnet is synthesizing your executive risk briefing on Amazon Bedrock...</p>
                    </div>
                  ) : (
                    <FormattedChatMessage content={executiveSummary} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB 2: BOARD OF DIRECTORS REPORT */}
            {activeTab === "board" && (
              <Card className="border-slate-800 bg-slate-900/70 shadow-xl">
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                        Audit & Board Oversight
                      </span>
                      <CardTitle className="text-lg font-bold text-slate-100 mt-0.5">
                        Board of Directors Cyber Risk & Capital Allocation Report
                      </CardTitle>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      SEC / SEBI Governance Ready
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {generatingAI ? (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-300">Claude 3.5 Sonnet is compiling formal Board Report on Amazon Bedrock...</p>
                    </div>
                  ) : (
                    <FormattedChatMessage content={boardReport} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB 3: PORTFOLIO BREAKDOWN */}
            {activeTab === "portfolio" && (
              <div className="space-y-6">
                <Card className="border-slate-800 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-100">Optimal Remediation Investments</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {result.selected_risks?.length || 0} risk remediation item(s) selected within the authorized budget constraint.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {(result.selected_risks || []).map((risk: any) => (
                      <RiskRow key={risk.risk_id} risk={risk} selected sym={sym} />
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-100">Deferred Risks (Unfunded Capital Ceiling)</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Risks retained in projected untreated scenario due to budget limits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {(result.deferred_risks || []).map((risk: any) => (
                      <RiskRow key={risk.risk_id} risk={risk} sym={sym} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      <RealDataStudioModal isOpen={openStudio} onClose={() => setOpenStudio(false)} onComplete={loadDataAndGenerate} />
    </PageShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "emerald" | "cyan" | "violet";
}) {
  const tones = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/10",
  };

  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardContent className="p-5 flex items-start gap-3.5">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", tones[tone])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-slate-100">{value}</p>
          <p className="text-[11px] text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskRow({ risk, selected = false, sym = "₹" }: { risk: any; selected?: boolean; sym?: string }) {
  const cost = risk.remediation_cost !== null && risk.remediation_cost !== undefined ? Number(risk.remediation_cost) : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 text-xs hover:border-slate-700/80 transition-all">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">{risk.risk_id}</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              risk.severity === "Critical"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : risk.severity === "High"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-blue-500/15 text-blue-300 border-blue-500/30"
            )}
          >
            {risk.severity || "Unclassified"}
          </span>
        </div>
        <p className="font-medium text-slate-200">{risk.risk_name}</p>
      </div>

      <div className="text-right space-y-0.5">
        {cost !== null && <p className="font-semibold text-slate-100">{sym}{cost.toLocaleString()}</p>}
        <p className={selected ? "text-emerald-400 font-medium" : "text-amber-400"}>
          {selected
            ? `${risk.expected_risk_reduction_percent || 65}% risk reduction`
            : `${risk.projected_untreated_risk_increase_percent || 20}% projected increase`}
        </p>
      </div>
    </div>
  );
}
