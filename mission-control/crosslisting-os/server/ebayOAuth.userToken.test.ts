import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The OAuth module imports the database layer for the consent callback only.
// These tests never touch it, so it is stubbed out.
vi.mock("./db", () => ({ persistEbayRefreshTokenReference: vi.fn() }));

import {
  EbayTokenError,
  encryptToken,
  getEbayUserAccessToken,
} from "./ebayOAuth";

// Made-up values. None of these is a real credential.
const FAKE_APP_ID = "test-app-id-0001";
const FAKE_APP_SECRET = "test-app-secret-0002";
const FAKE_JWT_SECRET = "test-jwt-secret-0003";
const FAKE_REFRESH_TOKEN = "v^1.1#test-refresh-token-0004";
const FAKE_ACCESS_TOKEN = "v^1.1#test-access-token-0005";
const ALL_FAKE_VALUES = [
  FAKE_APP_SECRET,
  FAKE_JWT_SECRET,
  FAKE_REFRESH_TOKEN,
  FAKE_ACCESS_TOKEN,
];

const ENV_NAMES = [
  "EBAY_CLIENT_ID",
  "EBAY_CLIENT_SECRET",
  "JWT_SECRET",
  "STORAGE_DIR",
] as const;

let tempRoot = "";
let credentialFile = "";
let savedEnv: Record<string, string | undefined> = {};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function storeRefreshToken() {
  await fs.mkdir(path.dirname(credentialFile), { recursive: true });
  await fs.writeFile(credentialFile, encryptToken(FAKE_REFRESH_TOKEN));
}

beforeEach(async () => {
  savedEnv = Object.fromEntries(
    ENV_NAMES.map(name => [name, process.env[name]])
  );
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ebay-user-token-"));
  credentialFile = path.join(
    tempRoot,
    "data",
    "credentials",
    "ebay-refresh-token.enc"
  );
  process.env.STORAGE_DIR = path.join(tempRoot, "data", "uploads");
  process.env.EBAY_CLIENT_ID = FAKE_APP_ID;
  process.env.EBAY_CLIENT_SECRET = FAKE_APP_SECRET;
  process.env.JWT_SECRET = FAKE_JWT_SECRET;
});

afterEach(async () => {
  for (const name of ENV_NAMES) {
    const value = savedEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  vi.restoreAllMocks();
  await fs.rm(tempRoot, { recursive: true, force: true });
});

describe("getEbayUserAccessToken", () => {
  it("decrypts the stored refresh token and exchanges it for a user access token", async () => {
    await storeRefreshToken();
    const fetchStub = vi.fn(async () =>
      jsonResponse({
        access_token: FAKE_ACCESS_TOKEN,
        expires_in: 7200,
        token_type: "User Access Token",
      })
    );

    const result = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
      now: () => 1_000_000,
    });

    expect(result).toEqual({
      accessToken: FAKE_ACCESS_TOKEN,
      expiresIn: 7200,
      expiresAt: 1_000_000 + 7200 * 1000,
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.ebay.com/identity/v1/oauth2/token");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from(`${FAKE_APP_ID}:${FAKE_APP_SECRET}`).toString("base64")}`
    );
    const body = new URLSearchParams(String(init.body));
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe(FAKE_REFRESH_TOKEN);
  });

  it("reports an expired refresh token so the owner can run consent again", async () => {
    await storeRefreshToken();
    const fetchStub = vi.fn(async () =>
      jsonResponse(
        {
          error: "invalid_grant",
          error_description:
            "the provided authorization refresh token is invalid or was issued to another client",
        },
        400
      )
    );

    const failure = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
    }).catch(error => error);

    expect(failure).toBeInstanceOf(EbayTokenError);
    expect(failure.code).toBe("refresh_token_expired");
    expect(failure.message).toContain("/api/ebay/oauth/start");
    for (const value of ALL_FAKE_VALUES) {
      expect(failure.message).not.toContain(value);
    }
  });

  it("fails clearly and makes no call when the credential file is missing", async () => {
    const fetchStub = vi.fn();

    const failure = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
    }).catch(error => error);

    expect(failure).toBeInstanceOf(EbayTokenError);
    expect(failure.code).toBe("missing_credential_file");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("fails clearly and makes no call when the app keys are not configured", async () => {
    await storeRefreshToken();
    delete process.env.EBAY_CLIENT_SECRET;
    const fetchStub = vi.fn();

    const failure = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
    }).catch(error => error);

    expect(failure).toBeInstanceOf(EbayTokenError);
    expect(failure.code).toBe("missing_app_keys");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("fails clearly and makes no call when the stored token cannot be decrypted", async () => {
    await storeRefreshToken();
    process.env.JWT_SECRET = "a-different-made-up-secret";
    const fetchStub = vi.fn();

    const failure = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
    }).catch(error => error);

    expect(failure).toBeInstanceOf(EbayTokenError);
    expect(failure.code).toBe("decrypt_failed");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("reports other eBay failures by status only", async () => {
    await storeRefreshToken();
    const fetchStub = vi.fn(async () =>
      jsonResponse({ error: "server_error", detail: FAKE_REFRESH_TOKEN }, 503)
    );

    const failure = await getEbayUserAccessToken({
      fetchImpl: fetchStub as unknown as typeof fetch,
    }).catch(error => error);

    expect(failure).toBeInstanceOf(EbayTokenError);
    expect(failure.code).toBe("exchange_failed");
    expect(failure.message).toContain("503");
    for (const value of ALL_FAKE_VALUES) {
      expect(failure.message).not.toContain(value);
    }
  });

  it("never logs a token value, on success or on failure", async () => {
    await storeRefreshToken();
    const written: string[] = [];
    const capture = (...args: unknown[]) => {
      written.push(args.map(arg => String(arg)).join(" "));
    };
    for (const method of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, method).mockImplementation(capture);
    }
    vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
      capture(chunk);
      return true;
    }) as typeof process.stdout.write);
    vi.spyOn(process.stderr, "write").mockImplementation(((chunk: unknown) => {
      capture(chunk);
      return true;
    }) as typeof process.stderr.write);

    await getEbayUserAccessToken({
      fetchImpl: (async () =>
        jsonResponse({
          access_token: FAKE_ACCESS_TOKEN,
          expires_in: 7200,
        })) as unknown as typeof fetch,
    });
    await getEbayUserAccessToken({
      fetchImpl: (async () =>
        jsonResponse(
          { error: "invalid_grant" },
          400
        )) as unknown as typeof fetch,
    }).catch(() => undefined);

    const output = written.join("\n");
    for (const value of ALL_FAKE_VALUES) {
      expect(output).not.toContain(value);
    }
  });
});
