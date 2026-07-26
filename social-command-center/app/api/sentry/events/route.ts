// Proxy /api/sentry/events → /events/tail
import { NextResponse } from "next/server";

const UPSTREAM = process.env.SENTRY_UPSTREAM ?? "http://127.0.0.1:11436";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const url = `${UPSTREAM.replace(/\/$/, "")}/events/tail`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
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
      { error: `sentry upstream unreachable: ${msg}`, events: [] },
      { status: 502 }
    );
  }
}
