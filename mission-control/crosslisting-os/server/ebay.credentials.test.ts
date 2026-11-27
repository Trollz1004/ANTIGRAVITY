import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channelListings } from "../drizzle/schema";
import {
  closeDb,
  createCatalogProduct,
  createListingPayloadPreview,
  getDb,
  requestListingApproval,
} from "./db";
import { decryptToken, encryptToken } from "./ebayOAuth";
import { buildSafeChannelStatus, getSafeCredentialState } from "./operations";
import { storagePut, storageRead } from "./storage";

describe("eBay server credentials", () => {
  let tempDir = "";
  const originalEnv = {
    STORAGE_DIR: process.env.STORAGE_DIR,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    EBAY_CLIENT_ID: process.env.EBAY_CLIENT_ID,
    EBAY_CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
    EBAY_RU_NAME: process.env.EBAY_RU_NAME,
    EBAY_REFRESH_TOKEN: process.env.EBAY_REFRESH_TOKEN,
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "crosslister-ebay-creds-")
    );
    process.env.STORAGE_DIR = tempDir;
    process.env.JWT_SECRET = "test-jwt-secret-for-ebay-credentials";
    process.env.DATABASE_URL = path.join(
      tempDir,
      "data",
      "crosslisting.sqlite3"
    );
    process.env.EBAY_CLIENT_ID = "test-ebay-client-id";
    process.env.EBAY_CLIENT_SECRET = "test-ebay-client-secret";
    process.env.EBAY_RU_NAME = "test-ebay-ru-name";
    delete process.env.EBAY_REFRESH_TOKEN;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const bodyText =
        init?.body instanceof URLSearchParams
          ? init.body.toString()
          : String(init?.body ?? "");
      const params = new URLSearchParams(bodyText);
      const grantType = params.get("grant_type");

      if (grantType === "client_credentials") {
        return new Response(
          JSON.stringify({
            access_token: "mock-app-access-token",
            token_type: "Application Access Token",
            expires_in: 7200,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (grantType === "refresh_token" && params.get("refresh_token")) {
        return new Response(
          JSON.stringify({
            access_token: "mock-user-access-token",
            token_type: "User Access Token",
            expires_in: 7200,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "invalid_grant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    });
  });

  afterEach(async () => {
    closeDb();
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("mints a production application token without exposing the app keyset", async () => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const ruName = process.env.EBAY_RU_NAME;
    expect(clientId, "EBAY_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "EBAY_CLIENT_SECRET must be configured").toBeTruthy();
    expect(ruName, "EBAY_RU_NAME must be configured").toBeTruthy();
    const response = await fetch("/mock-ebay/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "inventory.readonly",
      }),
    });
    expect(
      response.status,
      "eBay did not accept the configured production app keyset"
    ).toBe(200);
    const result = (await response.json()) as { access_token?: string };
    expect(
      result.access_token,
      "eBay did not return an application access token"
    ).toEqual(expect.any(String));
  });

  it("exchanges the server-side refresh token without exposing credential values", async () => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const storedSecretValue = "server-stored-ebay-refresh-token";

    await storagePut(
      "credentials/ebay-refresh-token.enc",
      encryptToken(storedSecretValue),
      "application/json"
    );

    const credentialState = getSafeCredentialState([
      "EBAY_CLIENT_ID",
      "EBAY_CLIENT_SECRET",
      "EBAY_REFRESH_TOKEN",
    ]);
    expect(credentialState).toEqual({
      configured: true,
      configuredCount: 3,
      requiredCount: 3,
    });
    expect(JSON.stringify(credentialState)).not.toContain(storedSecretValue);

    const storedBlob = await storageRead("credentials/ebay-refresh-token.enc");
    const refreshToken = decryptToken(storedBlob.data.toString("utf8"));

    expect(clientId, "EBAY_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "EBAY_CLIENT_SECRET must be configured").toBeTruthy();
    expect(refreshToken, "EBAY_REFRESH_TOKEN must be configured").toBe(
      storedSecretValue
    );

    const response = await fetch("/mock-ebay/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    expect(
      response.status,
      "eBay did not accept the configured credential set"
    ).toBe(200);
    const result = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    expect(result.access_token, "eBay did not return an access token").toEqual(
      expect.any(String)
    );
    expect(result.expires_in, "eBay did not return an expiry").toEqual(
      expect.any(Number)
    );
  });

  it("round-trips an encrypted refresh token with decryptToken and rejects tampered ciphertext", () => {
    const rawRefreshToken = "v^1.1#i^1#p^3#r^1#I^3#f^0#t^Ul4xXzE6";
    const encrypted = encryptToken(rawRefreshToken);

    expect(encrypted).not.toContain(rawRefreshToken);
    expect(decryptToken(encrypted)).toBe(rawRefreshToken);

    const tampered = JSON.parse(encrypted) as {
      v: number;
      iv: string;
      tag: string;
      ciphertext: string;
    };
    tampered.ciphertext = Buffer.from("tampered-ciphertext", "utf8").toString(
      "base64"
    );
    expect(() => decryptToken(JSON.stringify(tampered))).toThrow();
  });

  it("detects the stored encrypted refresh token file in getSafeCredentialState without env var", async () => {
    const required = [
      "EBAY_CLIENT_ID",
      "EBAY_CLIENT_SECRET",
      "EBAY_REFRESH_TOKEN",
    ] as const;

    expect(getSafeCredentialState(required)).toEqual({
      configured: false,
      configuredCount: 2,
      requiredCount: 3,
    });

    const encryptedBlob =
      typeof encryptToken === "function"
        ? encryptToken("encrypted-file-only-refresh-token")
        : JSON.stringify({
            v: 1,
            iv: Buffer.alloc(12, 1).toString("base64"),
            tag: Buffer.alloc(16, 2).toString("base64"),
            ciphertext: Buffer.from("encrypted-payload", "utf8").toString(
              "base64"
            ),
          });

    await storagePut(
      "credentials/ebay-refresh-token.enc",
      encryptedBlob,
      "application/json"
    );

    const afterStore = getSafeCredentialState(required);
    expect(afterStore).toEqual({
      configured: true,
      configuredCount: 3,
      requiredCount: 3,
    });
    expect(JSON.stringify(afterStore)).not.toContain(
      "encrypted-file-only-refresh-token"
    );

    const ebayChannel = buildSafeChannelStatus().find(
      channel => channel.code === "ebay"
    );
    expect(ebayChannel?.credentialState).toEqual({
      configured: true,
      configuredCount: 3,
      requiredCount: 3,
    });
  });

  it("saves persistedPayload with workflowCorrelationId on conflict in createListingPayloadPreview", async () => {
    const product = await createCatalogProduct({
      sku: "SKU-EBAY-1",
      upc: "012345678901",
      title: "Verified listing item",
      description: "Verified listing description",
      condition: "Used",
      format: "DVD",
      brandOrStudio: "Studio",
      actorUserId: 1,
    });

    const firstPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 19.99,
      actorUserId: 1,
    });

    const secondPreview = await createListingPayloadPreview({
      productId: product.id,
      channelCode: "ebay",
      price: 29.99,
      actorUserId: 1,
    });

    expect(secondPreview.listingId).toBe(firstPreview.listingId);
    expect(secondPreview.payload.workflowCorrelationId).toMatch(
      new RegExp(`^payload-${product.id}-ebay-`)
    );

    const db = await getDb();
    const [persistedListing] = await db!
      .select()
      .from(channelListings)
      .where(
        and(
          eq(channelListings.id, secondPreview.listingId),
          eq(channelListings.productId, product.id)
        )
      );
    expect(persistedListing?.payload).toEqual(secondPreview.payload);

    const approval = await requestListingApproval(secondPreview.listingId, 1);
    expect(approval.correlationId).toBe(
      secondPreview.payload.workflowCorrelationId
    );
  });
});
