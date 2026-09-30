import { NextResponse } from "next/server";
import { getServerUploadedSnapshot } from "@/lib/server/budget-optimizer-engine";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const upstream = await fetch(`${FASTAPI_URL}/portfolio/latest`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      return NextResponse.json(await upstream.json());
    }
  } catch {
    // FastAPI not running; use Next.js server snapshot store
  }

  const snapshot = getServerUploadedSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      status: "no_data",
      message: "Upload a company dataset to begin CRISP analysis.",
    });
  }
  return NextResponse.json({
    status: "completed",
    snapshot_id: snapshot.id,
    created_at: snapshot.created_at,
    ...snapshot.result,
  });
}
