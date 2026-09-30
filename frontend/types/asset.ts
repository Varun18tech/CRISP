export type AssetCriticality = "Low" | "Medium" | "High" | "Critical";

export interface Asset {
  id: string;
  organization_id: string;
  name: string;
  asset_type: string; // API, Database, Endpoint, Server, Cloud Storage
  description?: string;
  criticality: AssetCriticality;
  business_value: number;
  data_sensitivity: number; // 0 - 100
  internet_exposed: boolean;
  owner?: string;
  environment: "Production" | "Staging" | "Development";
  status: "Active" | "Decommissioned" | "Maintenance";
  created_at: string;
  updated_at: string;
  active_risks_count?: number;
  max_residual_risk?: number;
}
