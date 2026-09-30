"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Settings as SettingsIcon, Save, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [currency, setCurrency] = useState("INR");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Likelihood Weights (Section 1.6)
  const [likelihoodWeights, setLikelihoodWeights] = useState({
    exploitability: 0.30,
    threat_activity: 0.25,
    exposure: 0.20,
    vuln_severity: 0.15,
    incidents: 0.10,
  });

  // Impact Weights (Section 1.6)
  const [impactWeights, setImpactWeights] = useState({
    financial: 0.30,
    data_sensitivity: 0.25,
    criticality: 0.20,
    regulatory: 0.15,
    availability: 0.10,
  });

  // Thresholds (Section 1.7)
  const [thresholds, setThresholds] = useState({
    low: 20,
    moderate: 40,
    high: 60,
    very_high: 80,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setLikelihoodWeights({
      exploitability: 0.30,
      threat_activity: 0.25,
      exposure: 0.20,
      vuln_severity: 0.15,
      incidents: 0.10,
    });
    setImpactWeights({
      financial: 0.30,
      data_sensitivity: 0.25,
      criticality: 0.20,
      regulatory: 0.15,
      availability: 0.10,
    });
    setThresholds({
      low: 20,
      moderate: 40,
      high: 60,
      very_high: 80,
    });
    setCurrency("INR");
  };

  return (
    <PageShell
      title="Risk Engine Settings & Thresholds"
      description="Configure deterministic weights, risk level classification thresholds, and currency standards per Section 1.6 & 1.7"
    >
      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <Alert variant="success" title="Configuration Saved">
            Risk engine weights and classification thresholds have been successfully updated. All active risks will use these parameters.
          </Alert>
        )}

        {/* Currency & General */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Localization & Defaults</CardTitle>
            <CardDescription>Primary reporting currency and versioning</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Reporting Currency</label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Active Engine Version</label>
              <Input disabled value="Risk Engine v1.0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Organization Context</label>
              <Input disabled value="CyberAegis Financial Global" />
            </div>
          </CardContent>
        </Card>

        {/* Likelihood Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Likelihood Factor Weights (Sum = 1.00)</CardTitle>
            <CardDescription>Weights applied to normalized 0–100 indicators per Section 1.6</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Exploitability</label>
              <Input
                type="number"
                step="0.05"
                value={likelihoodWeights.exploitability}
                onChange={(e) => setLikelihoodWeights({ ...likelihoodWeights, exploitability: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Threat Activity</label>
              <Input
                type="number"
                step="0.05"
                value={likelihoodWeights.threat_activity}
                onChange={(e) => setLikelihoodWeights({ ...likelihoodWeights, threat_activity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Exposure (Internet)</label>
              <Input
                type="number"
                step="0.05"
                value={likelihoodWeights.exposure}
                onChange={(e) => setLikelihoodWeights({ ...likelihoodWeights, exposure: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Vuln Severity</label>
              <Input
                type="number"
                step="0.05"
                value={likelihoodWeights.vuln_severity}
                onChange={(e) => setLikelihoodWeights({ ...likelihoodWeights, vuln_severity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Incident Frequency</label>
              <Input
                type="number"
                step="0.05"
                value={likelihoodWeights.incidents}
                onChange={(e) => setLikelihoodWeights({ ...likelihoodWeights, incidents: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Impact Weights */}
        <Card>
          <CardHeader>
            <CardTitle>Impact Factor Weights (Sum = 1.00)</CardTitle>
            <CardDescription>Weights applied to business consequence dimensions per Section 1.6</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Financial Impact</label>
              <Input
                type="number"
                step="0.05"
                value={impactWeights.financial}
                onChange={(e) => setImpactWeights({ ...impactWeights, financial: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Data Sensitivity</label>
              <Input
                type="number"
                step="0.05"
                value={impactWeights.data_sensitivity}
                onChange={(e) => setImpactWeights({ ...impactWeights, data_sensitivity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Criticality</label>
              <Input
                type="number"
                step="0.05"
                value={impactWeights.criticality}
                onChange={(e) => setImpactWeights({ ...impactWeights, criticality: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Regulatory Impact</label>
              <Input
                type="number"
                step="0.05"
                value={impactWeights.regulatory}
                onChange={(e) => setImpactWeights({ ...impactWeights, regulatory: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Availability</label>
              <Input
                type="number"
                step="0.05"
                value={impactWeights.availability}
                onChange={(e) => setImpactWeights({ ...impactWeights, availability: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Classification Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Classification Thresholds</CardTitle>
            <CardDescription>Cutoffs defining Low, Moderate, High, Very High, and Critical boundaries</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Low Ceiling (0–X)</label>
              <Input
                type="number"
                value={thresholds.low}
                onChange={(e) => setThresholds({ ...thresholds, low: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Moderate Ceiling</label>
              <Input
                type="number"
                value={thresholds.moderate}
                onChange={(e) => setThresholds({ ...thresholds, moderate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">High Ceiling</label>
              <Input
                type="number"
                value={thresholds.high}
                onChange={(e) => setThresholds({ ...thresholds, high: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Very High Ceiling</label>
              <Input
                type="number"
                value={thresholds.very_high}
                onChange={(e) => setThresholds({ ...thresholds, very_high: parseInt(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          <Button type="button" variant="secondary" onClick={handleResetDefaults}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset Spec Defaults</span>
          </Button>
          <Button type="submit">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
