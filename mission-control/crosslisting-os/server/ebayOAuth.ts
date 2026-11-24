import crypto from "node:crypto";
import fs from "node:fs/promises";
import type { Express, Request } from "express";
import { persistEbayRefreshTokenReference } from "./db";
import { resolveStoragePath, storagePut } from "./storage";

function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie ?? "";
  return raw
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function encryptToken(token: string) {
  const key = crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET ?? "")
    .digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64"),
  });
}

export function decryptToken(encryptedPayload: string | Buffer): string {
  const raw = Buffer.isBuffer(encryptedPayload)
    ? encryptedPayload.toString("utf8")
    : encryptedPayload;
  const parsed = JSON.parse(raw) as {
    v?: unknown;
    iv?: unknown;
    tag?: unknown;
    ciphertext?: unknown;
  };
  if (
    parsed.v !== 1 ||
    typeof parsed.iv !== "string" ||
    typeof parsed.tag !== "string" ||
    typeof parsed.ciphertext !== "string"
  ) {
    throw new Error("Invalid encrypted token payload.");
  }
  const iv = Buffer.from(parsed.iv, "base64");
  const tag = Buffer.from(parsed.tag, "base64");
  const ciphertext = Buffer.from(parsed.ciphertext, "base64");
  if (iv.length !== 12 || tag.length !== 16) {
    throw new Error("Invalid encrypted token parameters.");
  }
  const key = crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET ?? "")
    .digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function registerEbayOAuthRoutes(app: Express) {
  app.get("/api/ebay/oauth/start", (req, res) => {
    const clientId = process.env.EBAY_CLIENT_ID;
    const ruName = process.env.EBAY_RU_NAME;
    if (!clientId || !ruName)
      return res.status(503).send("eBay OAuth configuration is incomplete.");
    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("ebay_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
      path: "/api/ebay/oauth",
    });
    const url = new URL("https://auth.ebay.com/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", ruName);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment"
    );
    url.searchParams.set("state", state);
    return res.redirect(url.toString());
  });

  app.get("/api/ebay/oauth/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expectedState = readCookie(req, "ebay_oauth_state") ?? "";
    const stateBuffer = Buffer.from(state);
    const expectedStateBuffer = Buffer.from(expectedState);
    if (
      !code ||
      !state ||
      stateBuffer.length !== expectedStateBuffer.length ||
      !crypto.timingSafeEqual(stateBuffer, expectedStateBuffer)
    )
      return res.status(400).send("Authorization could not be verified.");
    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const ruName = process.env.EBAY_RU_NAME;
    if (!clientId || !clientSecret || !ruName)
      return res.status(503).send("eBay OAuth configuration is incomplete.");
    try {
      const tokenResponse = await fetch(
        "https://api.ebay.com/identity/v1/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: ruName,
          }),
        }
      );
      if (!tokenResponse.ok)
        return res
          .status(502)
          .send(
            "eBay did not accept the authorization code. Start the consent flow again."
          );
      const result = (await tokenResponse.json()) as { refresh_token?: string };
      if (!result.refresh_token)
        return res.status(502).send("eBay did not return a refresh token.");
      const stored = await storagePut(
        "credentials/ebay-refresh-token.enc",
        encryptToken(result.refresh_token),
        "application/json"
      );
      await persistEbayRefreshTokenReference(stored.key);
      res.clearCookie("ebay_oauth_state", { path: "/api/ebay/oauth" });
      return res
        .status(200)
        .send(
          "eBay authorization completed. The refresh token is stored securely on the server; you may close this window."
        );
    } catch {
      return res
        .status(500)
        .send("The secure eBay authorization step could not be completed.");
    }
  });
}

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const REFRESH_TOKEN_KEY = "credentials/ebay-refresh-token.enc";

export type EbayTokenErrorCode =
  | "missing_credential_file"
  | "missing_app_keys"
  | "decrypt_failed"
  | "refresh_token_expired"
  | "exchange_failed";

/**
 * Failure while minting an eBay user access token. Messages are fixed text.
 * They never carry a token, a key, a secret, or any part of eBay's reply body.
 */
export class EbayTokenError extends Error {
  readonly code: EbayTokenErrorCode;

  constructor(code: EbayTokenErrorCode, message: string) {
    super(message);
    this.name = "EbayTokenError";
    this.code = code;
  }
}

export type EbayUserAccessToken = {
  accessToken: string;
  expiresIn: number;
  expiresAt: number;
};

export type GetEbayUserAccessTokenOptions = {
  /** Injected so tests never reach eBay. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Clock in milliseconds. Defaults to Date.now. */
  now?: () => number;
};

async function readStoredRefreshToken(): Promise<string> {
  let payload: Buffer;
  try {
    const { filePath } = resolveStoragePath(REFRESH_TOKEN_KEY);
    payload = await fs.readFile(filePath);
  } catch {
    throw new EbayTokenError(
      "missing_credential_file",
      "The stored eBay refresh token file is missing. Run eBay consent at /api/ebay/oauth/start."
    );
  }
  try {
    const refreshToken = decryptToken(payload);
    if (!refreshToken) throw new Error("empty");
    return refreshToken;
  } catch {
    throw new EbayTokenError(
      "decrypt_failed",
      "The stored eBay refresh token could not be decrypted. Check the server secret or run eBay consent again at /api/ebay/oauth/start."
    );
  }
}

/**
 * Decrypts the stored eBay refresh token and exchanges it at eBay's token
 * endpoint for a short-lived user access token. Logs nothing.
 */
export async function getEbayUserAccessToken(
  options: GetEbayUserAccessTokenOptions = {}
): Promise<EbayUserAccessToken> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new EbayTokenError(
      "missing_app_keys",
      "The eBay app keys are not configured on the server."
    );
  }

  const refreshToken = await readStoredRefreshToken();

  let response: Response;
  try {
    response = await fetchImpl(EBAY_TOKEN_URL, {
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
  } catch {
    throw new EbayTokenError(
      "exchange_failed",
      "The eBay token request could not be sent."
    );
  }

  if (!response.ok) {
    let errorCode: unknown;
    try {
      errorCode = ((await response.json()) as { error?: unknown }).error;
    } catch {
      errorCode = undefined;
    }
    if (
      (response.status === 400 || response.status === 401) &&
      errorCode === "invalid_grant"
    ) {
      throw new EbayTokenError(
        "refresh_token_expired",
        "eBay no longer accepts the stored refresh token. Run eBay consent again at /api/ebay/oauth/start."
      );
    }
    throw new EbayTokenError(
      "exchange_failed",
      `eBay did not accept the token request (status ${response.status}).`
    );
  }

  let result: { access_token?: unknown; expires_in?: unknown };
  try {
    result = (await response.json()) as typeof result;
  } catch {
    throw new EbayTokenError(
      "exchange_failed",
      "eBay returned a token reply that could not be read."
    );
  }
  if (
    typeof result.access_token !== "string" ||
    !result.access_token ||
    typeof result.expires_in !== "number" ||
    !Number.isFinite(result.expires_in)
  ) {
    throw new EbayTokenError(
      "exchange_failed",
      "eBay returned a token reply without an access token and expiry."
    );
  }

  return {
    accessToken: result.access_token,
    expiresIn: result.expires_in,
    expiresAt: now() + result.expires_in * 1000,
  };
}
