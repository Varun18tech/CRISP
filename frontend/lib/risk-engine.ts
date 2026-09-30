/**
 * Authoritative Client-Side Deterministic Cyber Risk Engine
 * Mirrors Section 1.6 - 1.10 of ANTIGRAVITY_INSTRUCTIONS.md
 */

export interface RiskWeights {
  exploitability: number;
  threatActivity: number;
  exposure: number;
  vulnSeverity: number;
  historicalIncidents: number;

  financialImpact: number;
  dataSensitivity: number;
  businessCriticality: number;
  regulatoryImpact: number;
  availabilityImpact: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  exploitability: 0.30,
  threatActivity: 0.25,
  exposure: 0.20,
  vulnSeverity: 0.15,
  historicalIncidents: 0.10,

  financialImpact: 0.30,
  dataSensitivity: 0.25,
  businessCriticality: 0.20,
  regulatoryImpact: 0.15,
  availabilityImpact: 0.10,
};

export function calculateLikelihood(
  exploitability: number,
  threatActivity: number,
  exposure: number,
  vulnSeverity: number,
  historicalIncidents: number,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): number {
  const e = Math.max(0, Math.min(100, exploitability));
  const t = Math.max(0, Math.min(100, threatActivity));
  const x = Math.max(0, Math.min(100, exposure));
  const v = Math.max(0, Math.min(100, vulnSeverity));
  const h = Math.max(0, Math.min(100, historicalIncidents));

  const score =
    weights.exploitability * e +
    weights.threatActivity * t +
    weights.exposure * x +
    weights.vulnSeverity * v +
    weights.historicalIncidents * h;

  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

export function calculateImpact(
  financialImpact: number,
  dataSensitivity: number,
  businessCriticality: number,
  regulatoryImpact: number,
  availabilityImpact: number,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): number {
  const f = Math.max(0, Math.min(100, financialImpact));
  const s = Math.max(0, Math.min(100, dataSensitivity));
  const c = Math.max(0, Math.min(100, businessCriticality));
  const r = Math.max(0, Math.min(100, regulatoryImpact));
  const a = Math.max(0, Math.min(100, availabilityImpact));

  const score =
    weights.financialImpact * f +
    weights.dataSensitivity * s +
    weights.businessCriticality * c +
    weights.regulatoryImpact * r +
    weights.availabilityImpact * a;

  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

export function calculateExposure(likelihood: number, impact: number): number {
  const l = Math.max(0, Math.min(100, likelihood));
  const i = Math.max(0, Math.min(100, impact));
  return Number(((l * i) / 100).toFixed(2));
}

export function calculateResidualRisk(inherentRisk: number, controlEffectiveness: number): { inherent: number; residual: number } {
  const inh = Math.max(0, Math.min(100, inherentRisk));
  const eff = Math.max(0, Math.min(100, controlEffectiveness));
  const reduction = eff / 100;
  const residual = inh * (1 - reduction);
  return {
    inherent: Number(inh.toFixed(2)),
    residual: Number(Math.max(0, Math.min(100, residual)).toFixed(2)),
  };
}

export function calculateEAL(annualFrequency: number, lossMagnitude: number): number {
  const freq = Math.max(0, annualFrequency);
  const loss = Math.max(0, lossMagnitude);
  return Number((freq * loss).toFixed(2));
}

export function classifyRiskLevel(score: number): "Low" | "Moderate" | "High" | "Very High" | "Critical" {
  if (score <= 20) return "Low";
  if (score <= 40) return "Moderate";
  if (score <= 60) return "High";
  if (score <= 80) return "Very High";
  return "Critical";
}

export interface ExecutiveProfitMetrics {
  currentLossExposure: number;      // Current EAL (₹)
  projectedLossMitigated: number;   // Loss prevented / Capital preserved (₹)
  residualLossExposure: number;     // Remaining EAL (₹)
  investmentCost: number;           // Security capital invested (₹)
  netFinancialProfit: number;       // Net Value Created = Loss Saved - Cost (₹)
  rosiPercentage: number;           // Return on Security Investment (%)
  benefitCostRatio: number;         // e.g. 4.2x
}

export function calculateExecutiveProfit(
  currentEAL: number,
  controlImprovementPercentage: number,
  investmentCost: number
): ExecutiveProfitMetrics {
  const current = Math.max(0, currentEAL);
  const cost = Math.max(0, investmentCost);
  const improvement = Math.max(0, Math.min(100, controlImprovementPercentage)) / 100;

  const lossMitigated = current * improvement;
  const residual = current - lossMitigated;
  const netProfit = lossMitigated - cost;
  const rosi = cost > 0 ? ((lossMitigated - cost) / cost) * 100 : 0;
  const ratio = cost > 0 ? lossMitigated / cost : 0;

  return {
    currentLossExposure: Math.round(current),
    projectedLossMitigated: Math.round(lossMitigated),
    residualLossExposure: Math.round(residual),
    investmentCost: Math.round(cost),
    netFinancialProfit: Math.round(netProfit),
    rosiPercentage: Number(rosi.toFixed(1)),
    benefitCostRatio: Number(ratio.toFixed(2)),
  };
}
