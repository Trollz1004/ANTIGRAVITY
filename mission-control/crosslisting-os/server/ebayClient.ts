/**
 * Outbound client for eBay's Sell Inventory API v1.
 *
 * Three calls, in the order a listing goes live:
 *   1. upsertEbayInventoryItem  PUT  /inventory_item/{sku}
 *   2. createEbayOffer          POST /offer
 *   3. publishEbayOffer         POST /offer/{offerId}/publish
 *
 * Rules this file keeps:
 *   - fetch is injected. Tests pass a stub; nothing here is called live yet.
 *   - The access token is passed in by the caller. This file never reads the
 *     environment, never logs, and scrubs the token out of anything it returns.
 *   - Expected eBay failures (bad request, rate limit, server error, network)
 *     come back as a result value, not a thrown error, so the caller can decide
 *     whether to retry.
 */

const DEFAULT_BASE_URL = "https://api.ebay.com";
const INVENTORY_PATH = "/sell/inventory/v1";
const DEFAULT_CONTENT_LANGUAGE = "en-US";
const REDACTED = "[REDACTED]";

export type EbayFetch = (url: string, init: RequestInit) => Promise<Response>;

export type EbayClientDeps = {
  /** Injected fetch. Falls back to the global fetch when left out. */
  fetch?: EbayFetch;
  /** Override for tests or the eBay sandbox. No trailing slash needed. */
  baseUrl?: string;
  /** Sent as the Content-Language header. eBay requires it on writes. */
  contentLanguage?: string;
};

/** One entry of eBay's `errors` or `warnings` array. */
export type EbayApiMessage = {
  errorId?: number;
  domain?: string;
  subdomain?: string;
  category?: string;
  message?: string;
  longMessage?: string;
  parameters?: { name?: string; value?: string }[];
  inputRefIds?: string[];
  outputRefIds?: string[];
};

export type EbayFailureKind =
  | "invalid_input"
  | "api_error"
  | "rate_limited"
  | "bad_response"
  | "network";

export type EbayFailure = {
  ok: false;
  kind: EbayFailureKind;
  /** HTTP status, or null when no response came back. */
  status: number | null;
  /** Short plain sentence, safe to show or log. Never holds the token. */
  message: string;
  errors: EbayApiMessage[];
  rateLimited: boolean;
  retryable: boolean;
  /** Seconds eBay asked us to wait, or null when it did not say. */
  retryAfterSeconds: number | null;
};

export type EbayUpsertItemResult =
  | { ok: true; status: number; warnings: EbayApiMessage[] }
  | EbayFailure;

export type EbayCreateOfferResult =
  | { ok: true; status: number; offerId: string; warnings: EbayApiMessage[] }
  | EbayFailure;

export type EbayPublishOfferResult =
  | { ok: true; status: number; listingId: string; warnings: EbayApiMessage[] }
  | EbayFailure;

function scrub<T>(value: T, token: string): T {
  if (!token) return value;
  if (typeof value === "string") {
    return value.split(token).join(REDACTED) as T;
  }
  if (Array.isArray(value)) {
    return value.map(item => scrub(item, token)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, scrub(inner, token)])
    ) as T;
  }
  return value;
}

function failure(
  fields: Partial<EbayFailure> & { kind: EbayFailureKind; message: string }
): EbayFailure {
  return {
    ok: false,
    status: null,
    errors: [],
    rateLimited: false,
    retryable: false,
    retryAfterSeconds: null,
    ...fields,
  };
}

function invalidInput(message: string): EbayFailure {
  return failure({ kind: "invalid_input", message });
}

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim() === "";
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text.trim() === "" ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

function messageList(body: unknown, key: "errors" | "warnings") {
  const list = (body as Record<string, unknown> | null)?.[key];
  return Array.isArray(list) ? (list as EbayApiMessage[]) : [];
}

function describeFailure(status: number, errors: EbayApiMessage[]) {
  const first = errors[0];
  if (!first) return `eBay returned HTTP ${status}.`;
  const id = first.errorId !== undefined ? `[${first.errorId}] ` : "";
  const text = first.longMessage ?? first.message ?? "No detail given.";
  return `eBay returned HTTP ${status}: ${id}${text}`;
}

async function sendToEbay(
  method: "PUT" | "POST",
  path: string,
  token: string,
  deps: EbayClientDeps,
  payload?: unknown
): Promise<
  | { ok: true; status: number; body: unknown; warnings: EbayApiMessage[] }
  | EbayFailure
> {
  const doFetch = deps.fetch ?? (globalThis.fetch as EbayFetch | undefined);
  if (!doFetch) return invalidInput("No fetch function is available.");
  const baseUrl = (deps.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Language": deps.contentLanguage ?? DEFAULT_CONTENT_LANGUAGE,
    },
  };
  if (payload !== undefined) init.body = JSON.stringify(payload);

  let response: Response;
  try {
    response = await doFetch(`${baseUrl}${INVENTORY_PATH}${path}`, init);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return failure({
      kind: "network",
      message: scrub(`The request to eBay did not complete: ${reason}`, token),
      retryable: true,
    });
  }

  const body = await readJson(response);
  if (response.ok) {
    return {
      ok: true,
      status: response.status,
      body,
      warnings: scrub(messageList(body, "warnings"), token),
    };
  }

  const status = response.status;
  const errors = scrub(messageList(body, "errors"), token);
  const rateLimited = status === 429;
  return failure({
    kind: rateLimited ? "rate_limited" : "api_error",
    status,
    message: scrub(describeFailure(status, errors), token),
    errors,
    rateLimited,
    retryable: rateLimited || status === 408 || status >= 500,
    retryAfterSeconds: rateLimited
      ? parseRetryAfter(response.headers.get("Retry-After"))
      : null,
  });
}

function badResponse(status: number, what: string): EbayFailure {
  return failure({
    kind: "bad_response",
    status,
    message: `eBay answered HTTP ${status} but the reply had no ${what}.`,
  });
}

/** PUT /sell/inventory/v1/inventory_item/{sku}. eBay answers 204 or 200. */
export async function upsertEbayInventoryItem(
  sku: string,
  payload: unknown,
  token: string,
  deps: EbayClientDeps = {}
): Promise<EbayUpsertItemResult> {
  if (isBlank(sku)) return invalidInput("A sku is required.");
  if (isBlank(token)) return invalidInput("An access token is required.");
  const sent = await sendToEbay(
    "PUT",
    `/inventory_item/${encodeURIComponent(sku)}`,
    token,
    deps,
    payload
  );
  if (!sent.ok) return sent;
  return { ok: true, status: sent.status, warnings: sent.warnings };
}

/** POST /sell/inventory/v1/offer. eBay answers 201 with an offerId. */
export async function createEbayOffer(
  payload: unknown,
  token: string,
  deps: EbayClientDeps = {}
): Promise<EbayCreateOfferResult> {
  if (isBlank(token)) return invalidInput("An access token is required.");
  const sent = await sendToEbay("POST", "/offer", token, deps, payload);
  if (!sent.ok) return sent;
  const offerId = (sent.body as { offerId?: unknown } | null)?.offerId;
  if (isBlank(offerId)) return badResponse(sent.status, "offerId");
  return {
    ok: true,
    status: sent.status,
    offerId: offerId as string,
    warnings: sent.warnings,
  };
}

/** POST /sell/inventory/v1/offer/{offerId}/publish. eBay answers 200 with a listingId. */
export async function publishEbayOffer(
  offerId: string,
  token: string,
  deps: EbayClientDeps = {}
): Promise<EbayPublishOfferResult> {
  if (isBlank(offerId)) return invalidInput("An offerId is required.");
  if (isBlank(token)) return invalidInput("An access token is required.");
  const sent = await sendToEbay(
    "POST",
    `/offer/${encodeURIComponent(offerId)}/publish`,
    token,
    deps
  );
  if (!sent.ok) return sent;
  const listingId = (sent.body as { listingId?: unknown } | null)?.listingId;
  if (isBlank(listingId)) return badResponse(sent.status, "listingId");
  return {
    ok: true,
    status: sent.status,
    listingId: listingId as string,
    warnings: sent.warnings,
  };
}
