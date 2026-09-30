"use client";

import React, { use } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, getRiskLevelColor } from "@/lib/utils";
import { DEMO_ASSETS, DEMO_RISKS, DEMO_VULNERABILITIES } from "@/lib/demo-data";
import { Server, ArrowLeft, Globe, Lock, ShieldAlert, Bug, ArrowUpRight } from "lucide-react";

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assetId = resolvedParams.id;

  const asset = DEMO_ASSETS.find((a) => a.id === assetId) || DEMO_ASSETS[0];
  const associatedRisks = DEMO_RISKS.filter((r) => r.asset_id === asset.id);
  const associatedVulns = DEMO_VULNERABILITIES.filter((v) => v.asset_id === asset.id);

  return (
    <PageShell
      title={`Asset: ${asset.name}`}
      description={`Detailed profile, criticality attributes, and quantified cyber exposure`}
      actions={
        <Link href="/assets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            <span>Back to Assets</span>
          </Button>
        </Link>
      }
    >
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 apple-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{asset.asset_type}</Badge>
            <Badge variant={asset.criticality === "Critical" ? "critical" : "warning"}>
              {asset.criticality} Criticality
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{asset.name}</h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">{asset.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Business Value</p>
            <p className="text-lg font-bold text-slate-200">{formatCurrency(asset.business_value)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Data Sensitivity</p>
            <p className="text-lg font-bold text-slate-200">{asset.data_sensitivity}/100</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Ingress Posture</p>
            <p className="text-xs font-semibold text-orange-400 mt-1">
              {asset.internet_exposed ? "Internet-Facing" : "VPC Isolated"}
            </p>
          </div>
        </div>
      </div>

      {/* Associated Risks on this Asset */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <CardTitle>Quantified Risks on this Asset ({associatedRisks.length})</CardTitle>
          </div>
          <CardDescription>Direct business liability calculated by the risk engine</CardDescription>
        </CardHeader>
        <CardContent>
          {associatedRisks.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No active critical risks identified on this asset.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vulnerability</TableHead>
                  <TableHead>Threat</TableHead>
                  <TableHead>Inherent Risk</TableHead>
                  <TableHead>Residual Risk</TableHead>
                  <TableHead>Annual Loss (EAL)</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedRisks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium text-slate-200">{risk.vulnerability_name}</TableCell>
                    <TableCell className="text-xs text-slate-400">{risk.threat_name}</TableCell>
                    <TableCell className="font-mono text-xs">{risk.inherent_risk}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-400">{risk.residual_risk}</TableCell>
                    <TableCell className="font-semibold text-xs text-slate-100">{formatCurrency(risk.eal)}</TableCell>
                    <TableCell>
                      <Badge variant="danger" size="sm">{risk.risk_level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/risks/${risk.id}`}>
                        <Button variant="ghost" size="sm">Inspect</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
