"use client";

import React, { use } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getRiskLevelColor } from "@/lib/utils";
import { DEMO_RISKS, DEMO_ASSETS, DEMO_INVESTMENTS } from "@/lib/demo-data";
import {
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Server,
  Bug,
  Crosshair,
  ShieldCheck,
  TrendingDown,
  AlertCircle,
  FileCheck2,
  DollarSign
} from "lucide-react";

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const riskId = resolvedParams.id;

  const risk = DEMO_RISKS.find((r) => r.id === riskId) || DEMO_RISKS[0];
  const asset = DEMO_ASSETS.find((a) => a.id === risk.asset_id);
  const relevantInvestment = DEMO_INVESTMENTS[0];

  return (
    <PageShell
      title={`Risk Analysis: ${risk.asset_name}`}
      description={`Authoritative risk breakdown under Risk Engine ${risk.calculation_version}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/risks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back to Register</span>
            </Button>
          </Link>
          <Link href="/investments">
            <Button size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Model Mitigation</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* 1. Score Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 apple-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="danger" size="md">
              {risk.risk_level} Exposure
            </Badge>
            <span className="text-xs text-slate-400">ID: {risk.id}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{risk.vulnerability_name}</h2>
          <p className="text-xs text-slate-400">
            Targeting {risk.asset_name} via {risk.threat_name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Inherent Risk</p>
            <p className="text-2xl font-bold text-slate-300">{risk.inherent_risk}</p>
            <p className="text-[10px] text-slate-500">Unmitigated</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">Residual Risk</p>
            <p className="text-2xl font-bold text-blue-400">{risk.residual_risk}</p>
            <p className="text-[10px] text-emerald-400">With Controls</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Expected Loss (EAL)</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(risk.eal)}</p>
            <p className="text-[10px] text-slate-500">Per Annum</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mathematical Breakdown & Drivers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mathematical Factors Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Deterministic Risk Breakdown</CardTitle>
              <CardDescription>Mathematical factors normalized on a 0–100 scale per Section 1.6</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Likelihood Score</p>
                  <p className="text-xl font-bold text-slate-100">{risk.likelihood}</p>
                  <p className="text-[10px] text-slate-500">0.30E + 0.25T + 0.20X...</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Impact Score</p>
                  <p className="text-xl font-bold text-slate-100">{risk.impact}</p>
                  <p className="text-[10px] text-slate-500">0.30F + 0.25S + 0.20C...</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Annual Frequency</p>
                  <p className="text-xl font-bold text-slate-100">{risk.annual_frequency}/yr</p>
                  <p className="text-[10px] text-slate-500">Incident cadence</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Loss Magnitude</p>
                  <p className="text-xl font-bold text-slate-100">{formatCurrency(risk.loss_magnitude)}</p>
                  <p className="text-[10px] text-slate-500">Per incident max</p>
                </div>
              </div>

              {/* Explainable Risk Drivers (Section 13) */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Primary Risk Drivers (Why is this score elevated?)
                </h4>
                <div className="space-y-2">
                  {risk.drivers?.map((driver, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Context Entities */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Context & Asset Topology</CardTitle>
              <CardDescription>Relationships mapped into the risk engine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>Target Asset</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200">{risk.asset_name}</h4>
                  <p className="text-xs text-slate-400">
                    Type: {asset?.asset_type} • Value: {formatCurrency(asset?.business_value || 0)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Bug className="w-4 h-4 text-rose-400" />
                    <span>Identified Flaw</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200">{risk.vulnerability_name}</h4>
                  <p className="text-xs text-slate-400">
                    CVSS 9.8 • Exploit PoC Public
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Crosshair className="w-4 h-4 text-amber-400" />
                    <span>Threat Vector</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200">{risk.threat_name}</h4>
                  <p className="text-xs text-slate-400">
                    Nation-State • Activity: 85%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Explanation & Recommended Investment */}
        <div className="space-y-6">
          {/* Explainable AI Narrative Card (Section 1.4 & 8.5) */}
          <Card className="border-indigo-500/30">
            <CardHeader className="bg-indigo-950/20 rounded-t-2xl pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <CardTitle className="text-indigo-300">AI Risk Narrative & Synthesis</CardTitle>
              </div>
              <CardDescription>Non-authoritative natural language explanation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-slate-300 leading-relaxed pt-4">
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Executive Summary</p>
                <p className="text-slate-400">{risk.ai_narrative?.summary}</p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Potential Business Consequences</p>
                <p className="text-slate-400">{risk.ai_narrative?.consequences}</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-semibold text-slate-200">Prescribed Actions</p>
                <ul className="space-y-1.5">
                  {risk.ai_narrative?.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Note: </span>
                AI explanations are generated by the modular AI layer and do not alter authoritative deterministic risk engine formulas.
              </div>
            </CardContent>
          </Card>

          {/* Investment Option Card (Section 1.10 & 8.6) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <CardTitle>Recommended Investment</CardTitle>
              </div>
              <CardDescription>Financial mitigation scenario modeling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="font-semibold text-emerald-300">{relevantInvestment.name}</p>
                <p className="text-slate-400">{relevantInvestment.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400">Capital Cost</p>
                  <p className="font-bold text-slate-200">{formatCurrency(relevantInvestment.cost)}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-emerald-400">Expected ROI</p>
                  <p className="font-bold text-emerald-400">{relevantInvestment.roi}%</p>
                </div>
              </div>

              <Link href="/investments">
                <Button className="w-full mt-2" size="sm">
                  <span>Open Capital Simulator</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
