import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createEbayOffer,
  publishEbayOffer,
  upsertEbayInventoryItem,
} from "./ebayClient";

// Every response below is shaped like eBay's Sell Inventory API v1.
// Nothing here reaches the network: fetch is always injected.

const TOKEN = "v^1.1#i^1#r^0#test-token-not-real";
const BASE = "https://api.ebay.com/sell/inventory/v1";

const itemPayload = {
  product: {
    title: "Dell OptiPlex 7010 desktop",
    description: "Tested and wiped.",
    imageUrls: ["https://example.test/photo-1.jpg"],
  },
  condition: "USED_EXCELLENT",
  availability: { shipToLocationAvailability: { quantity: 1 } },
};

const offerPayload = {
  sku: "OPT-7010-001",
  marketplaceId: "EBAY_US",
  format: "FIXED_PRICE",
  availableQuantity: 1,
  categoryId: "179",
  listingPolicies: {
    fulfillmentPolicyId: "1111",
    paymentPolicyId: "2222",
    returnPolicyId: "3333",
  },
  pricingSummary: { price: { value: "129.00", currency: "USD" } },
};

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function stubFetch(response: Response | (() => Response)) {
  return vi.fn(async (_url: string, _init: RequestInit) =>
    typeof response === "function" ? response() : response
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("upsertEbayInventoryItem", () => {
  it("PUTs the item to inventory_item/{sku} and accepts 204 No Content", async () => {
    const fetchStub = stubFetch(() => new Response(null, { status: 204 }));
    const result = await upsertEbayInventoryItem(
      "OPT 7010/001",
      itemPayload,
      TOKEN,
      {
        fetch: fetchStub,
      }
    );

    expect(result).toEqual({ ok: true, status: 204, warnings: [] });
    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0];
    expect(url).toBe(`${BASE}/inventory_item/OPT%207010%2F001`);
    expect(init.method).toBe("PUT");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Content-Language"]).toBe("en-US");
    expect(JSON.parse(init.body as string)).toEqual(itemPayload);
  });

  it("returns eBay warnings when the item is accepted with a 200", async () => {
    const warning = {
      errorId: 25021,
      domain: "API_INVENTORY",
      category: "REQUEST",
      message: "Aspect value was adjusted.",
    };
    const fetchStub = stubFetch(jsonResponse(200, { warnings: [warning] }));
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(result.ok && result.warnings).toEqual([warning]);
  });

  it("returns eBay's error list on a 400 and marks it not retryable", async () => {
    const errorBody = {
      errors: [
        {
          errorId: 25002,
          domain: "API_INVENTORY",
          category: "REQUEST",
          message: "A user error has occurred.",
          longMessage: "The condition is required for this category.",
          parameters: [{ name: "fieldName", value: "condition" }],
        },
      ],
    };
    const fetchStub = stubFetch(jsonResponse(400, errorBody));
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });

    expect(result).toMatchObject({
      ok: false,
      kind: "api_error",
      status: 400,
      rateLimited: false,
      retryable: false,
      retryAfterSeconds: null,
    });
    if (result.ok) throw new Error("expected a failure");
    expect(result.errors).toEqual(errorBody.errors);
    expect(result.message).toContain("25002");
  });

  it("reports a 429 as rate limited and reads the Retry-After header", async () => {
    const errorBody = {
      errors: [
        {
          errorId: 2001,
          domain: "ACCESS",
          category: "REQUEST",
          message: "Too many requests.",
          longMessage: "The call limit for this application has been reached.",
        },
      ],
    };
    const fetchStub = stubFetch(
      jsonResponse(429, errorBody, { "Retry-After": "30" })
    );
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });

    expect(result).toMatchObject({
      ok: false,
      kind: "rate_limited",
      status: 429,
      rateLimited: true,
      retryable: true,
      retryAfterSeconds: 30,
    });
    if (result.ok) throw new Error("expected a failure");
    expect(result.errors).toEqual(errorBody.errors);
  });

  it("reports a 429 without a Retry-After header as rate limited with no wait time", async () => {
    const fetchStub = stubFetch(jsonResponse(429, { errors: [] }));
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      rateLimited: true,
      retryAfterSeconds: null,
    });
  });

  it("treats a 500 system error as retryable", async () => {
    const fetchStub = stubFetch(
      jsonResponse(500, {
        errors: [
          {
            errorId: 25001,
            domain: "API_INVENTORY",
            category: "APPLICATION",
            message: "A system error has occurred.",
          },
        ],
      })
    );
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "api_error",
      status: 500,
      retryable: true,
      rateLimited: false,
    });
  });

  it("survives a non-JSON error body such as a gateway HTML page", async () => {
    const fetchStub = stubFetch(
      new Response("<html>Bad gateway</html>", { status: 502 })
    );
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "api_error",
      status: 502,
      retryable: true,
      errors: [],
    });
    if (result.ok) throw new Error("expected a failure");
    expect(result.message).toContain("502");
  });

  it("returns a network failure without leaking the token", async () => {
    const fetchStub = vi.fn(async () => {
      throw new Error(`socket hang up while sending Bearer ${TOKEN}`);
    });
    const result = await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "network",
      retryable: true,
      status: null,
    });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });

  it("refuses an empty sku or token and never calls fetch", async () => {
    const fetchStub = stubFetch(new Response(null, { status: 204 }));
    const noSku = await upsertEbayInventoryItem(" ", itemPayload, TOKEN, {
      fetch: fetchStub,
    });
    const noToken = await upsertEbayInventoryItem("SKU-1", itemPayload, "", {
      fetch: fetchStub,
    });
    expect(noSku).toMatchObject({ ok: false, kind: "invalid_input" });
    expect(noToken).toMatchObject({ ok: false, kind: "invalid_input" });
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe("createEbayOffer", () => {
  it("POSTs the offer and returns the offerId from a 201", async () => {
    const fetchStub = stubFetch(jsonResponse(201, { offerId: "5004011234" }));
    const result = await createEbayOffer(offerPayload, TOKEN, {
      fetch: fetchStub,
    });

    expect(result).toEqual({
      ok: true,
      status: 201,
      offerId: "5004011234",
      warnings: [],
    });
    const [url, init] = fetchStub.mock.calls[0];
    expect(url).toBe(`${BASE}/offer`);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Content-Language"]).toBe("en-US");
    expect(JSON.parse(init.body as string)).toEqual(offerPayload);
  });

  it("returns eBay's error list when the offer is refused", async () => {
    const errorBody = {
      errors: [
        {
          errorId: 25709,
          domain: "API_INVENTORY",
          category: "REQUEST",
          message: "Invalid value for the fulfillment policy.",
          parameters: [{ name: "fulfillmentPolicyId", value: "1111" }],
        },
      ],
    };
    const fetchStub = stubFetch(jsonResponse(400, errorBody));
    const result = await createEbayOffer(offerPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({ ok: false, kind: "api_error", status: 400 });
    if (result.ok) throw new Error("expected a failure");
    expect(result.errors).toEqual(errorBody.errors);
  });

  it("reports a rate limit on offer creation", async () => {
    const fetchStub = stubFetch(
      jsonResponse(
        429,
        { errors: [{ errorId: 2001, message: "Too many requests." }] },
        { "Retry-After": "5" }
      )
    );
    const result = await createEbayOffer(offerPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "rate_limited",
      retryAfterSeconds: 5,
    });
  });

  it("fails as a bad response when a 201 carries no offerId", async () => {
    const fetchStub = stubFetch(jsonResponse(201, {}));
    const result = await createEbayOffer(offerPayload, TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "bad_response",
      status: 201,
    });
  });
});

describe("publishEbayOffer", () => {
  it("POSTs offer/{offerId}/publish with no body and returns the listingId", async () => {
    const fetchStub = stubFetch(
      jsonResponse(200, { listingId: "110555666777", warnings: [] })
    );
    const result = await publishEbayOffer("5004011234", TOKEN, {
      fetch: fetchStub,
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      listingId: "110555666777",
      warnings: [],
    });
    const [url, init] = fetchStub.mock.calls[0];
    expect(url).toBe(`${BASE}/offer/5004011234/publish`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("returns eBay's error list when publishing is refused", async () => {
    const errorBody = {
      errors: [
        {
          errorId: 25007,
          domain: "API_INVENTORY",
          category: "BUSINESS",
          message: "Sellers must have a business policy opt-in.",
        },
      ],
    };
    const fetchStub = stubFetch(jsonResponse(409, errorBody));
    const result = await publishEbayOffer("5004011234", TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      kind: "api_error",
      status: 409,
      retryable: false,
    });
    if (result.ok) throw new Error("expected a failure");
    expect(result.errors).toEqual(errorBody.errors);
  });

  it("reports a rate limit on publish", async () => {
    const fetchStub = stubFetch(
      jsonResponse(429, { errors: [] }, { "Retry-After": "120" })
    );
    const result = await publishEbayOffer("5004011234", TOKEN, {
      fetch: fetchStub,
    });
    expect(result).toMatchObject({
      ok: false,
      rateLimited: true,
      retryAfterSeconds: 120,
    });
  });

  it("refuses an empty offerId and never calls fetch", async () => {
    const fetchStub = stubFetch(jsonResponse(200, {}));
    const result = await publishEbayOffer("", TOKEN, { fetch: fetchStub });
    expect(result).toMatchObject({ ok: false, kind: "invalid_input" });
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe("token handling", () => {
  it("never logs the token and never returns it, even if eBay echoes it back", async () => {
    const logSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "info").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
      vi.spyOn(console, "debug").mockImplementation(() => {}),
    ];
    const echoed = {
      errors: [
        {
          errorId: 1001,
          domain: "OAuth",
          category: "REQUEST",
          message: `Invalid access token: ${TOKEN}`,
          longMessage: `The token ${TOKEN} is not valid.`,
          parameters: [{ name: "token", value: TOKEN }],
        },
      ],
    };
    const failures = [
      await upsertEbayInventoryItem("SKU-1", itemPayload, TOKEN, {
        fetch: stubFetch(jsonResponse(401, echoed)),
      }),
      await createEbayOffer(offerPayload, TOKEN, {
        fetch: stubFetch(jsonResponse(401, echoed)),
      }),
      await publishEbayOffer("5004011234", TOKEN, {
        fetch: stubFetch(jsonResponse(401, echoed)),
      }),
    ];

    for (const failure of failures) {
      expect(failure.ok).toBe(false);
      expect(JSON.stringify(failure)).not.toContain(TOKEN);
    }
    for (const spy of logSpies) expect(spy).not.toHaveBeenCalled();
  });
});
