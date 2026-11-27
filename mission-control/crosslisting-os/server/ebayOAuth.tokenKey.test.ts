import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./ebayOAuth";

const FAKE_SECRET = "made-up-test-secret-for-key-derivation";

describe("eBay token key derivation", () => {
  const original = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = FAKE_SECRET;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  });

  it("round-trips a token when JWT_SECRET is set", () => {
    const payload = encryptToken("made-up-refresh-token");
    expect(decryptToken(payload)).toBe("made-up-refresh-token");
  });

  it("refuses to encrypt when JWT_SECRET is unset", () => {
    delete process.env.JWT_SECRET;
    expect(() => encryptToken("made-up-refresh-token")).toThrow(/JWT_SECRET/);
  });

  it("refuses to encrypt when JWT_SECRET is empty or only spaces", () => {
    process.env.JWT_SECRET = "";
    expect(() => encryptToken("made-up-refresh-token")).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = "   ";
    expect(() => encryptToken("made-up-refresh-token")).toThrow(/JWT_SECRET/);
  });

  it("refuses to decrypt when JWT_SECRET is unset, even for a payload made with an empty key", () => {
    const payload = encryptToken("made-up-refresh-token");
    delete process.env.JWT_SECRET;
    expect(() => decryptToken(payload)).toThrow(/JWT_SECRET/);
  });

  it("never puts the secret or the token in the error message", () => {
    delete process.env.JWT_SECRET;
    let message = "";
    try {
      encryptToken("made-up-refresh-token");
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain(FAKE_SECRET);
    expect(message).not.toContain("made-up-refresh-token");
  });
});
