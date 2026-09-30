import crypto from "crypto";
import {
  DEMO_ASSETS,
  DEMO_INVESTMENTS,
  DEMO_RISKS,
  DEMO_THREATS,
  DEMO_VULNERABILITIES,
} from "@/lib/demo-data";

export const SUPPORTED_CURRENCIES: Record<
  string,
  { rate_to_inr: number; symbol: string; name: string }
> = {
  INR: { rate_to_inr: 1.0, symbol: "₹", name: "Indian Rupee" },
  USD: { rate_to_inr: 83.5, symbol: "$", name: "US Dollar" },
  EUR: { rate_to_inr: 90.0, symbol: "€", name: "Euro" },
  GBP: { rate_to_inr: 105.0, symbol: "£", name: "British Pound" },
};

const REMEDIATED_STATUSES = new Set([
  "remediated",
  "resolved",
  "closed",
  "mitigated",
  "completed",
  "fixed",
]);

// Server-side state for uploaded dataset snapshots and deterministic optimization cache
const globalForOptimizer = globalThis as unknown as {
  crispLatestSnapshot?: {
    id: number;
    created_at: string;
    source_files: string[];
    result: any;
  } | null;
  crispOptimizationCache?: Map<string, any>;
};

if (!globalForOptimizer.crispOptimizationCache) {
  globalForOptimizer.crispOptimizationCache = new Map<string, any>();
}

export function clearServerOptimizerCache() {
  globalForOptimizer.crispOptimizationCache?.clear();
}

export function setServerUploadedSnapshot(snapshot: {
  id: number;
  created_at: string;
  source_files: string[];
  result: any;
}) {
  globalForOptimizer.crispLatestSnapshot = snapshot;
  clearServerOptimizerCache();
}

export function getServerUploadedSnapshot() {
  return globalForOptimizer.crispLatestSnapshot || null;
}

export function clearServerUploadedSnapshot() {
  globalForOptimizer.crispLatestSnapshot = null;
  clearServerOptimizerCache();
}

function safeFloat(value: any): number | null {
  if (value === null || value === undefined || typeof value === "boolean") {
    return null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const cleaned = text.replace(/,/g, "").replace(/[₹$€£\s]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return num;
}

export function normalizeCurrency(amount: number, currency: string = "INR") {
  const code = (currency || "INR").trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES[code]) {
    throw new Error(
      `Unsupported currency '${currency}'. Supported currencies: ${Object.keys(
        SUPPORTED_CURRENCIES
      ).join(", ")}.`
    );
  }
  const val = safeFloat(amount);
  if (val === null) {
    throw new Error("Budget must be a valid finite number.");
  }
  if (val < 0) {
    throw new Error("Budget cannot be negative.");
  }
  const info = SUPPORTED_CURRENCIES[code];
  const rate = Number(info.rate_to_inr);
  const normalizedInr = Number((val * rate).toFixed(2));
  return {
    entered_amount: Number(val.toFixed(2)),
    entered_currency: code,
    currency_symbol: info.symbol,
    currency_name: info.name,
    normalized_amount_inr: normalizedInr,
    conversion_rate_to_inr: rate,
    conversion_source:
      code === "INR"
        ? "CRISP Base Currency (INR)"
        : `CRISP Deterministic FX Table (1 ${code} = ₹${rate} INR)`,
  };
}

export function convertFromInr(
  amountInr: number | null,
  targetCurrency: string = "INR"
): number | null {
  if (amountInr === null || amountInr === undefined) return null;
  const code = (targetCurrency || "INR").trim().toUpperCase();
  const info = SUPPORTED_CURRENCIES[code];
  if (!info || info.rate_to_inr <= 0) return null;
  return Number((amountInr / Number(info.rate_to_inr)).toFixed(2));
}

function classifySeverity(
  rawSeverity: any,
  cvssScore: number | null,
  currentRisk: number | null
): "Critical" | "High" | "Medium" | "Low" {
  if (rawSeverity) {
    const s = String(rawSeverity).trim().toLowerCase();
    if (s === "critical" || s === "crit") return "Critical";
    if (s === "very high" || s === "high") return "High";
    if (s === "medium" || s === "moderate" || s === "med") return "Medium";
    if (s === "low" || s === "info" || s === "informational") return "Low";
  }
  if (cvssScore !== null) {
    if (cvssScore >= 9.0) return "Critical";
    if (cvssScore >= 7.0) return "High";
    if (cvssScore >= 4.0) return "Medium";
    return "Low";
  }
  if (currentRisk !== null) {
    if (currentRisk >= 75.0) return "Critical";
    if (currentRisk >= 45.0) return "High";
    if (currentRisk >= 25.0) return "Medium";
    return "Low";
  }
  return "Medium";
}

function classifyBusinessImportance(rawCrit: any): [string, number | null] {
  if (rawCrit === null || rawCrit === undefined || String(rawCrit).trim() === "") {
    return ["Unknown", null];
  }
  const s = String(rawCrit).trim().toLowerCase();
  if (["mission critical", "critical", "tier 0", "tier 1"].includes(s)) {
    return ["Mission Critical", 95.0];
  }
  if (s === "high") return ["High", 80.0];
  if (["medium", "moderate"].includes(s)) return ["Medium", 55.0];
  if (s === "low") return ["Low", 25.0];

  const num = safeFloat(rawCrit);
  if (num !== null) {
    const bounded = Math.max(0.0, Math.min(100.0, num));
    if (bounded >= 85.0) return ["Mission Critical", bounded];
    if (bounded >= 65.0) return ["High", bounded];
    if (bounded >= 35.0) return ["Medium", bounded];
    return ["Low", bounded];
  }
  return ["Unknown", null];
}

function classifyExposure(rawExposure: any, internetExposed: any): string {
  if (typeof internetExposed === "boolean") {
    return internetExposed ? "Internet Exposed" : "Restricted/Internal";
  }
  if (internetExposed !== null && internetExposed !== undefined) {
    const s = String(internetExposed).trim().toLowerCase();
    if (["true", "yes", "1", "internet", "public", "external", "internet exposed"].includes(s)) {
      return "Internet Exposed";
    }
    if (["false", "no", "0", "internal", "private", "restricted"].includes(s)) {
      return "Restricted/Internal";
    }
  }
  if (rawExposure !== null && rawExposure !== undefined) {
    const s = String(rawExposure).trim().toLowerCase();
    if (s.includes("internet") || s.includes("public") || s.includes("external")) {
      return "Internet Exposed";
    }
    if (s.includes("internal") || s.includes("restricted") || s.includes("private")) {
      return "Internal";
    }
    const num = safeFloat(rawExposure);
    if (num !== null) {
      if (num >= 70.0) return "Internet Exposed";
      if (num >= 35.0) return "Internal";
      return "Restricted/Internal";
    }
  }
  return "Unknown";
}

function classifyThreatExploitability(
  exploitability: number | null,
  threatActivity: number | null,
  exploitAvailable: any
): string {
  if (
    exploitAvailable === true ||
    ["true", "yes", "1", "active"].includes(
      String(exploitAvailable || "")
        .trim()
        .toLowerCase()
    )
  ) {
    if ((exploitability || 0) >= 75.0 || (threatActivity || 0) >= 80.0) {
      return "Active / Exploited";
    }
    return "High Exploitability";
  }
  const scores = [exploitability, threatActivity].filter(
    (x): x is number => x !== null && x !== undefined
  );
  if (!scores.length) return "Unknown";
  const maxScore = Math.max(...scores);
  if (maxScore >= 85.0) return "Active / Exploited";
  if (maxScore >= 70.0) return "High Exploitability";
  if (maxScore >= 40.0) return "Moderate";
  return "Low";
}

export function evaluateAndProfileRisk(
  raw: Record<string, any>,
  displayCurrency: string = "INR"
) {
  const riskId = String(raw.risk_id || raw.id || "unidentified_risk").trim();
  const riskName = String(
    raw.risk_name || raw.title || raw.name || riskId
  ).trim();
  const assetName = String(raw.asset_name || raw.asset || "Enterprise Asset").trim();
  const vulnName = raw.vulnerability_name || raw.cve_id || raw.vulnerability || null;
  const cveId = raw.cve_id || null;
  const remediationName =
    raw.remediation_name || raw.remediation || raw.control_name || null;
  const remediationCategory = String(
    raw.remediation_category || raw.category || "Vulnerability Remediation"
  ).trim();

  const cvssScore = safeFloat(raw.cvss_score ?? raw.cvss);
  const currentRisk = safeFloat(raw.current_risk ?? raw.residual_risk);
  const expectedResidualRisk = safeFloat(
    raw.expected_residual_risk ?? raw.post_remediation_risk
  );
  const explicitRiskReduction = safeFloat(
    raw.expected_risk_reduction ?? raw.risk_reduction
  );

  // Cost in INR
  const rawCost = safeFloat(raw.remediation_cost ?? raw.cost);
  const rawCurrency = String(raw.currency || "INR")
    .trim()
    .toUpperCase();
  let costInr: number | null = null;
  if (rawCost !== null && rawCost > 0) {
    if (SUPPORTED_CURRENCIES[rawCurrency]) {
      costInr = Number(
        (rawCost * Number(SUPPORTED_CURRENCIES[rawCurrency].rate_to_inr)).toFixed(2)
      );
    } else {
      costInr = Number(rawCost.toFixed(2));
    }
  }

  const rawStatus = String(
    raw.risk_status || raw.status || raw.remediation_state || "Open"
  )
    .trim()
    .toLowerCase();
  const isAlreadyRemediated =
    REMEDIATED_STATUSES.has(rawStatus) || raw.already_remediated === true;

  let derivedResidual: number | null = expectedResidualRisk;
  let derivedReduction: number | null = null;

  if (currentRisk !== null && currentRisk >= 0) {
    if (derivedResidual !== null && derivedResidual >= 0) {
      if (derivedResidual <= currentRisk) {
        derivedReduction = Number((currentRisk - derivedResidual).toFixed(2));
      }
    } else if (explicitRiskReduction !== null && explicitRiskReduction >= 0) {
      derivedReduction = Number(
        Math.min(currentRisk, explicitRiskReduction).toFixed(2)
      );
      derivedResidual = Number(
        Math.max(0.0, currentRisk - derivedReduction).toFixed(2)
      );
    }
  }

  let riskReductionPercent: number | null = null;
  if (
    currentRisk !== null &&
    currentRisk > 0 &&
    derivedReduction !== null &&
    derivedReduction >= 0
  ) {
    riskReductionPercent = Number(
      ((derivedReduction / currentRisk) * 100.0).toFixed(2)
    );
  }

  const severity = classifySeverity(
    raw.severity || raw.risk_level,
    cvssScore,
    currentRisk
  );
  const [businessImportance, businessCritScore] = classifyBusinessImportance(
    raw.business_criticality ?? raw.asset_criticality
  );
  const exposureClass = classifyExposure(raw.exposure, raw.internet_exposed);
  const exploitability = safeFloat(
    raw.exploitability_score ?? raw.exploitability
  );
  const threatActivity = safeFloat(raw.threat_activity ?? raw.activity_level);
  const threatClass = classifyThreatExploitability(
    exploitability,
    threatActivity,
    raw.exploit_available
  );

  const ealInr = safeFloat(raw.eal);
  let expectedEalReductionInr = safeFloat(raw.expected_eal_reduction);
  if (
    expectedEalReductionInr === null &&
    ealInr !== null &&
    riskReductionPercent !== null
  ) {
    expectedEalReductionInr = Number(
      (ealInr * (riskReductionPercent / 100.0)).toFixed(2)
    );
  }

  let remediationState = "Remediable";
  let eligibilityStatus = "Eligible";
  let ineligibilityReason: string | null = null;

  if (isAlreadyRemediated) {
    remediationState = "Already Remediated";
    eligibilityStatus = "Already Remediated";
    ineligibilityReason =
      "This risk is already resolved/remediated in CRISP and is excluded from new recommended spending.";
  } else if (costInr === null || costInr <= 0) {
    remediationState = "Cost unavailable";
    eligibilityStatus = "Data Insufficient";
    ineligibilityReason =
      "This risk could not be included in the budget optimization because remediation cost data is unavailable.";
  } else if (
    currentRisk === null ||
    currentRisk <= 0 ||
    derivedReduction === null ||
    derivedReduction <= 0
  ) {
    remediationState = "Risk reduction unavailable";
    eligibilityStatus = "Data Insufficient";
    ineligibilityReason =
      "This risk could not be included in the budget optimization because expected risk reduction / residual risk data is unavailable.";
  }

  let budgetEfficiencyPerLakh: number | null = null;
  let budgetEfficiencyRaw: number | null = null;
  if (costInr !== null && costInr > 0 && derivedReduction !== null && derivedReduction > 0) {
    budgetEfficiencyRaw = derivedReduction / costInr;
    budgetEfficiencyPerLakh = Number(
      ((derivedReduction / costInr) * 100000.0).toFixed(4)
    );
  }

  const sevWeight = { Critical: 1.0, High: 0.8, Medium: 0.5, Low: 0.25 }[severity] ?? 0.5;
  const bizWeight =
    businessCritScore !== null ? businessCritScore / 100.0 : 0.5;
  const expWeight = {
    "Internet Exposed": 1.0,
    Internal: 0.6,
    "Restricted/Internal": 0.4,
    Unknown: 0.5,
  }[exposureClass] ?? 0.5;
  const thtWeight = {
    "Active / Exploited": 1.0,
    "High Exploitability": 0.8,
    Moderate: 0.5,
    Low: 0.3,
    Unknown: 0.5,
  }[threatClass] ?? 0.5;

  let compositePriorityScore: number | null = null;
  if (derivedReduction !== null && derivedReduction > 0) {
    compositePriorityScore = Number(
      (
        derivedReduction * 0.65 +
        (cvssScore || 5.0) * 1.2 +
        sevWeight * 8.0 +
        bizWeight * 8.0 +
        expWeight * 5.0 +
        thtWeight * 5.0
      ).toFixed(3)
    );
  }

  const trace = {
    cvss_source:
      cvssScore !== null
        ? raw.source_type || "CRISP Vulnerability Dataset"
        : "Unavailable",
    current_risk_source:
      currentRisk !== null
        ? raw.source_type || "CRISP Deterministic Risk Model"
        : "Unavailable",
    remediation_cost_source:
      costInr !== null
        ? raw.remediation_source ||
          raw.source_type ||
          "CRISP Remediation & Investment Dataset"
        : "Missing",
    business_criticality_source:
      businessCritScore !== null
        ? raw.source_type || "CRISP Asset Context Register"
        : "Not specified",
    threat_source:
      threatClass !== "Unknown"
        ? raw.source_type || "CRISP Threat Intelligence Feed"
        : "Not specified",
    exposure_source:
      exposureClass !== "Unknown"
        ? raw.source_type || "CRISP Asset Exposure Telemetry"
        : "Not specified",
  };

  return {
    risk_id: riskId,
    risk_name: riskName,
    asset_name: assetName,
    vulnerability_name: vulnName,
    cve_id: cveId,
    remediation_name:
      remediationName ||
      (costInr !== null ? `Remediate ${riskName}` : null),
    remediation_category: remediationCategory,
    cvss_score: cvssScore,
    severity,
    business_importance: businessImportance,
    business_criticality_score: businessCritScore,
    exposure_classification: exposureClass,
    threat_classification: threatClass,
    remediation_state: remediationState,
    eligibility_status: eligibilityStatus,
    ineligibility_reason: ineligibilityReason,
    current_risk: currentRisk,
    expected_residual_risk: derivedResidual,
    risk_reduction: derivedReduction,
    expected_risk_reduction_percent: riskReductionPercent,
    remediation_cost_inr: costInr,
    remediation_cost: convertFromInr(costInr, displayCurrency),
    display_currency: displayCurrency,
    eal_inr: ealInr,
    eal: convertFromInr(ealInr, displayCurrency),
    expected_eal_reduction_inr: expectedEalReductionInr,
    expected_eal_reduction: convertFromInr(
      expectedEalReductionInr,
      displayCurrency
    ),
    budget_efficiency: budgetEfficiencyRaw,
    budget_efficiency_per_lakh_inr: budgetEfficiencyPerLakh,
    composite_priority_score: compositePriorityScore,
    projected_untreated_risk:
      currentRisk !== null
        ? Number(
            (
              currentRisk *
              (1 +
                Math.min(
                  0.5,
                  0.03 +
                    (threatActivity || 50) / 1000 +
                    (expWeight * 50) / 2000 +
                    (bizWeight * 50) / 4000
                ))
            ).toFixed(2)
          )
        : null,
    projected_untreated_risk_increase_percent: Number(
      (
        Math.min(
          0.5,
          0.03 +
            (threatActivity || 50) / 1000 +
            (expWeight * 50) / 2000 +
            (bizWeight * 50) / 4000
        ) * 100
      ).toFixed(1)
    ),
    traceability: trace,
  };
}

function comparePortfolios(
  comboA: any[],
  comboB: any[]
): number {
  const redA = Number(
    comboA.reduce((acc, r) => acc + (r.risk_reduction || 0), 0).toFixed(4)
  );
  const redB = Number(
    comboB.reduce((acc, r) => acc + (r.risk_reduction || 0), 0).toFixed(4)
  );
  if (redA !== redB) return redA > redB ? 1 : -1;

  const ealA = Number(
    comboA
      .reduce((acc, r) => acc + (r.expected_eal_reduction_inr || 0), 0)
      .toFixed(2)
  );
  const ealB = Number(
    comboB
      .reduce((acc, r) => acc + (r.expected_eal_reduction_inr || 0), 0)
      .toFixed(2)
  );
  if (ealA !== ealB) return ealA > ealB ? 1 : -1;

  const chA = comboA.filter(
    (r) => r.severity === "Critical" || r.severity === "High"
  ).length;
  const chB = comboB.filter(
    (r) => r.severity === "Critical" || r.severity === "High"
  ).length;
  if (chA !== chB) return chA > chB ? 1 : -1;

  const bizA = Number(
    comboA
      .reduce((acc, r) => acc + (r.business_criticality_score || 0), 0)
      .toFixed(2)
  );
  const bizB = Number(
    comboB
      .reduce((acc, r) => acc + (r.business_criticality_score || 0), 0)
      .toFixed(2)
  );
  if (bizA !== bizB) return bizA > bizB ? 1 : -1;

  const costA = Number(
    comboA.reduce((acc, r) => acc + (r.remediation_cost_inr || 0), 0).toFixed(2)
  );
  const costB = Number(
    comboB.reduce((acc, r) => acc + (r.remediation_cost_inr || 0), 0).toFixed(2)
  );
  if (costA !== costB) return costA < costB ? 1 : -1;

  const idsA = comboA.map((r) => r.risk_id).sort().join("|");
  const idsB = comboB.map((r) => r.risk_id).sort().join("|");
  if (idsA !== idsB) return idsA < idsB ? 1 : -1;
  return 0;
}

function solveOptimalPortfolio(eligibleRisks: any[], budgetInr: number): any[] {
  if (budgetInr <= 0 || !eligibleRisks.length) return [];

  const feasibleSingle = eligibleRisks.filter(
    (r) => (r.remediation_cost_inr || 0) <= budgetInr
  );
  if (!feasibleSingle.length) return [];

  const totalCost = feasibleSingle.reduce(
    (acc, r) => acc + (r.remediation_cost_inr || 0),
    0
  );
  if (totalCost <= budgetInr) {
    return [...feasibleSingle].sort((a, b) => {
      const diff = (b.risk_reduction || 0) - (a.risk_reduction || 0);
      return diff !== 0 ? diff : String(a.risk_id).localeCompare(String(b.risk_id));
    });
  }

  const ordered = [...feasibleSingle].sort((a, b) => {
    const effDiff = (b.budget_efficiency || 0) - (a.budget_efficiency || 0);
    if (effDiff !== 0) return effDiff;
    const redDiff = (b.risk_reduction || 0) - (a.risk_reduction || 0);
    if (redDiff !== 0) return redDiff;
    return String(a.risk_id).localeCompare(String(b.risk_id));
  });

  const n = ordered.length;
  const suffixReduction = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    suffixReduction[i] =
      suffixReduction[i + 1] + (ordered[i].risk_reduction || 0);
  }

  let bestCombo: any[] = [];
  let bestReduction = -1;

  function backtrack(
    idx: number,
    currentList: any[],
    currentCost: number,
    currentRed: number
  ) {
    if (
      comparePortfolios(currentList, bestCombo) > 0 ||
      bestReduction < 0
    ) {
      bestCombo = [...currentList];
      bestReduction = bestCombo.reduce(
        (acc, r) => acc + (r.risk_reduction || 0),
        0
      );
    }
    if (idx >= n) return;
    if (currentRed + suffixReduction[idx] + 1e-9 < bestReduction) {
      return;
    }

    const item = ordered[idx];
    const itemCost = item.remediation_cost_inr || 0;
    const itemRed = item.risk_reduction || 0;

    if (currentCost + itemCost <= budgetInr + 1e-9) {
      currentList.push(item);
      backtrack(
        idx + 1,
        currentList,
        currentCost + itemCost,
        currentRed + itemRed
      );
      currentList.pop();
    }
    backtrack(idx + 1, currentList, currentCost, currentRed);
  }

  backtrack(0, [], 0, 0);
  return bestCombo.sort((a, b) => {
    const diff = (b.risk_reduction || 0) - (a.risk_reduction || 0);
    return diff !== 0 ? diff : String(a.risk_id).localeCompare(String(b.risk_id));
  });
}

export interface ServerDatasetMeta {
  hasUploadedDataset: boolean;
  datasetBudget: number | null;
  datasetCurrency: string;
  companyName: string | null;
}

export function loadCrispRisksFromServer(): [Record<string, any>[], string, ServerDatasetMeta] {
  const snapshot = getServerUploadedSnapshot();
  if (
    snapshot &&
    snapshot.result &&
    Array.isArray(snapshot.result.valid_records) &&
    snapshot.result.valid_records.length > 0
  ) {
    const valid = snapshot.result.valid_records;
    const enriched = valid.map((r: any) => ({
      ...r,
      source_type: `Uploaded Dataset (${(snapshot.source_files || ["dataset"]).join(", ")})`,
    }));

    const firstRec = valid[0] || {};
    const rawBudget =
      firstRec.available_budget ??
      firstRec.security_budget ??
      snapshot.result.optimization?.available_budget ??
      snapshot.result.dataset_budget ??
      null;
    const budgetNum = rawBudget !== null && rawBudget !== undefined ? Number(rawBudget) : null;
    const currencyStr = String(firstRec.currency || snapshot.result.dataset_currency || "INR").toUpperCase();
    const compName = firstRec.company_name || snapshot.result.company_name || null;

    return [
      enriched,
      `Uploaded Dataset (${(snapshot.source_files || ["dataset"]).join(", ")})`,
      {
        hasUploadedDataset: true,
        datasetBudget: Number.isFinite(budgetNum) ? budgetNum : null,
        datasetCurrency: currencyStr,
        companyName: compName,
      },
    ];
  }

  return [
    [],
    "No dataset uploaded",
    {
      hasUploadedDataset: false,
      datasetBudget: null,
      datasetCurrency: "INR",
      companyName: null,
    },
  ];
}

export function runServerBudgetOptimization(
  availableBudget: number,
  currency: string = "INR",
  rawRisks?: Record<string, any>[],
  datasetSource: string = "CRISP Enterprise Risk Register"
) {
  const budgetInfo = normalizeCurrency(availableBudget, currency);
  const displayCurrency = budgetInfo.entered_currency;
  const budgetInr = budgetInfo.normalized_amount_inr;
  const rawList = rawRisks ?? [];

  const cachePayload = JSON.stringify({
    b: budgetInr,
    c: displayCurrency,
    src: datasetSource,
    r: rawList,
  });
  const cacheKey = crypto
    .createHash("sha256")
    .update(cachePayload)
    .digest("hex");

  const cached = globalForOptimizer.crispOptimizationCache?.get(cacheKey);
  if (cached) return cached;

  const warnings: string[] = [];

  if (!rawList.length) {
    return {
      status: "no_data",
      dataset_source: datasetSource,
      budget: budgetInfo,
      recommended_investment: 0,
      recommended_investment_inr: 0,
      remaining_budget: budgetInfo.entered_amount,
      remaining_budget_inr: budgetInr,
      total_eligible_remediation_cost: 0,
      total_eligible_remediation_cost_inr: 0,
      budget_constraint_active: false,
      selected_count: 0,
      deferred_count: 0,
      data_insufficient_count: 0,
      already_remediated_count: 0,
      total_current_risk: 0,
      total_post_remediation_risk: 0,
      total_risk_reduction: 0,
      overall_risk_reduction_percent: 0,
      total_current_eal: 0,
      total_eal_reduction: 0,
      selected_risks: [],
      deferred_risks: [],
      data_insufficient_risks: [],
      already_remediated_risks: [],
      all_risk_allocations: [],
      category_breakdown: [],
      classification_summary: {
        by_severity: { Critical: 0, High: 0, Medium: 0, Low: 0 },
        by_state: {
          Selected: 0,
          Deferred: 0,
          "Data Insufficient": 0,
          "Already Remediated": 0,
        },
        by_exposure: {},
        by_business_importance: {},
      },
      explanation: {
        headline: "No risk data available for optimization.",
        summary:
          "CRISP requires eligible risk and remediation records before a budget allocation can be calculated.",
        details: [],
        unused_budget_reason: null,
      },
      warnings: ["No risk records were found in the current dataset."],
    };
  }

  const seenIds = new Set<string>();
  const dedupedRaw: Record<string, any>[] = [];
  let duplicateCount = 0;

  for (const item of rawList) {
    let rid = String(item.risk_id || item.id || "").trim();
    const copy = { ...item };
    if (!rid) {
      rid = `anon_${dedupedRaw.length + 1}`;
      copy.risk_id = rid;
    }
    if (seenIds.has(rid)) {
      duplicateCount++;
      continue;
    }
    seenIds.add(rid);
    dedupedRaw.push(copy);
  }

  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} duplicate risk record(s) were detected and deduplicated by risk ID.`
    );
  }

  const profiled = dedupedRaw.map((r) =>
    evaluateAndProfileRisk(r, displayCurrency)
  );
  const eligible = profiled.filter((r) => r.eligibility_status === "Eligible");
  const dataInsufficient = profiled.filter(
    (r) => r.eligibility_status === "Data Insufficient"
  );
  const alreadyRemediated = profiled.filter(
    (r) => r.eligibility_status === "Already Remediated"
  );

  const missingCostCount = dataInsufficient.filter(
    (r) => r.remediation_state === "Cost unavailable"
  ).length;
  const missingRedCount = dataInsufficient.filter(
    (r) => r.remediation_state === "Risk reduction unavailable"
  ).length;

  if (missingCostCount > 0) {
    warnings.push(
      `${missingCostCount} risk(s) could not be considered because remediation cost data is missing or invalid.`
    );
  }
  if (missingRedCount > 0) {
    warnings.push(
      `Expected risk reduction could not be calculated for ${missingRedCount} risk(s) because residual-risk information is unavailable.`
    );
  }
  if (alreadyRemediated.length > 0) {
    warnings.push(
      `${alreadyRemediated.length} risk(s) are already marked as remediated and were excluded from new spending.`
    );
  }

  const selectedRaw = solveOptimalPortfolio(eligible, budgetInr);
  const selectedIds = new Set(selectedRaw.map((r) => r.risk_id));

  const recommendedInr = Number(
    selectedRaw
      .reduce((acc, r) => acc + (r.remediation_cost_inr || 0), 0)
      .toFixed(2)
  );
  const remainingInr = Number(Math.max(0, budgetInr - recommendedInr).toFixed(2));
  const totalEligibleCostInr = Number(
    eligible
      .reduce((acc, r) => acc + (r.remediation_cost_inr || 0), 0)
      .toFixed(2)
  );

  const recommendedDisplay = convertFromInr(recommendedInr, displayCurrency) ?? 0;
  const remainingDisplay = Number(
    Math.max(0, budgetInfo.entered_amount - recommendedDisplay).toFixed(2)
  );

  const selectedRisks = selectedRaw.map((r) => ({
    ...r,
    optimization_state: "Selected for Remediation",
    allocated_budget_inr: r.remediation_cost_inr,
    allocated_budget: r.remediation_cost,
    allocation_share_percent:
      recommendedInr > 0
        ? Number(((r.remediation_cost_inr / recommendedInr) * 100).toFixed(1))
        : 0,
    post_optimization_risk: r.expected_residual_risk,
    decision_reason: `Selected: Reduces modeled risk by ${r.risk_reduction} pts (${r.expected_risk_reduction_percent}%) on ${r.business_importance} asset.`,
  }));

  const deferredRisks = eligible
    .filter((r) => !selectedIds.has(r.risk_id))
    .map((r) => {
      const costInr = r.remediation_cost_inr || 0;
      let reason = "Deferred under current portfolio optimization constraints.";
      if (budgetInr === 0) {
        reason =
          "Budget constraint: Available budget is zero; all eligible remediations are deferred.";
      } else if (costInr > budgetInr) {
        reason = `Budget constraint: Remediation cost (${budgetInfo.currency_symbol}${Number(r.remediation_cost || 0).toLocaleString()}) exceeds total available budget (${budgetInfo.currency_symbol}${budgetInfo.entered_amount.toLocaleString()}).`;
      } else if (costInr > remainingInr && selectedRisks.length > 0) {
        reason =
          "Lower portfolio value than selected combination: Available budget achieved higher total risk reduction by funding the selected portfolio combination.";
      }
      return {
        ...r,
        optimization_state: "Deferred",
        allocated_budget_inr: 0,
        allocated_budget: 0,
        allocation_share_percent: 0,
        post_optimization_risk: r.current_risk,
        decision_reason: reason,
      };
    });

  const annotatedInsufficient = dataInsufficient.map((r) => ({
    ...r,
    optimization_state: "Data Insufficient",
    allocated_budget_inr: 0,
    allocated_budget: 0,
    allocation_share_percent: 0,
    post_optimization_risk: r.current_risk,
    decision_reason:
      r.ineligibility_reason || "Insufficient data for optimization.",
  }));

  const annotatedRemediated = alreadyRemediated.map((r) => ({
    ...r,
    optimization_state: "Already Remediated",
    allocated_budget_inr: 0,
    allocated_budget: 0,
    allocation_share_percent: 0,
    post_optimization_risk: r.current_risk || 0,
    decision_reason:
      r.ineligibility_reason || "Already remediated; no new spend required.",
  }));

  const allAllocations = [
    ...selectedRisks,
    ...deferredRisks,
    ...annotatedInsufficient,
    ...annotatedRemediated,
  ];

  const activeWithRisk = [
    ...selectedRisks,
    ...deferredRisks,
    ...annotatedInsufficient,
  ].filter((r) => r.current_risk !== null);

  const totalCurrentRisk = Number(
    activeWithRisk
      .reduce((acc, r) => acc + (r.current_risk || 0), 0)
      .toFixed(2)
  );
  const totalPostRisk = Number(
    activeWithRisk
      .reduce(
        (acc, r) =>
          acc +
          (r.optimization_state === "Selected for Remediation" &&
          r.expected_residual_risk !== null
            ? r.expected_residual_risk
            : r.current_risk || 0),
        0
      )
      .toFixed(2)
  );
  const totalRiskReduction = Number(
    Math.max(0, totalCurrentRisk - totalPostRisk).toFixed(2)
  );
  const overallReductionPct =
    totalCurrentRisk > 0
      ? Number(((totalRiskReduction / totalCurrentRisk) * 100).toFixed(2))
      : 0;

  const totalCurrentEalInr = Number(
    activeWithRisk.reduce((acc, r) => acc + (r.eal_inr || 0), 0).toFixed(2)
  );
  const totalEalReductionInr = Number(
    selectedRisks
      .reduce((acc, r) => acc + (r.expected_eal_reduction_inr || 0), 0)
      .toFixed(2)
  );

  // Category Breakdown
  const catMap = new Map<
    string,
    {
      category: string;
      allocated_inr: number;
      risk_count: number;
      risk_reduction: number;
    }
  >();

  for (const r of selectedRisks) {
    const cat = r.remediation_category || "Vulnerability Remediation";
    const existing = catMap.get(cat) || {
      category: cat,
      allocated_inr: 0,
      risk_count: 0,
      risk_reduction: 0,
    };
    existing.allocated_inr = Number(
      (existing.allocated_inr + (r.allocated_budget_inr || 0)).toFixed(2)
    );
    existing.risk_count += 1;
    existing.risk_reduction = Number(
      (existing.risk_reduction + (r.risk_reduction || 0)).toFixed(2)
    );
    catMap.set(cat, existing);
  }

  const categoryBreakdown = Array.from(catMap.values())
    .sort((a, b) => b.allocated_inr - a.allocated_inr)
    .map((c) => ({
      category: c.category,
      allocated: convertFromInr(c.allocated_inr, displayCurrency) ?? 0,
      allocated_inr: c.allocated_inr,
      risk_count: c.risk_count,
      risk_reduction: c.risk_reduction,
      share_of_allocated_percent:
        recommendedInr > 0
          ? Number(((c.allocated_inr / recommendedInr) * 100).toFixed(1))
          : 0,
      share_of_total_budget_percent:
        budgetInr > 0
          ? Number(((c.allocated_inr / budgetInr) * 100).toFixed(1))
          : 0,
    }));

  const bySeverity: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  const byExposure: Record<string, number> = {};
  const byImportance: Record<string, number> = {};

  for (const r of profiled) {
    if (bySeverity[r.severity] !== undefined) {
      bySeverity[r.severity] += 1;
    }
    byExposure[r.exposure_classification] =
      (byExposure[r.exposure_classification] || 0) + 1;
    byImportance[r.business_importance] =
      (byImportance[r.business_importance] || 0) + 1;
  }

  const budgetConstraintActive =
    deferredRisks.length > 0 && budgetInr < totalEligibleCostInr;

  const explanationDetails: string[] = [];
  let unusedBudgetReason: string | null = null;
  let headline = "";
  let summary = "";

  if (budgetInr === 0) {
    headline = "Zero budget supplied — all eligible remediations deferred.";
    summary = `With an available budget of ${budgetInfo.currency_symbol}0, no remediations can be funded. All ${deferredRisks.length} eligible risk(s) remain untreated at a total modeled risk of ${totalCurrentRisk}.`;
  } else if (!eligible.length) {
    headline = "No eligible risks could be optimized.";
    summary =
      "None of the available risk records contained both valid remediation costs and valid risk-reduction data.";
  } else if (selectedRisks.length === 0 && deferredRisks.length > 0) {
    const minCostRisk = deferredRisks.reduce((prev, curr) =>
      (curr.remediation_cost || Infinity) < (prev.remediation_cost || Infinity)
        ? curr
        : prev
    );
    headline =
      "Budget Constraint Active — available budget is below the lowest eligible remediation cost.";
    summary = `The entered budget (${budgetInfo.currency_symbol}${budgetInfo.entered_amount.toLocaleString()}) is lower than the minimum individual remediation cost (${budgetInfo.currency_symbol}${Number(minCostRisk.remediation_cost || 0).toLocaleString()} for ${minCostRisk.risk_name}).`;
    unusedBudgetReason = `All ${budgetInfo.currency_symbol}${remainingDisplay.toLocaleString()} remains unallocated because every eligible remediation costs more than the available budget.`;
  } else {
    headline = `Selected ${selectedRisks.length} of ${eligible.length} eligible remediation(s) to achieve ${overallReductionPct}% overall portfolio risk reduction.`;
    summary = `The optimizer evaluated all feasible remediation combinations within your ${budgetInfo.currency_symbol}${budgetInfo.entered_amount.toLocaleString()} ${displayCurrency} budget and selected the portfolio that maximizes total modeled risk reduction (${totalRiskReduction} points reduced, from ${totalCurrentRisk} to ${totalPostRisk}).`;

    if (deferredRisks.length > 0 && selectedRisks.length >= 2) {
      const maxDef = [...deferredRisks].sort(
        (a, b) =>
          (b.cvss_score || 0) - (a.cvss_score || 0) ||
          (b.remediation_cost_inr || 0) - (a.remediation_cost_inr || 0)
      )[0];
      if (
        (maxDef.remediation_cost_inr || 0) <= budgetInr &&
        (maxDef.risk_reduction || 0) < totalRiskReduction
      ) {
        explanationDetails.push(
          `Portfolio Combination Advantage: Rather than spending ${budgetInfo.currency_symbol}${Number(maxDef.remediation_cost || 0).toLocaleString()} on single risk '${maxDef.risk_name}' (CVSS ${maxDef.cvss_score ?? "N/A"}, reduction ${maxDef.risk_reduction} pts), funding the selected combination of ${selectedRisks.length} risks achieves ${totalRiskReduction} pts of total risk reduction.`
        );
      }
    }

    if (remainingInr > 0) {
      if (deferredRisks.length === 0) {
        unusedBudgetReason = `${budgetInfo.currency_symbol}${remainingDisplay.toLocaleString()} remains unallocated because all ${selectedRisks.length} eligible remediations with verified risk reduction have been fully funded. CRISP does not force spending beyond justified remediations.`;
      } else {
        const minDefCost = Math.min(
          ...deferredRisks.map((r) => r.remediation_cost ?? Infinity)
        );
        unusedBudgetReason = `${budgetInfo.currency_symbol}${remainingDisplay.toLocaleString()} remains unallocated because the lowest-cost remaining deferred remediation requires ${budgetInfo.currency_symbol}${minDefCost.toLocaleString()}.`;
      }
    }
  }

  const result = {
    status: "ok",
    dataset_source: datasetSource,
    budget: budgetInfo,
    recommended_investment: recommendedDisplay,
    recommended_investment_inr: recommendedInr,
    remaining_budget: remainingDisplay,
    remaining_budget_inr: remainingInr,
    total_eligible_remediation_cost:
      convertFromInr(totalEligibleCostInr, displayCurrency) ?? 0,
    total_eligible_remediation_cost_inr: totalEligibleCostInr,
    budget_constraint_active: budgetConstraintActive,
    selected_count: selectedRisks.length,
    deferred_count: deferredRisks.length,
    data_insufficient_count: annotatedInsufficient.length,
    already_remediated_count: annotatedRemediated.length,
    total_current_risk: totalCurrentRisk,
    total_post_remediation_risk: totalPostRisk,
    total_risk_reduction: totalRiskReduction,
    overall_risk_reduction_percent: overallReductionPct,
    total_current_eal:
      convertFromInr(totalCurrentEalInr, displayCurrency) ?? 0,
    total_eal_reduction:
      convertFromInr(totalEalReductionInr, displayCurrency) ?? 0,
    selected_risks: selectedRisks,
    deferred_risks: deferredRisks,
    data_insufficient_risks: annotatedInsufficient,
    already_remediated_risks: annotatedRemediated,
    all_risk_allocations: allAllocations,
    category_breakdown: categoryBreakdown,
    classification_summary: {
      by_severity: bySeverity,
      by_state: {
        Selected: selectedRisks.length,
        Deferred: deferredRisks.length,
        "Data Insufficient": annotatedInsufficient.length,
        "Already Remediated": annotatedRemediated.length,
      },
      by_exposure: byExposure,
      by_business_importance: byImportance,
    },
    explanation: {
      headline,
      summary,
      details: explanationDetails,
      unused_budget_reason: unusedBudgetReason,
    },
    warnings,
  };

  globalForOptimizer.crispOptimizationCache?.set(cacheKey, result);

  // Sync to server snapshot so Company Data (Risks, Assets, Vulnerabilities) immediately reflect the optimizer
  const snapshotRecords = allAllocations.map((r) => ({
    ...r,
    asset: r.asset_name || r.asset || "Enterprise Asset",
    asset_name: r.asset_name || r.asset || "Enterprise Asset",
    business_criticality: r.business_criticality_score ?? r.business_criticality ?? 50,
    projected_untreated_risk: Number(((r.current_risk || 0) * 1.15).toFixed(2)),
    projected_untreated_risk_increase_percent: 15.0,
    remediation_action: r.remediation_name,
    remediation_name: r.remediation_name,
    severity: r.severity || "MEDIUM",
  }));

  setServerUploadedSnapshot({
    id: Date.now(),
    created_at: new Date().toISOString(),
    source_files: [datasetSource],
    result: {
      source_files: [datasetSource],
      valid_records: snapshotRecords,
      invalid_records: [],
      valid_count: snapshotRecords.length,
      invalid_count: 0,
      optimization: {
        available_budget: budgetInfo.entered_amount,
        allocated_budget: recommendedDisplay,
        recommended_total_investment: recommendedDisplay,
        recommended_investment: recommendedDisplay,
        remaining_budget: remainingDisplay,
        selected_risks: selectedRisks,
        deferred_risks: deferredRisks,
        total_current_risk: totalCurrentRisk,
        total_post_remediation_risk: totalPostRisk,
        estimated_post_remediation_risk: totalPostRisk,
        total_risk_reduction: totalRiskReduction,
        total_estimated_risk_reduction: totalRiskReduction,
        overall_risk_reduction_percent: overallReductionPct,
        recommendation: summary,
      },
      budget_optimizer_result: result,
    },
  });

  return result;
}
