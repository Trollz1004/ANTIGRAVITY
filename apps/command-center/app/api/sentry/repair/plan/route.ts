// Proxy /api/sentry/repair/plan → POST /repair/plan
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.SENTRY_UPSTREAM ?? "http://127.0.0.1:11436";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const url = `${UPSTREAM.replace(/\/$/, "")}/repair/plan`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body || "{}",
      signal: AbortSignal.timeout(30000), // plan can take longer (one per red check)
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `sentry upstream unreachable: ${msg}`, submitted: [] },
      { status: 502 }
    );
  }
}
