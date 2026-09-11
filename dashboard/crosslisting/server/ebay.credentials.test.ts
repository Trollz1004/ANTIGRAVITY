import { describe, expect, it } from "vitest";

describe("eBay server credentials", () => {
  it("mints a production application token without exposing the app keyset", async () => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const ruName = process.env.EBAY_RU_NAME;
    expect(clientId, "EBAY_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "EBAY_CLIENT_SECRET must be configured").toBeTruthy();
    expect(ruName, "EBAY_RU_NAME must be configured").toBeTruthy();
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "client_credentials", scope: "https://api.ebay.com/oauth/api_scope" }),
    });
    expect(response.status, "eBay did not accept the configured production app keyset").toBe(200);
    const result = await response.json() as { access_token?: string };
    expect(result.access_token, "eBay did not return an application access token").toEqual(expect.any(String));
  }, 20_000);

  it.skip("exchanges the server-side refresh token without exposing credential values", async () => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const refreshToken = process.env.EBAY_REFRESH_TOKEN;

    expect(clientId, "EBAY_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "EBAY_CLIENT_SECRET must be configured").toBeTruthy();
    expect(refreshToken, "EBAY_REFRESH_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken! }),
    });

    expect(response.status, "eBay did not accept the configured credential set").toBe(200);
    const result = await response.json() as { access_token?: string; expires_in?: number };
    expect(result.access_token, "eBay did not return an access token").toEqual(expect.any(String));
    expect(result.expires_in, "eBay did not return an expiry").toEqual(expect.any(Number));
  }, 20_000);
});
