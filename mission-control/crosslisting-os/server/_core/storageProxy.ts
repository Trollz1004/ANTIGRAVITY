import type { Express } from "express";
import { resolveStoragePath, storageRead } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }

    const rawUrl = req.url ?? "";
    if (/(\.\.|%2e%2e|\\|%5c)/i.test(rawUrl)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    const key = (req.params as Record<string, string> | undefined)?.[0] ?? "";
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      resolveStoragePath(key);
    } catch {
      res.status(400).send("Invalid storage key");
      return;
    }

    try {
      const stored = await storageRead(key);
      res.set("Content-Type", stored.contentType);
      res.set("X-Content-Type-Options", "nosniff");
      res.set("Cache-Control", "no-store");
      res.status(200).send(stored.data);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code === "ENOENT") {
        res.status(404).send("Stored file not found");
        return;
      }
      res.status(400).send("Unable to read stored file");
    }
  });
}
