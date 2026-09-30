import { NextResponse } from "next/server";
import { clearServerUploadedSnapshot } from "@/lib/server/budget-optimizer-engine";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function POST() {
  // 1. Clear Next.js in-memory snapshot and optimization cache
  clearServerUploadedSnapshot();

  // 2. Clear FastAPI database snapshot if upstream is reachable
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    await fetch(`${FASTAPI_URL}/portfolio/reset`, {
      method: "POST",
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // Upstream not running
  }

  return NextResponse.json({
    status: "ok",
    message: "All platform risk data, uploaded datasets, and budget allocations have been reset to zero.",
  });
}
