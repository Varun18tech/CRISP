"use client";

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DEMO_RISKS, DEMO_ASSETS, DEMO_CONTROLS } from "@/lib/demo-data";
import { BarChart3, TrendingDown, ShieldCheck, PieChart, Layers } from "lucide-react";

export default function AnalyticsPage() {
  const totalEAL = DEMO_RISKS.reduce((sum, r) => sum + r.eal, 0);

  return (
    <PageShell
      title="Cyber Risk & Financial Loss Analytics"
      description="Multi-dimensional breakdown of annualized losses, asset exposure densities, and defensive ROI"
    >
      {/* 1. Top Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EAL by Asset */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <CardTitle>Expected Annual Loss by Asset</CardTitle>
            </div>
            <CardDescription>Direct financial liability distribution across operational infrastructure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {DEMO_RISKS.map((risk) => {
              const percentage = Math.round((risk.eal / totalEAL) * 100);
              return (
                <div key={risk.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">{risk.asset_name}</span>
                    <span className="text-slate-400 font-semibold">{formatCurrency(risk.eal)} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Risk Level Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-400" />
              <CardTitle>Organizational Risk Density</CardTitle>
            </div>
            <CardDescription>Quantified risks categorized by threshold classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <p className="text-[10px] text-rose-400 font-semibold uppercase">Very High Exposure</p>
                <p className="text-2xl font-bold text-rose-300 mt-1">2 Risks</p>
                <p className="text-[10px] text-slate-400">Score &gt; 60</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <p className="text-[10px] text-amber-400 font-semibold uppercase">Moderate Exposure</p>
                <p className="text-2xl font-bold text-amber-300 mt-1">2 Risks</p>
                <p className="text-[10px] text-slate-400">Score &gt; 20 - 40</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <p className="text-[10px] text-emerald-400 font-semibold uppercase">Low Exposure</p>
                <p className="text-2xl font-bold text-emerald-300 mt-1">1 Risk</p>
                <p className="text-[10px] text-slate-400">Score 0 - 20</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
                <p className="text-[10px] text-blue-400 font-semibold uppercase">Total Quantified</p>
                <p className="text-2xl font-bold text-blue-300 mt-1">5 Risks</p>
                <p className="text-[10px] text-slate-400">Continuous scoring</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Executive Insight: </span>
              Two core transactional systems account for 73% of total organizational financial risk. Prioritizing targeted patching on these systems achieves immediate posture inflection.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Effectiveness Benchmark */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <CardTitle>Defense Layer Efficacy Benchmarks</CardTitle>
          </div>
          <CardDescription>Measured control performance applied to residual risk formulas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_CONTROLS.slice(0, 3).map((ctl) => (
              <div key={ctl.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{ctl.control_type}</Badge>
                  <span className="text-xs font-bold text-emerald-400">{ctl.effectiveness}% Effective</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-200">{ctl.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{ctl.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
