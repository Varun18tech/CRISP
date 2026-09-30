export interface Vulnerability {
  id: string;
  asset_id: string;
  asset_name?: string;
  cve_id?: string;
  name: string;
  description?: string;
  cvss_score: number;
  exploitability_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  patch_available: boolean;
  exploit_available: boolean;
  discovered_at: string;
  resolved_at?: string;
  status: "Open" | "In Progress" | "Mitigated" | "Resolved";
  created_at: string;
  updated_at: string;
}

export interface Threat {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  threat_type: string;
  activity_level: number; // 0 - 100
  source?: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
}

export interface SecurityControl {
  id: string;
  organization_id: string;
  name: string;
  control_type: string;
  description?: string;
  effectiveness: number; // 0 - 100
  coverage: number;      // 0 - 100
  status: "Operational" | "Degraded" | "Planned" | "Disabled";
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: "Tooling" | "Infrastructure" | "Training" | "Remediation" | "Consulting";
  cost: number;
  implementation_time: string;
  expected_likelihood_reduction: number;
  expected_impact_reduction: number;
  expected_risk_reduction: number;
  expected_eal_reduction: number;
  roi: number;
  status: "Proposed" | "Approved" | "Implemented" | "Rejected";
  created_at: string;
  updated_at: string;
}
