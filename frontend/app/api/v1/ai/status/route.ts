import { NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const upstream = await fetch(`${FASTAPI_URL}/ai/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (upstream.ok) {
      return NextResponse.json(await upstream.json());
    }
  } catch {
    // Fall back to Next.js server engine
  }

  return NextResponse.json({
    status: "online",
    provider: "Amazon Bedrock",
    model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    model_name: "Claude 3.5 Sonnet",
    capabilities: [
      "Executive Cyber Risk Summaries",
      "Board of Directors Reports",
      "Risk Explainability & Narrative Driver Analysis",
      "Return on Security Investment (ROSI) Strategy",
      "Interactive Executive Intelligence Chat",
    ],
  });
}
