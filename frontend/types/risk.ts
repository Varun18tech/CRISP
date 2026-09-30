export type RiskLevel = "Low" | "Moderate" | "High" | "Very High" | "Critical";

export interface Risk {
  id: string;
  organization_id: string;
  asset_id: string;
  asset_name?: string;
  vulnerability_id: string;
  vulnerability_name?: string;
  threat_id: string;
  threat_name?: string;
  
  likelihood: number; // 0 - 100
  impact: number;     // 0 - 100
  inherent_risk: number; // 0 - 100
  
  control_effectiveness: number; // 0 - 100
  residual_risk: number; // 0 - 100
  
  annual_frequency: number;
  loss_magnitude: number;
  eal: number; // Expected Annual Loss
  
  risk_level: RiskLevel;
  risk_status: "Active" | "Accepted" | "Remediated";
  calculation_version: string;
  created_at: string;
  updated_at: string;

  // Enriched fields for detail view
  drivers?: string[];
  controls_applied?: {
    id: string;
    name: string;
    type: string;
    effectiveness: number;
  }[];
  ai_narrative?: {
    summary: string;
    consequences: string;
    recommendations: string[];
    executive_explanation: string;
  };
}

export interface RiskFilterParams {
  search?: string;
  level?: string;
  asset_id?: string;
  status?: string;
  sortBy?: "residual_risk" | "eal" | "likelihood" | "impact" | "created_at";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
