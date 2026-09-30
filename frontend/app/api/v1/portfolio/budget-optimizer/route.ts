import { NextRequest, NextResponse } from "next/server";
import {
  loadCrispRisksFromServer,
  runServerBudgetOptimization,
} from "@/lib/server/budget-optimizer-engine";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  // 1. Try proxying to FastAPI backend if running on port 8000
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const upstream = await fetch(`${FASTAPI_URL}/portfolio/budget-optimizer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (upstream.ok || upstream.status === 422) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }
  } catch {
    // FastAPI server is not running; execute on Next.js server-side engine
  }

  // 2. Authoritative Next.js server-side portfolio optimization
  try {
    const availableBudget = body?.available_budget;
    const currency = body?.currency || "INR";

    if (
      availableBudget === undefined ||
      availableBudget === null ||
      typeof availableBudget === "boolean" ||
      String(availableBudget).trim() === ""
    ) {
      return NextResponse.json(
        { detail: "available_budget is required and must be a valid number." },
        { status: 422 }
      );
    }

    let rawRisks: Record<string, any>[];
    let sourceName: string;

    if (Array.isArray(body?.risks)) {
      rawRisks = body.risks;
      sourceName = "Request Payload Dataset";
    } else {
      const [risks, src, meta] = loadCrispRisksFromServer();
      rawRisks = risks;
      sourceName = src;
      if (!meta.hasUploadedDataset || rawRisks.length === 0) {
        return NextResponse.json(
          { detail: "No company dataset uploaded. Please upload a dataset with a defined security budget before running the budget optimizer." },
          { status: 400 }
        );
      }
      if (meta.datasetBudget !== null && meta.datasetBudget !== undefined) {
        if (Math.abs(Number(availableBudget) - Number(meta.datasetBudget)) > 0.01) {
          return NextResponse.json(
            {
              detail: `Budget mismatch: Entered budget (${Number(availableBudget)}) does not match the Available Budget in Dashboard/Dataset (${meta.datasetBudget}).`,
            },
            { status: 400 }
          );
        }
      }
    }

    const result = runServerBudgetOptimization(
      Number(availableBudget),
      String(currency),
      rawRisks,
      sourceName
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Budget optimization failed." },
      { status: 422 }
    );
  }
}
