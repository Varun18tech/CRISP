import { NextRequest, NextResponse } from "next/server";
import {
  evaluateAndProfileRisk,
  loadCrispRisksFromServer,
  SUPPORTED_CURRENCIES,
} from "@/lib/server/budget-optimizer-engine";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organization_id") || "org_default";

  // 1. Try proxying to FastAPI backend if running on port 8000
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const upstream = await fetch(
      `${FASTAPI_URL}/portfolio/budget-optimizer/context?organization_id=${encodeURIComponent(orgId)}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (upstream.ok) {
      const data = await upstream.json();
      return NextResponse.json(data);
    }
  } catch {
    // FastAPI server is not running; execute on Next.js server-side engine
  }

  // 2. Authoritative Next.js server-side context calculation
  const [rawRisks, sourceName] = loadCrispRisksFromServer();
  const profiled = rawRisks.map((r) => evaluateAndProfileRisk(r, "INR"));
  const eligible = profiled.filter((r) => r.eligibility_status === "Eligible");
  const insufficient = profiled.filter((r) => r.eligibility_status === "Data Insufficient");
  const remediated = profiled.filter((r) => r.eligibility_status === "Already Remediated");

  return NextResponse.json({
    status: rawRisks.length > 0 ? "ready" : "no_data",
    dataset_source: sourceName,
    total_risks_available: profiled.length,
    eligible_risks_count: eligible.length,
    data_insufficient_count: insufficient.length,
    already_remediated_count: remediated.length,
    supported_currencies: Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
      code,
      ...info,
    })),
  });
}
