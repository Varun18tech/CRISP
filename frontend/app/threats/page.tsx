"use client";

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DEMO_THREATS } from "@/lib/demo-data";
import { Crosshair, AlertTriangle, ShieldAlert } from "lucide-react";

export default function ThreatsPage() {
  return (
    <PageShell
      title="Threat Intelligence"
      description="Active adversaries, ransomware groups, credential syndicates, and observed activity telemetry"
    >
      <Card>
        <CardHeader>
          <CardTitle>Monitored Threat Actors & Vectors</CardTitle>
          <CardDescription>Activity levels continuously weight likelihood factors in the risk engine</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Threat Actor / Syndicate</TableHead>
                <TableHead>Threat Classification</TableHead>
                <TableHead>Observed Activity Level</TableHead>
                <TableHead>Intelligence Source</TableHead>
                <TableHead>First Observed</TableHead>
                <TableHead>Last Telemetry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_THREATS.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-100">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-md">{t.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">{t.threat_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-1.5 rounded-full"
                          style={{ width: `${t.activity_level}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-rose-400">{t.activity_level}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-300">{t.source}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-400">{new Date(t.first_seen).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-300">{new Date(t.last_seen).toLocaleDateString()}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
