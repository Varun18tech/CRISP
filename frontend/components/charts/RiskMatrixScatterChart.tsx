"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Risk } from "@/types/risk";
import { formatCurrency, getRiskLevelColor } from "@/lib/utils";
import { Grid3X3 } from "lucide-react";

interface RiskMatrixScatterChartProps {
  risks: Risk[];
}

export function RiskMatrixScatterChart({ risks }: RiskMatrixScatterChartProps) {
  const chartData = risks.map((r) => ({
    id: r.id,
    name: r.asset_name || r.id,
    vulnerability: r.vulnerability_name || "Vulnerability",
    threat: r.threat_name || "Threat",
    impact: r.impact,
    likelihood: r.likelihood,
    residualRisk: r.residual_risk,
    inherentRisk: r.inherent_risk,
    eal: r.eal,
    level: r.risk_level,
  }));

  const getColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "#f43f5e"; // rose-500
      case "very high":
        return "#f97316"; // orange-500
      case "high":
        return "#f59e0b"; // amber-500
      case "moderate":
      case "medium":
        return "#eab308"; // yellow-500
      default:
        return "#10b981"; // emerald-500
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-blue-400" />
            <CardTitle>Continuous Risk Matrix Scatterplot</CardTitle>
          </div>
          <CardDescription>
            Interactive Likelihood (Y) vs. Impact (X) mapping with real-time risk calculations
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="impact"
              name="Impact"
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={11}
              label={{ value: "Business Impact Score →", position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="likelihood"
              name="Likelihood"
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={11}
              label={{ value: "Exploit Likelihood Score ↑", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
            />
            <ZAxis range={[120, 260]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-xs space-y-1.5 max-w-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">{data.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                          {data.level}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{data.vulnerability}</p>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500">Likelihood: </span>
                          <span className="font-mono text-slate-200 font-semibold">{data.likelihood}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Impact: </span>
                          <span className="font-mono text-slate-200 font-semibold">{data.impact}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Residual Risk: </span>
                          <span className="font-mono text-blue-400 font-bold">{data.residualRisk}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Loss (EAL): </span>
                          <span className="font-bold text-emerald-400">{formatCurrency(data.eal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Risks" data={chartData}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`scatter-cell-${index}`}
                  fill={getColor(entry.level)}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
