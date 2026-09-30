"use client";

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DEMO_CONTROLS } from "@/lib/demo-data";
import { ShieldCheck, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ControlsPage() {
  return (
    <PageShell
      title="Security Controls Inventory"
      description="Deployed defensive countermeasures, measured efficacy, infrastructure coverage, and risk reduction credit"
    >
      <Card>
        <CardHeader>
          <CardTitle>Implemented Enterprise Security Controls</CardTitle>
          <CardDescription>
            The risk engine factors effectiveness and coverage to calculate residual risk without overwriting inherent risk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Effectiveness</TableHead>
                <TableHead>Fleet Coverage</TableHead>
                <TableHead>Operational Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_CONTROLS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-md">{c.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">{c.control_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${c.effectiveness}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-emerald-400">{c.effectiveness}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${c.coverage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-blue-400">{c.coverage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      {c.status}
                    </Badge>
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
