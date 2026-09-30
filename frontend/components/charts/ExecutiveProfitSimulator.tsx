"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { calculateExecutiveProfit, calculateEAL } from "@/lib/risk-engine";
import { DollarSign, TrendingUp, Scale, Sparkles } from "lucide-react";

export function ExecutiveProfitSimulator() {
  // Interactive Sliders State (Defaults matching screenshot)
  const [investmentCost, setInvestmentCost] = useState<number>(1200000); // ₹12.00 L
  const [controlEffectiveness, setControlEffectiveness] = useState<number>(65); // 65% Mitigated
  const [annualFrequency, setAnnualFrequency] = useState<number>(0.35); // 0.35 / year
  const [lossMagnitude, setLossMagnitude] = useState<number>(40000000); // ₹4.00 Cr
  const [activePreset, setActivePreset] = useState<"conservative" | "balanced" | "aggressive" | null>("balanced");
  const [exposureView, setExposureView] = useState<"baseline" | "net">("baseline");

  // Calculate current baseline EAL from sliders in real-time
  const currentEAL = useMemo(() => {
    return calculateEAL(annualFrequency, lossMagnitude);
  }, [annualFrequency, lossMagnitude]);

  // Compute executive profit metrics in real-time
  const profitMetrics = useMemo(() => {
    return calculateExecutiveProfit(currentEAL, controlEffectiveness, investmentCost);
  }, [currentEAL, controlEffectiveness, investmentCost]);

  // Waterfall comparison data for BarChart
  const waterfallData = useMemo(() => {
    return [
      {
        name: "Baseline Loss (EAL)",
        amount: profitMetrics.currentLossExposure,
        fill: "#f43f5e", // Rose
        description: "Annual exposure without security capital",
      },
      {
        name: "Security Investment",
        amount: profitMetrics.investmentCost,
        fill: "#3b82f6", // Blue
        description: "Capital budget allocated",
      },
      {
        name: "Loss Prevented",
        amount: profitMetrics.projectedLossMitigated,
        fill: "#10b981", // Emerald
        description: "Financial capital saved via controls",
      },
      {
        name: "Net Profit / Return",
        amount: Math.max(0, profitMetrics.netFinancialProfit),
        fill: "#8b5cf6", // Purple
        description: "Net Value Created (Savings - Cost)",
      },
      {
        name: "Residual Loss",
        amount: profitMetrics.residualLossExposure,
        fill: "#f59e0b", // Amber
        description: "Remaining annualized exposure",
      },
    ];
  }, [profitMetrics]);

  // Sensitivity curve data: showing profit across varying budget investments
  const sensitivityData = useMemo(() => {
    const points = [];
    for (let costStep = 200000; costStep <= 5000000; costStep += 400000) {
      const simulatedEff = Math.min(92, Math.round(92 * (1 - Math.exp(-costStep / 1400000))));
      const res = calculateExecutiveProfit(currentEAL, simulatedEff, costStep);
      points.push({
        budgetFormatted: formatCurrency(costStep),
        rawCost: costStep,
        lossMitigated: res.projectedLossMitigated,
        netProfit: res.netFinancialProfit,
        roi: res.rosiPercentage,
      });
    }
    return points;
  }, [currentEAL]);

  const handlePreset = (type: "conservative" | "balanced" | "aggressive") => {
    setActivePreset(type);
    if (type === "conservative") {
      setInvestmentCost(500000);
      setControlEffectiveness(45);
      setAnnualFrequency(0.20);
      setLossMagnitude(20000000);
    } else if (type === "balanced") {
      setInvestmentCost(1200000);
      setControlEffectiveness(65);
      setAnnualFrequency(0.35);
      setLossMagnitude(40000000);
    } else {
      setInvestmentCost(3500000);
      setControlEffectiveness(90);
      setAnnualFrequency(0.60);
      setLossMagnitude(80000000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary Metric Cards - Dynamically Reacts to All Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Baseline Loss Exposure - Fully reactive and interactive */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative group transition-all duration-200 hover:border-rose-500/40">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-rose-400">
              {exposureView === "baseline" ? "Baseline Loss Exposure" : "Net Residual Exposure"}
            </p>
            {/* Quick interactive adjustment steppers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLossMagnitude((prev) => Math.max(5000000, prev - 5000000));
                  setActivePreset(null);
                }}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-xs font-bold transition-all"
                title="Decrease Exposure (-₹50L Incident Max)"
              >
                −
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLossMagnitude((prev) => Math.min(100000000, prev + 5000000));
                  setActivePreset(null);
                }}
                className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 text-xs font-bold transition-all"
                title="Increase Exposure (+₹50L Incident Max)"
              >
                +
              </button>
            </div>
          </div>

          <div
            onClick={() => setExposureView((prev) => (prev === "baseline" ? "net" : "baseline"))}
            className="cursor-pointer group/val"
            title="Click to toggle Baseline vs Net Residual Exposure"
          >
            <div className="mt-1 flex items-baseline justify-between flex-wrap gap-1">
              <p className="text-2xl font-bold text-slate-100 font-mono transition-all duration-150 group-hover/val:text-rose-300">
                {exposureView === "baseline"
                  ? formatCurrency(profitMetrics.currentLossExposure)
                  : formatCurrency(profitMetrics.residualLossExposure)}
              </p>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded transition-all ${
                  exposureView === "baseline"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                }`}
              >
                {exposureView === "baseline"
                  ? `↓ ${formatCurrency(profitMetrics.residualLossExposure)} Net`
                  : `Base: ${formatCurrency(profitMetrics.currentLossExposure)}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>
                {exposureView === "baseline" ? "Annualized Incident EAL" : "Post-Mitigation Exposure"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {profitMetrics.currentLossExposure > 0
                  ? `${((profitMetrics.projectedLossMitigated / profitMetrics.currentLossExposure) * 100).toFixed(0)}% Mitigated`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Security Capital Cost */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-400">
            Security Capital Cost
          </p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {formatCurrency(profitMetrics.investmentCost)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Defensive Budget</p>
        </div>

        {/* Loss Prevented */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">
            Loss Prevented
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(profitMetrics.projectedLossMitigated)}
          </p>
          <p className="text-xs text-emerald-500/80 mt-1">Capital Preserved</p>
        </div>

        {/* Net Financial Profit */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/50 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-purple-300">
              Net Financial Profit
            </p>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-200 mt-1">
            {profitMetrics.netFinancialProfit >= 0 ? "+" : ""}
            {formatCurrency(profitMetrics.netFinancialProfit)}
          </p>
          <p className="text-xs text-purple-300/80 mt-1">Net Value Created</p>
        </div>

        {/* Return (ROSI) */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
              Return (ROSI)
            </p>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-300 mt-1">
            {profitMetrics.rosiPercentage >= 0 ? "+" : ""}
            {profitMetrics.rosiPercentage}%
          </p>
          <p className="text-xs text-emerald-400 mt-1">
            {profitMetrics.benefitCostRatio}x Benefit-to-Cost
          </p>
        </div>
      </div>

      {/* 2. Interactive Sliders Simulator Control Panel */}
      <Card className="border-blue-500/30 bg-slate-900/80">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-slate-100 text-lg">
                Executive Interactive Sliders Simulator
              </CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-xs mt-0.5">
              Drag sliders to adjust capital budget, defensive efficacy, and asset loss magnitude in real-time
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
            <span className="text-xs text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => handlePreset("conservative")}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                activePreset === "conservative"
                  ? "bg-slate-700 text-white border border-slate-500 font-semibold"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              Conservative
            </button>
            <button
              onClick={() => handlePreset("balanced")}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                activePreset === "balanced"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500 font-semibold"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              Balanced
            </button>
            <button
              onClick={() => handlePreset("aggressive")}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                activePreset === "aggressive"
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500 font-semibold"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              Aggressive
            </button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Slider 1: Investment Budget */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Security Capital Budget</span>
              <span className="font-mono text-blue-400 font-bold">{formatCurrency(investmentCost)}</span>
            </div>
            <input
              type="range"
              min={100000}
              max={5000000}
              step={50000}
              value={investmentCost}
              onChange={(e) => {
                setInvestmentCost(Number(e.target.value));
                setActivePreset(null);
              }}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>₹1 L</span>
              <span>₹25 L</span>
              <span>₹50 L</span>
            </div>
          </div>

          {/* Slider 2: Control Effectiveness */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Defensive Control Efficacy</span>
              <span className="font-mono text-emerald-400 font-bold">{controlEffectiveness}% Mitigated</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              step={1}
              value={controlEffectiveness}
              onChange={(e) => {
                setControlEffectiveness(Number(e.target.value));
                setActivePreset(null);
              }}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>10% (Basic)</span>
              <span>60% (Robust)</span>
              <span>95% (Zero-Trust)</span>
            </div>
          </div>

          {/* Slider 3: Incident Frequency */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Incident Frequency Scenario</span>
              <span className="font-mono text-amber-400 font-bold">{annualFrequency.toFixed(2)} / year</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1.0}
              step={0.01}
              value={annualFrequency}
              onChange={(e) => {
                setAnnualFrequency(Number(e.target.value));
                setActivePreset(null);
              }}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>0.05 (Rare)</span>
              <span>0.50 (Biennial)</span>
              <span>1.00 (Annual)</span>
            </div>
          </div>

          {/* Slider 4: Single Incident Loss Magnitude */}
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Single Incident Loss Max</span>
              <span className="font-mono text-rose-400 font-bold">{formatCurrency(lossMagnitude)}</span>
            </div>
            <input
              type="range"
              min={5000000}
              max={100000000}
              step={500000}
              value={lossMagnitude}
              onChange={(e) => {
                setLossMagnitude(Number(e.target.value));
                setActivePreset(null);
              }}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>₹50 L</span>
              <span>₹5 Cr</span>
              <span>₹10 Cr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Visual Charts (Waterfall & Optimization Sensitivity Curve) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Comparison BarChart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-base text-slate-200">Capital Preservation & Profit Waterfall</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Visual comparison of loss exposure, investment cost, and net preserved capital
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-100">{data.name}</p>
                          <p className="text-sm font-bold text-emerald-400">{formatCurrency(data.amount)}</p>
                          <p className="text-[10px] text-slate-400">{data.description}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investment Sensitivity AreaChart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">Net Profit & Loss Reduction Optimization Curve</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Marginal net value created across scaling capital investments
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensitivityData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="budgetFormatted"
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={1}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-100">Budget: {data.budgetFormatted}</p>
                          <p className="text-emerald-400">Prevented: {formatCurrency(data.lossMitigated)}</p>
                          <p className="text-purple-300">Net Profit: {formatCurrency(data.netProfit)}</p>
                          <p className="text-xs text-slate-400">ROSI: +{data.roi}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lossMitigated"
                  name="Loss Prevented"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#lossGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
