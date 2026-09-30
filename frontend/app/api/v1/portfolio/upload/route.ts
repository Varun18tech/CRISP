import { NextRequest, NextResponse } from "next/server";
import {
  runServerBudgetOptimization,
  setServerUploadedSnapshot,
} from "@/lib/server/budget-optimizer-engine";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

function parseRobustDelimitedText(text: string, delimiter: string = ","): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new Error("dataset must include a header row and at least one data row");
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const headerCount = headers.length;

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    // Check for standard quoted CSV or simple split
    let parts: string[] = [];
    if (rawLine.includes('"')) {
      // Regex parsing for quoted CSV
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      let match;
      while ((match = regex.exec(rawLine)) !== null) {
        let val = match[1] ?? "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        parts.push(val.trim());
        if (regex.lastIndex === rawLine.length) break;
      }
    } else {
      parts = rawLine.split(delimiter).map((p) => p.trim());
    }

    // Handle unquoted commas inside description/remediation columns
    if (parts.length > headerCount) {
      // If remediation_action is around index 28 and ends 7 fields before the end:
      const remIndex = headers.indexOf("remediation_action");
      if (remIndex !== -1 && remIndex < headerCount) {
        const rightCount = headerCount - 1 - remIndex;
        const prefix = parts.slice(0, remIndex);
        const suffix = parts.slice(parts.length - rightCount);
        const middle = parts.slice(remIndex, parts.length - rightCount).join(", ");
        parts = [...prefix, middle, ...suffix];
      } else {
        // Fallback: merge extra fields into the longest text column
        const prefix = parts.slice(0, headerCount - 1);
        const tail = parts.slice(headerCount - 1).join(", ");
        parts = [...prefix, tail];
      }
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = parts[idx] ?? "";
    });
    rows.push(rowObj);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ detail: "Invalid multipart form data" }, { status: 400 });
  }

  // 1. Try proxying to FastAPI backend if running on port 8000
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const upstream = await fetch(`${FASTAPI_URL}/portfolio/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }
  } catch {
    // FastAPI not running or rejected; process on Next.js server
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ detail: "select at least one dataset file" }, { status: 422 });
  }

  const valid: Record<string, any>[] = [];
  const errors: Record<string, any>[] = [];
  const budgets = new Set<number>();
  const sourceFiles: string[] = [];

  for (const file of files) {
    const filename = file.name || "dataset.csv";
    const suffix = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
    const text = await file.text();
    let rows: Record<string, any>[] = [];
    try {
      if (suffix === "json") {
        const parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
        rows = Array.isArray(parsed) ? parsed : parsed?.risks || parsed?.data || [];
      } else if (suffix === "csv" || suffix === "tsv") {
        rows = parseRobustDelimitedText(text, suffix === "tsv" ? "\t" : ",");
      } else {
        throw new Error("supported formats are CSV, TSV, and JSON");
      }
      sourceFiles.push(filename);
    } catch (err: any) {
      errors.push({ file: filename, message: err?.message || "Invalid file format" });
      continue;
    }

    rows.forEach((row, idx) => {
      // 1. Identify Risk ID & Name
      const riskId = String(row.risk_id || row.id || row.cve_id || `RISK-${idx + 1}`).trim();
      const riskName = String(
        row.risk_name || row.title || row.vulnerability_name || row.vulnerability || row.name || riskId
      ).trim();

      // 2. Identify Budget
      const rawBudget =
        row.available_budget ??
        row.security_budget ??
        row.budget ??
        row.total_budget ??
        row.annual_budget;
      const budgetNum = rawBudget !== undefined && rawBudget !== "" ? Number(String(rawBudget).replace(/,/g, "")) : 1000000;
      if (Number.isFinite(budgetNum) && budgetNum >= 0) {
        budgets.add(budgetNum);
      }

      // 3. Identify Remediation Cost
      const rawCost =
        row.remediation_cost ??
        row.cost ??
        row.investment_cost ??
        row.estimated_cost;
      const remCost = rawCost !== undefined && rawCost !== "" ? Number(String(rawCost).replace(/,/g, "")) : 400000;

      // 4. Calculate or Parse Current Risk
      let currentRisk: number;
      if (row.current_risk !== undefined && row.current_risk !== "" && Number.isFinite(Number(row.current_risk))) {
        currentRisk = Number(row.current_risk);
      } else if (row.residual_risk !== undefined && row.residual_risk !== "" && Number.isFinite(Number(row.residual_risk))) {
        currentRisk = Number(row.residual_risk);
      } else {
        // Compute from risk constituents using CRISP model
        const e = Number(row.exploitability || 50);
        const t = Number(row.threat_activity || 50);
        const isInternet = String(row.internet_exposed || "").toLowerCase() === "true";
        const x = Number(row.exposure || (isInternet ? 90 : 40));
        const cvss = row.cvss_score !== undefined && row.cvss_score !== "" ? Number(row.cvss_score) : 5.0;
        const v = Math.min(100, cvss * 10);
        const h = Number(row.historical_incident_frequency || row.historical_incidents || 30);
        const likelihood = 0.30 * e + 0.25 * t + 0.20 * x + 0.15 * v + 0.10 * h;

        const f = Number(row.financial_impact || 50);
        const s = Number(row.data_sensitivity || 50);
        const c = Number(row.business_criticality || 50);
        const r = Number(row.regulatory_impact || 50);
        const a = Number(row.availability_impact || 50);
        const impact = 0.30 * f + 0.25 * s + 0.20 * c + 0.15 * r + 0.10 * a;

        const inherent = (likelihood * impact) / 100;
        const ctlEff = Number(row.control_effectiveness || 0);
        const ctlCov = Number(row.control_coverage || 100);
        const effectiveCtl = (ctlEff * ctlCov) / 100;
        currentRisk = Number(Math.max(0, inherent * (1 - effectiveCtl / 100)).toFixed(2));
      }

      // 5. Calculate or Parse Expected Residual Risk & Risk Reduction
      let residualRisk: number;
      if (
        row.expected_residual_risk !== undefined &&
        row.expected_residual_risk !== "" &&
        Number.isFinite(Number(row.expected_residual_risk))
      ) {
        residualRisk = Number(row.expected_residual_risk);
      } else if (
        row.post_remediation_risk !== undefined &&
        row.post_remediation_risk !== "" &&
        Number.isFinite(Number(row.post_remediation_risk))
      ) {
        residualRisk = Number(row.post_remediation_risk);
      } else if (
        row.remediation_effectiveness !== undefined &&
        row.remediation_effectiveness !== "" &&
        Number.isFinite(Number(row.remediation_effectiveness))
      ) {
        const remEff = Number(row.remediation_effectiveness);
        residualRisk = Number(Math.max(0, currentRisk * (1 - remEff / 100)).toFixed(2));
      } else if (
        row.expected_risk_reduction !== undefined &&
        row.expected_risk_reduction !== "" &&
        Number.isFinite(Number(row.expected_risk_reduction))
      ) {
        residualRisk = Number(Math.max(0, currentRisk - Number(row.expected_risk_reduction)).toFixed(2));
      } else {
        residualRisk = Number(Math.max(0, currentRisk * 0.25).toFixed(2));
      }

      if (
        !riskId ||
        !riskName ||
        !Number.isFinite(currentRisk) ||
        !Number.isFinite(residualRisk) ||
        !Number.isFinite(remCost) ||
        remCost <= 0
      ) {
        errors.push({
          file: filename,
          line: idx + 2,
          risk_id: riskId || null,
          message: "Invalid or missing required risk fields",
        });
        return;
      }

      const riskReduction = Number(Math.max(0, currentRisk - residualRisk).toFixed(2));
      const redPercent = currentRisk > 0 ? Number(((riskReduction / currentRisk) * 100).toFixed(2)) : 0;

      // Calculate EAL if incident frequency and loss per incident are available
      let eal: number | null = null;
      let ealRed: number | null = null;
      if (row.annual_incident_frequency && row.expected_loss_per_incident) {
        const freq = Number(row.annual_incident_frequency);
        const loss = Number(row.expected_loss_per_incident);
        if (Number.isFinite(freq) && Number.isFinite(loss)) {
          eal = Number((freq * loss).toFixed(2));
          ealRed = Number((eal * (redPercent / 100)).toFixed(2));
        }
      }

      const threatVal = Number(row.threat_activity ?? 50);
      const expoVal = Number(row.exposure ?? (String(row.internet_exposed).toLowerCase() === "true" ? 90 : 40));
      const critVal = Number(row.business_criticality ?? 50);
      const growth = Math.min(0.50, 0.03 + (threatVal / 1000) + (expoVal / 2000) + (critVal / 4000));
      const projUntreated = Number((currentRisk * (1 + growth)).toFixed(2));
      const projUntreatedPct = Number((growth * 100).toFixed(1));

      const cvssVal = row.cvss_score !== undefined && row.cvss_score !== "" ? Number(row.cvss_score) : null;
      let calculatedSeverity = "Medium";
      if (row.severity || row.risk_level) {
        const s = String(row.severity || row.risk_level).trim().toLowerCase();
        if (s === "critical" || s === "crit") calculatedSeverity = "Critical";
        else if (s === "high" || s === "very high") calculatedSeverity = "High";
        else if (s === "medium" || s === "moderate" || s === "med") calculatedSeverity = "Medium";
        else if (s === "low") calculatedSeverity = "Low";
      } else if (cvssVal !== null) {
        if (cvssVal >= 9.0) calculatedSeverity = "Critical";
        else if (cvssVal >= 7.0) calculatedSeverity = "High";
        else if (cvssVal >= 4.0) calculatedSeverity = "Medium";
        else calculatedSeverity = "Low";
      } else if (currentRisk >= 75.0) {
        calculatedSeverity = "Critical";
      } else if (currentRisk >= 45.0) {
        calculatedSeverity = "High";
      } else if (currentRisk >= 25.0) {
        calculatedSeverity = "Medium";
      } else {
        calculatedSeverity = "Low";
      }

      valid.push({
        ...row,
        risk_id: riskId,
        risk_name: riskName,
        severity: calculatedSeverity.toUpperCase(),
        risk_level: calculatedSeverity.toUpperCase(),
        severity_level: calculatedSeverity.toLowerCase(),
        asset_name: row.asset_name || "Enterprise Asset",
        cve_id: row.cve_id || null,
        cvss_score: cvssVal,
        current_risk: currentRisk,
        expected_residual_risk: residualRisk,
        remediation_cost: remCost,
        risk_reduction: riskReduction,
        expected_risk_reduction_percent: redPercent,
        projected_untreated_risk: projUntreated,
        projected_untreated_risk_increase_percent: projUntreatedPct,
        remediation_name: row.remediation_action || row.remediation_name || `Remediate ${riskName}`,
        remediation_category: row.remediation_category || row.control_type || "Vulnerability Remediation",
        available_budget: budgetNum,
        eal: eal,
        expected_eal_reduction: ealRed,
        business_criticality: row.business_criticality ? Number(row.business_criticality) : 50,
      });
    });
  }

  if (!valid.length) {
    return NextResponse.json(
      { detail: { message: "no valid risk records found", invalid_records: errors } },
      { status: 422 }
    );
  }

  const budgetVal = budgets.size > 0 ? Array.from(budgets)[0] : 1000000;
  const opt = runServerBudgetOptimization(budgetVal, "INR", valid, sourceFiles.join(", "));

  const result = {
    source_files: sourceFiles,
    valid_records: valid,
    invalid_records: errors,
    valid_count: valid.length,
    invalid_count: errors.length,
    optimization: {
      available_budget: budgetVal,
      allocated_budget: opt.recommended_investment,
      recommended_total_investment: opt.recommended_investment,
      recommended_investment: opt.recommended_investment,
      remaining_budget: opt.remaining_budget,
      selected_risks: opt.selected_risks,
      deferred_risks: opt.deferred_risks,
      total_current_risk: opt.total_current_risk,
      total_post_remediation_risk: opt.total_post_remediation_risk,
      estimated_post_remediation_risk: opt.total_post_remediation_risk,
      total_risk_reduction: opt.total_risk_reduction,
      total_estimated_risk_reduction: opt.total_risk_reduction,
      overall_risk_reduction_percent: opt.overall_risk_reduction_percent,
      recommendation: opt.explanation.summary,
    },
  };

  const snapshotId = Date.now();
  setServerUploadedSnapshot({
    id: snapshotId,
    created_at: new Date().toISOString(),
    source_files: sourceFiles,
    result,
  });

  return NextResponse.json({ snapshot_id: snapshotId, ...result });
}
