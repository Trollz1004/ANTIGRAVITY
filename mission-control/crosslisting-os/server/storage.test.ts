import fs from "node:fs/promises";
import http, { type Server } from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerStorageProxy } from "./_core/storageProxy";
import { storageGet, storageGetSignedUrl, storagePut } from "./storage";

type RouteHandler = (req: any, res: any) => unknown | Promise<unknown>;

function createTestServerWithStorageRoute(): Server {
  const getRoutes: Array<{ prefix: string; handler: RouteHandler }> = [];

  const app = {
    get(routePath: string, handler: RouteHandler) {
      const prefix = routePath.endsWith("/*")
        ? routePath.slice(0, -1)
        : routePath;
      getRoutes.push({ prefix, handler });
      return app;
    },
  };

  registerStorageProxy(app as any);

  return http.createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const rawUrl = req.url ?? "/";
    const pathname = rawUrl.split("?")[0] ?? "/";

    if (method !== "GET" && method !== "HEAD") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    for (const route of getRoutes) {
      if (pathname.startsWith(route.prefix)) {
        const wildcard = decodeURIComponent(
          pathname.slice(route.prefix.length)
        );
        let statusCode = 200;
        const headers: Record<string, string> = {};

        const mockReq = {
          method,
          url: rawUrl,
          path: pathname,
          params: { 0: wildcard },
          headers: req.headers,
        };

        const mockRes = {
          status(code: number) {
            statusCode = code;
            return mockRes;
          },
          set(name: string, value: string) {
            headers[name.toLowerCase()] = value;
            return mockRes;
          },
          setHeader(name: string, value: string) {
            headers[name.toLowerCase()] = value;
            return mockRes;
          },
          type(contentType: string) {
            headers["content-type"] = contentType;
            return mockRes;
          },
          send(body: Buffer | string) {
            res.writeHead(statusCode, headers);
            res.end(body);
            return mockRes;
          },
          end(body?: Buffer | string) {
            res.writeHead(statusCode, headers);
            res.end(body);
            return mockRes;
          },
          redirect(code: number, location: string) {
            res.writeHead(code, { ...headers, location });
            res.end();
            return mockRes;
          },
        };

        await route.handler(mockReq, mockRes);
        return;
      }
    }

    res.statusCode = 404;
    res.end("Not Found");
  });
}

describe("local disk storage", () => {
  let tempDir = "";
  const originalStorageDir = process.env.STORAGE_DIR;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "crosslister-storage-test-")
    );
    process.env.STORAGE_DIR = tempDir;
  });

  afterEach(async () => {
    if (originalStorageDir === undefined) {
      delete process.env.STORAGE_DIR;
    } else {
      process.env.STORAGE_DIR = originalStorageDir;
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stores bytes on local disk with a server-made file name and reads back the same bytes", async () => {
    const payload = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x42, 0x99,
    ]);
    const stored = await storagePut(
      "caller-supplied-name.png",
      payload,
      "image/png"
    );

    expect(stored.key).toBeTruthy();
    expect(stored.key).not.toContain("caller-supplied-name");
    expect(stored.url).toBe(`/manus-storage/${stored.key}`);

    const diskPath = path.join(tempDir, stored.key);
    const diskBytes = await fs.readFile(diskPath);
    expect(diskBytes.equals(payload)).toBe(true);

    const got = await storageGet(stored.key);
    expect(got).toEqual({ key: stored.key, url: stored.url });

    const signedUrl = await storageGetSignedUrl(stored.key);
    expect(signedUrl).toBe(stored.url);
  });

  it("refuses any file name or key with ..\\ or ../ or leaving the storage folder", async () => {
    const payload = Buffer.from("hello");

    await expect(
      storagePut("../outside.txt", payload, "text/plain")
    ).rejects.toThrow();
    await expect(
      storagePut("..\\outside.txt", payload, "text/plain")
    ).rejects.toThrow();
    await expect(
      storagePut("nested/../../outside.txt", payload, "text/plain")
    ).rejects.toThrow();
    await expect(
      storagePut("nested\\..\\..\\outside.txt", payload, "text/plain")
    ).rejects.toThrow();

    await expect(storageGet("../outside.txt")).rejects.toThrow();
    await expect(storageGet("..\\outside.txt")).rejects.toThrow();
    await expect(storageGetSignedUrl("../outside.txt")).rejects.toThrow();
    await expect(storageGetSignedUrl("..\\outside.txt")).rejects.toThrow();
  });

  it("refuses a file over the size limit and refuses disallowed content types", async () => {
    const oversized = Buffer.alloc(16 * 1024 * 1024 + 1, 0x61);
    await expect(
      storagePut("too-large.png", oversized, "image/png")
    ).rejects.toThrow(/size|limit/i);

    await expect(
      storagePut(
        "unsafe.html",
        Buffer.from("<script>alert(1)</script>"),
        "text/html"
      )
    ).rejects.toThrow(/type|allowed|unsupported/i);
  });

  it("serves the stored file from the app route read-only", async () => {
    const payload = Buffer.from("stored-image-bytes-for-route-test");
    const stored = await storagePut("upload.png", payload, "image/png");

    const server = createTestServerWithStorageRoute();
    await new Promise<void>(resolve =>
      server.listen(0, "127.0.0.1", () => resolve())
    );

    try {
      const { port } = server.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${port}`;

      const getResp = await fetch(`${baseUrl}${stored.url}`);
      expect(getResp.status).toBe(200);
      expect(getResp.headers.get("content-type")).toContain("image/png");
      const bodyBytes = Buffer.from(await getResp.arrayBuffer());
      expect(bodyBytes.equals(payload)).toBe(true);

      const postResp = await fetch(`${baseUrl}${stored.url}`, {
        method: "POST",
        body: "overwrite",
      });
      expect([404, 405]).toContain(postResp.status);

      const traversalSlash = await fetch(
        `${baseUrl}/manus-storage/..%2Foutside.txt`
      );
      expect([400, 403, 404]).toContain(traversalSlash.status);

      const traversalBackslash = await fetch(
        `${baseUrl}/manus-storage/..%5Coutside.txt`
      );
      expect([400, 403, 404]).toContain(traversalBackslash.status);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve()))
      );
    }
  });
});
