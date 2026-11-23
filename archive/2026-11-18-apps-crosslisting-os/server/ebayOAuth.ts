import crypto from "node:crypto";
import type { Express, Request } from "express";
import { persistEbayRefreshTokenReference } from "./db";
import { storagePut } from "./storage";

function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie ?? "";
  return raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function encryptToken(token: string) {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET ?? "").digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: encrypted.toString("base64") });
}

export function registerEbayOAuthRoutes(app: Express) {
  app.get("/api/ebay/oauth/start", (req, res) => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const ruName = process.env.EBAY_RU_NAME;
    if (!clientId || !ruName) return res.status(503).send("eBay OAuth configuration is incomplete.");
    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("ebay_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 10 * 60 * 1000, path: "/api/ebay/oauth" });
    const url = new URL("https://auth.ebay.com/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", ruName);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment");
    url.searchParams.set("state", state);
    return res.redirect(url.toString());
  });

  app.get("/api/ebay/oauth/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expectedState = readCookie(req, "ebay_oauth_state") ?? "";
    const stateBuffer = Buffer.from(state);
    const expectedStateBuffer = Buffer.from(expectedState);
    if (!code || !state || stateBuffer.length !== expectedStateBuffer.length || !crypto.timingSafeEqual(stateBuffer, expectedStateBuffer)) return res.status(400).send("Authorization could not be verified.");
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const ruName = process.env.EBAY_RU_NAME;
    if (!clientId || !clientSecret || !ruName) return res.status(503).send("eBay OAuth configuration is incomplete.");
    try {
      const tokenResponse = await fetch("https://api.ebay.com/identity/v1/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: ruName }) });
      if (!tokenResponse.ok) return res.status(502).send("eBay did not accept the authorization code. Start the consent flow again.");
      const result = await tokenResponse.json() as { refresh_token?: string };
      if (!result.refresh_token) return res.status(502).send("eBay did not return a refresh token.");
      const stored = await storagePut("credentials/ebay-refresh-token.enc", encryptToken(result.refresh_token), "application/json");
      await persistEbayRefreshTokenReference(stored.key);
      res.clearCookie("ebay_oauth_state", { path: "/api/ebay/oauth" });
      return res.status(200).send("eBay authorization completed. The refresh token is stored securely on the server; you may close this window.");
    } catch {
      return res.status(500).send("The secure eBay authorization step could not be completed.");
    }
  });
}
