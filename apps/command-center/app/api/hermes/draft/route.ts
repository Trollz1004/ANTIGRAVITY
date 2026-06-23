import { NextResponse } from "next/server";

const DEFAULT_TARGETS = ["twitter", "youtube", "instagram", "tiktok", "linkedin"];

export async function POST(request: Request) {
  let payload: { topic?: string; targets?: string[] } = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const topic = (payload.topic || "YouAndINotAI membership and verification").trim();
  const targets = Array.isArray(payload.targets) && payload.targets.length > 0
    ? payload.targets
    : DEFAULT_TARGETS;

  return NextResponse.json({
    source: "hermes",
    mcp_status: "seam-ready",
    title: `Hermes draft: ${topic.slice(0, 72)}`,
    body: [
      `Draft angle: ${topic}`,
      "",
      "X/Grok hook: Real people should not have to compete with bot noise. YouAndINotAI is building around membership, verification, safety, and human matching first.",
      "",
      "YouTube angle: Show the product problem clearly: fake-profile friction, weak trust signals, and why verification-first membership makes the platform more useful.",
      "",
      "CTA: Join or verify at youandinotai.com when you want a social platform built around real people, account trust, and support.",
      "",
      "Guardrails: no non-product fundraising, private accounting, ownership/control promises, investment claims, or automatic money-routing claims.",
    ].join("\n"),
    targets,
    tags: ["hermes", "grok", "business-only", "manual-approval"],
    notes: "Draft only. Josh approves and posts manually. Official OpenClaw is support-only.",
  });
}
