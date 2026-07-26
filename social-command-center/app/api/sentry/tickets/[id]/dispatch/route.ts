// Proxy /api/sentry/tickets/[id]/dispatch → POST /repair/tickets/{id}/dispatch
import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.SENTRY_UPSTREAM ?? "http://127.0.0.1:11436";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = `${UPSTREAM.replace(/\/$/, "")}/repair/tickets/${encodeURIComponent(id)}/dispatch`;
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(60000), // dispatch can be slow (SSH run)
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
      { error: `sentry upstream unreachable: ${msg}` },
      { status: 502 }
    );
  }
}
