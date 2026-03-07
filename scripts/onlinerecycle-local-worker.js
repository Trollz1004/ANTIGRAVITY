#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(ROOT, "data", "local", "onlinerecycle-worker");
const OLLAMA_URL = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const MODEL_PREFERENCE = [
  process.env.ONLINERECYCLE_LOCAL_MODEL,
  "qwen2.5:7b",
  "llama3.1:8b",
  "qwen2.5:3b",
].filter(Boolean);

const SYSTEM_PROMPT = `You are the local OnlineRecycle.org operations writer.

Hard rules:
- Never use donate, donation, solicitation, fundraiser, charitable donation, or similar wording.
- Correct framing is contractual revenue disbursement when legal wording matters.
- Never claim all net proceeds or every dollar goes to Shriners.
- Correct split is 60/30/10:
  60% Shriners Children's Hospitals
  30% infrastructure / AI operations
  10% founder operations
- Do not invent inventory, pricing, addresses, or appointment times.
- Do not use fake placeholders like [Date], [Time], [Location], or [Name].
- If a reply needs missing details, ask for them directly instead of pretending they exist.
- Routine operational replies should stay focused on intake, scheduling, resale, or data handling. Do not drag Shriners or internal impact bookkeeping into normal ops replies unless the customer asks.
- If you are unsure of a named subreddit, Facebook group, or venue, describe the angle instead of inventing a fake one.
- Keep the tone direct, human, local, and useful. No corporate sludge.
- Focus on practical cashflow and lead generation for OnlineRecycle.org.
`;

function usage() {
  console.log("Usage:");
  console.log("  node scripts/onlinerecycle-local-worker.js marketing-pack [--model MODEL]");
  console.log("  node scripts/onlinerecycle-local-worker.js reply-draft --kind general|dropoff|pickup --source FILE [--model MODEL]");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
}

async function listModels() {
  const payload = await fetchJson(`${OLLAMA_URL.replace(/\/$/, "")}/api/tags`);
  return (payload.models || []).map((model) => String(model.name || "").trim()).filter(Boolean);
}

async function pickModel(explicit) {
  const models = await listModels();
  if (explicit) {
    if (models.includes(explicit)) return explicit;
    throw new Error(`Requested model '${explicit}' is not installed. Installed: ${models.join(", ") || "none"}`);
  }
  for (const candidate of MODEL_PREFERENCE) {
    if (models.includes(candidate)) return candidate;
  }
  if (models.length) return models[0];
  throw new Error("No Ollama models are installed.");
}

async function generate(model, prompt) {
  const payload = await fetchJson(`${OLLAMA_URL.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      stream: false,
      options: { temperature: 0.2, top_p: 0.85, num_predict: 500 },
    }),
  });
  const text = String(payload.response || "").trim();
  if (!text) throw new Error("Ollama returned an empty response.");
  return text;
}

function latestEbayContext() {
  const batchPath = path.join(ROOT, "data", "ewaste-intake", "output", "latest-ebay-listings-batch.json");
  if (!fs.existsSync(batchPath)) {
    return "No current eBay ready batch file was found.";
  }

  try {
    const payload = JSON.parse(fs.readFileSync(batchPath, "utf8"));
    const listings = Array.isArray(payload.listings) ? payload.listings : [];
    if (!listings.length) {
      return "The current eBay ready batch file has no listings.";
    }
    return listings.slice(0, 5).map((item) => {
      const title = String(item.title || "Untitled item").trim();
      const price = item.suggested_price_usd == null || item.suggested_price_usd === "" ? "price not set" : `$${item.suggested_price_usd}`;
      const format = String(item.listing_format || "buy_it_now").trim();
      const impact = String(item.charity_impact_line || "").trim();
      return `- ${title} | ${price} | ${format} | ${impact}`;
    }).join("\n");
  } catch {
    return "The current eBay ready batch file exists but could not be parsed.";
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeOutput(kind, stem, content) {
  const dateDir = new Date().toISOString().slice(0, 10);
  const datedDir = path.join(OUTPUT_ROOT, kind, dateDir);
  ensureDir(datedDir);

  const filePath = path.join(datedDir, `${new Date().toISOString().slice(11, 19).replace(/:/g, "")}-${stem}.md`);
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");

  const latestDir = path.join(OUTPUT_ROOT, kind);
  ensureDir(latestDir);
  const latestPath = path.join(latestDir, `latest-${stem}.md`);
  fs.writeFileSync(latestPath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function parseInquiryFields(sourceText) {
  const normalizedMap = {
    "full name": "full_name",
    "email": "email",
    "phone": "phone",
    "organization": "organization",
    "business / org (if any)": "organization",
    "pickup address": "pickup_address",
    "city": "city",
    "zip": "zip",
    "estimated device count": "device_count",
    "preferred pickup window": "preferred_window",
    "preferred drop-off window": "preferred_window",
    "device list": "device_list",
    "loading / access notes": "access_notes",
    "security / data wipe notes": "security_notes",
  };

  const fields = {};
  const lines = String(sourceText || "").split(/\r?\n/);
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx).trim().toLowerCase();
    const rawValue = line.slice(idx + 1).trim();
    const key = normalizedMap[rawKey];
    if (key && rawValue) {
      fields[key] = rawValue;
    }
  }
  return fields;
}

function hasStructuredInquiry(fields) {
  return ["full_name", "device_count", "device_list"].filter((key) => fields[key]).length >= 2;
}

function replyTemplate(kind, sourcePath, fields) {
  const name = fields.full_name || "there";
  const deviceCount = fields.device_count || "the submitted";
  const deviceList = fields.device_list || "the devices you listed";
  const orgLine = fields.organization ? `- Organization: ${fields.organization}` : null;
  const emailLine = fields.email ? `- Email: ${fields.email}` : null;
  const phoneLine = fields.phone ? `- Phone: ${fields.phone}` : null;
  const locationParts = [];
  if (fields.pickup_address) {
    locationParts.push(fields.pickup_address);
  }
  if (fields.city && !(fields.pickup_address || "").toLowerCase().includes(fields.city.toLowerCase())) {
    locationParts.push(fields.city);
  }
  if (fields.zip && !(fields.pickup_address || "").includes(fields.zip)) {
    locationParts.push(fields.zip);
  }
  const locationLine = kind === "pickup"
    ? locationParts.join(", ")
    : null;
  const locationBullet = locationLine ? `- Pickup Location: ${locationLine}` : null;
  const windowLabel = kind === "pickup" ? "Preferred Pickup Window" : "Preferred Drop-Off Window";
  const windowBullet = fields.preferred_window ? `- ${windowLabel}: ${fields.preferred_window}` : null;
  const notesValue = fields.access_notes || fields.security_notes;
  const notesLabel = fields.access_notes ? "Access Notes" : "Security Notes";
  const notesBullet = notesValue ? `- ${notesLabel}: ${notesValue}` : null;

  const subject = kind === "pickup"
    ? `OnlineRecycle Pickup Intake Received - ${deviceCount} Devices`
    : kind === "dropoff"
      ? `OnlineRecycle Drop-Off Intake Received - ${deviceCount} Devices`
      : `OnlineRecycle Intake Received - ${deviceCount} Devices`;

  const nextStep = kind === "pickup"
    ? "Next step on my side is reviewing the route, device mix, and access notes, then following up with the best scheduling option for pickup."
    : "Next step on my side is reviewing the intake, then pointing you to the right Square booking flow or confirming the best drop-off window.";

  const internalActions = [
    "- Review the intake details and confirm the device mix is workable.",
    kind === "pickup"
      ? "- Follow up with the best pickup scheduling option after route review."
      : "- Send the correct Square booking next step after intake review.",
    locationLine ? `- Verify logistics for ${locationLine}.` : "- Verify logistics before confirming timing.",
    notesValue ? `- Keep the noted constraint in view: ${notesValue}` : "- Check for any access, timing, or handling constraints before confirming.",
  ].join("\n");

  const replyLines = [
    "# OnlineRecycle Reply Draft",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Generator: template-first structured intake reply`,
    `- Inquiry Type: ${kind}`,
    `- Source: ${sourcePath}`,
    "",
    "## Subject",
    subject,
    "",
    "## Reply",
    `Hello ${name},`,
    "",
    `Thanks for sending your OnlineRecycle ${kind === "pickup" ? "pickup" : kind === "dropoff" ? "drop-off" : ""} intake. I have your request and the details below:`,
    "",
    `- Estimated Device Count: ${deviceCount}`,
    `- Device List: ${deviceList}`,
    orgLine,
    emailLine,
    phoneLine,
    locationBullet,
    windowBullet,
    notesBullet,
    "",
    nextStep,
    "",
    "If anything in the device list, count, or timing changes, reply here and I will update the request before scheduling.",
    "",
    "Best,",
    "OnlineRecycle.org",
    "",
    "## Internal Next Actions",
    internalActions,
  ].filter(Boolean);

  return replyLines.join("\n");
}

function marketingContext() {
  return `OnlineRecycle.org local revenue context:

Business context:
- OnlineRecycle.org is a Florida electronics recycler
- Focus region: Sorrento, Lake County, Central Florida
- Main lead flow: website intake form first, then Square booking
- Primary money path right now: eBay resale of intake-ready devices
- Secondary money path: more local pickup/drop-off leads

Current ready eBay batch:
${latestEbayContext()}
`;
}

function replyPrompt(kind, sourceText) {
  return `Draft one OnlineRecycle.org reply.

Inquiry type: ${kind}

Workflow truth:
- Intake is received first
- Next action is either Square booking or a manual scheduling follow-up
- Mention data wipe / chain-of-custody only if relevant
- Do not promise same-day service unless the inquiry already says it was confirmed
- If timing is unknown, ask for the best day/time window instead of inventing one
- Do not use placeholders like [Date] or [Location]
- Preserve the exact device counts, device types, and location details from the inquiry when they are present
- Only use facts that appear in the inquiry or the workflow truth above
- Do not mention Shriners, charity records, donations, or internal ledger tracking in the reply or internal next actions
- Do not ask about data wipe unless the inquiry mentions security, wipe, privacy, or storage concerns
- Keep internal next actions operational only. No impact-ledger or Shriners bookkeeping notes.

Source inquiry text:
"""
${sourceText.trim()}
"""

Output strict markdown with:
## Subject
one line only, grounded in the actual inquiry

## Reply
full email body that confirms receipt, summarizes the request accurately, and states the next scheduling action

## Internal Next Actions
- 3 to 5 bullets for Josh, operational only
`;
}

async function marketingPack(model) {
  const batchPath = path.join(ROOT, "data", "ewaste-intake", "output", "latest-ebay-listings-batch.json");
  let listings = [];
  if (fs.existsSync(batchPath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(batchPath, "utf8"));
      listings = Array.isArray(payload.listings) ? payload.listings.slice(0, 3) : [];
    } catch {
      listings = [];
    }
  }

  const listingLines = listings.length
    ? listings.map((item) => `- ${String(item.title || "Untitled item").trim()} | $${item.suggested_price_usd || "TBD"} | ${String(item.listing_format || "buy_it_now").trim()}`).join("\n")
    : "- No current ready batch loaded. Run the eBay intake pipeline first.";

  const firstTitle = listings[0] ? String(listings[0].title || "fresh device inventory") : "fresh device inventory";
  const secondTitle = listings[1] ? String(listings[1].title || "tested devices") : "tested devices";

  const wrapped = [
    "# OnlineRecycle Local Marketing Pack",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Generator: template-first local pack`,
    "",
    "## Today's Cash Moves",
    "- Publish or refresh the top 1-3 ready eBay listings before doing any new outreach.",
    "- Post one local pickup/drop-off pitch in Facebook or Nextdoor tied to free electronics recycling in Sorrento / Lake County.",
    "- Follow up on any intake or inbox lead the same day and push them to the Square booking link.",
    "",
    "## Ready eBay Batch",
    listingLines,
    "",
    "## Local Posts",
    "- Lake County / Sorrento pitch: Free electronics drop-off and pickup in Central Florida. If it plugs in or has a battery, I can usually take it. OnlineRecycle.org handles intake first, then booking, then tested resale where it makes sense.",
    `- Cashflow angle: I am actively moving tested inventory like ${firstTitle}. If you have old laptops, desktops, or printers collecting dust, I can turn that stack into usable resale inventory instead of landfill weight.`,
    `- Trust angle: Devices get logged, triaged, and either recycled responsibly or resold with clear condition notes. Current ready inventory includes ${secondTitle}, so this is not vapor.`,
    "- Simple CTA: Got a garage, office, or storage unit full of old tech? Send the intake through OnlineRecycle.org and I will sort pickup or drop-off from there.",
    "",
    "## Reddit Angles",
    "- r/orlando or local Florida tech/community angle: 'Free electronics pickup/drop-off in Lake County - turning old tech into tested resale inventory instead of trash.'",
    "- r/Flipping or resale angle: 'Building a local e-waste intake pipeline in Central Florida - what sells fastest for you right now: business laptops, office desktops, or printers?'",
    "",
    "## eBay / Resale Angles",
    "- Tested locally, wiped, and listed with honest condition language. No mystery junk flips.",
    "- Inventory comes through a real intake pipeline, so asset tags and device notes stay tied to the listing.",
    "- Fastest cash comes from pricing clean, tested units to move in 7 days, then feeding that cash back into more intake and listing volume.",
    "",
    "## Outreach Messages",
    "- Business IT cleanout: 'If your office has retired laptops, desktops, docks, or printers piling up, I can handle pickup or drop-off intake in Lake County and sort what can be resold or recycled cleanly.'",
    "- Apartment / storage cleanout: 'If you are clearing a storage unit or move-out and have old electronics in the pile, send the intake through OnlineRecycle.org and I can line up pickup or a drop-off slot.'",
    "",
    "## Quick Replies",
    "- Data wipe: 'Yes. Storage is logged and wipe status is tracked as part of intake/testing before anything goes near resale.'",
    "- What do you take: 'Computers, laptops, phones, tablets, printers, cables, consoles, and most other consumer electronics. If it plugs in or runs on a battery, send it through intake first.'",
    "- How pickup works: 'Submit the intake, I review the device list and location, then I either point you to booking or follow up with the best scheduling window.'",
    "- Can I drop off today: 'If you send the intake now, I can tell you whether same-day drop-off is realistic or get you into the next open booking window fast.'",
    "",
    "## One-Hour Plan",
    "1. Run the eBay listing batch and publish the best 1-3 items first.",
    "2. Post one local pitch in the highest-signal Facebook or Nextdoor group you already use.",
    "3. Message one business contact and one local cleanout lead using the outreach blurbs above.",
    "4. Check every intake/inbox lead and push them to the next scheduling action before the hour ends.",
  ].join("\n");
  return writeOutput("marketing", "marketing-pack", wrapped);
}

async function replyDraft(explicitModel, kind, sourcePath) {
  if (!sourcePath) throw new Error("reply-draft requires --source");
  if (!fs.existsSync(sourcePath)) throw new Error(`Source file not found: ${sourcePath}`);
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const fields = parseInquiryFields(sourceText);
  if (hasStructuredInquiry(fields)) {
    return writeOutput("replies", `${kind}-reply`, replyTemplate(kind, sourcePath, fields));
  }
  const model = await pickModel(explicitModel);
  const content = await generate(model, replyPrompt(kind, sourceText));
  const wrapped = [
    "# OnlineRecycle Reply Draft",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Model: ${model}`,
    `- Inquiry Type: ${kind}`,
    `- Source: ${sourcePath}`,
    "",
    content.trim(),
  ].join("\n");
  return writeOutput("replies", `${kind}-reply`, wrapped);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command) {
    usage();
    process.exit(1);
  }

  let outputPath;
  let model = "template-pack";

  if (command === "marketing-pack") {
    outputPath = await marketingPack(model);
  } else if (command === "reply-draft") {
    const kind = args.kind || "general";
    outputPath = await replyDraft(args.model, kind, args.source);
    if (args.model) {
      model = args.model;
    }
  } else {
    usage();
    process.exit(1);
  }

  console.log(`MODEL=${model}`);
  console.log(`OUTPUT=${outputPath}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
