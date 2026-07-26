// Next.js API route — proxies the FastAPI health-aggregator.
//
// The browser talks to /api/sentry/* (same-origin), the route forwards
// to the upstream aggregator at SENTRY_UPSTREAM (default
// http://127.0.0.1:11436). This avoids CORS pain in kiosk / browser
// mode and lets the Next.js app be deployed to Cloudflare/Vercel
// without exposing the aggregator publicly.
//
// Configure via env: SENTRY_UPSTREAM=http://192.168.0.10:11436

import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.SENTRY_UPSTREAM ?? "http://127.0.0.1:11436";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function proxy(path: string, init?: RequestInit) {
  const url = `${UPSTREAM.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      // 8s timeout — keep the UI snappy if the aggregator is down
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
        "x-sentry-upstream": UPSTREAM,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `sentry upstream unreachable (${UPSTREAM}): ${msg}` },
      { status: 502 }
    );
  }
}

export async function GET() {
  return proxy("/health/all");
}
