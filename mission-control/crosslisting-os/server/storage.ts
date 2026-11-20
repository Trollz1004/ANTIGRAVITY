// Local disk storage helpers for LLC Crosslisting OS.
// Stores files inside STORAGE_DIR (default mission-control/crosslisting-os/data/uploads)
// with server-generated file names and serves them read-only via /manus-storage/{key}.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_STORAGE_DIR, ENV } from "./_core/env";

export const MAX_STORAGE_FILE_BYTES = 16 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/wave": ".wav",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "audio/m4a": ".m4a",
  "audio/mp4": ".m4a",
  "application/pdf": ".pdf",
  "application/json": ".json",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/octet-stream": ".bin",
};

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".bin": "application/octet-stream",
};

const CROSSLISTER_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(CROSSLISTER_ROOT, "..", "..");
const DEFAULT_UPLOADS_PATH = path.resolve(CROSSLISTER_ROOT, "data", "uploads");
const DEFAULT_CREDENTIALS_PATH = path.resolve(
  CROSSLISTER_ROOT,
  "data",
  "credentials"
);
const CREDENTIALS_PREFIX = "credentials/";

export function getStorageDir(): string {
  const configured = (process.env.STORAGE_DIR ?? ENV.storageDir ?? "").trim();
  if (!configured || configured.replace(/\\/g, "/") === DEFAULT_STORAGE_DIR) {
    return DEFAULT_UPLOADS_PATH;
  }
  if (path.isAbsolute(configured)) {
    return path.resolve(configured);
  }
  if (
    configured
      .replace(/\\/g, "/")
      .startsWith("mission-control/crosslisting-os/")
  ) {
    return path.resolve(REPO_ROOT, configured);
  }
  return path.resolve(process.cwd(), configured);
}

export function getCredentialsDir(): string {
  const configured = (process.env.STORAGE_DIR ?? ENV.storageDir ?? "").trim();
  if (!configured || configured.replace(/\\/g, "/") === DEFAULT_STORAGE_DIR) {
    return DEFAULT_CREDENTIALS_PATH;
  }
  const storageDir = getStorageDir();
  if (path.basename(storageDir).toLowerCase() === "uploads") {
    const parentDir = path.dirname(storageDir);
    if (path.basename(parentDir).toLowerCase() === "data") {
      return path.resolve(parentDir, "credentials");
    }
    return path.resolve(parentDir, "data", "credentials");
  }
  return path.resolve(storageDir, "data", "credentials");
}

export function isCredentialsKey(relKey: string): boolean {
  const normalized = relKey.replace(/^\/+/, "").trim();
  return (
    normalized === "credentials" || normalized.startsWith(CREDENTIALS_PREFIX)
  );
}

function validateRelativeKey(relKey: string): string {
  if (typeof relKey !== "string" || !relKey.trim()) {
    throw new Error("Invalid storage path: key must be a non-empty string");
  }
  if (relKey.includes("\0")) {
    throw new Error("Invalid storage path: null bytes are not allowed");
  }
  if (relKey.includes("..") || relKey.includes("\\")) {
    throw new Error("Invalid storage path: path traversal is not allowed");
  }
  if (/^[a-zA-Z]:/.test(relKey) || relKey.startsWith("/")) {
    throw new Error("Invalid storage path: absolute paths are not allowed");
  }

  const normalized = relKey.replace(/^\/+/, "").trim();
  if (!normalized) {
    throw new Error("Invalid storage path: empty key");
  }

  const segments = normalized.split("/");
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") {
      throw new Error("Invalid storage path: invalid path segment");
    }
  }

  return normalized;
}

export function resolveStoragePath(relKey: string): {
  key: string;
  filePath: string;
  storageRoot: string;
} {
  const key = validateRelativeKey(relKey);
  if (isCredentialsKey(key)) {
    const credentialRelPath = key.slice(CREDENTIALS_PREFIX.length);
    if (!credentialRelPath) {
      throw new Error("Invalid storage path: missing credential file name");
    }
    const storageRoot = getCredentialsDir();
    const filePath = path.resolve(storageRoot, credentialRelPath);
    const relative = path.relative(storageRoot, filePath);

    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(
        "Invalid storage path: target leaves credentials directory"
      );
    }

    return { key, filePath, storageRoot };
  }

  const storageRoot = getStorageDir();
  const filePath = path.resolve(storageRoot, key);
  const relative = path.relative(storageRoot, filePath);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid storage path: target leaves STORAGE_DIR");
  }

  return { key, filePath, storageRoot };
}

function normalizeContentType(contentType: string): {
  mime: string;
  ext: string;
} {
  const mime = (contentType || "application/octet-stream")
    .split(";")[0]
    ?.trim()
    .toLowerCase();
  const ext = mime ? ALLOWED_CONTENT_TYPE_EXTENSIONS[mime] : undefined;
  if (!mime || !ext) {
    throw new Error(`Unsupported file content type: ${contentType}`);
  }
  return { mime, ext };
}

function toBuffer(data: Buffer | Uint8Array | string): Buffer {
  if (typeof data === "string") {
    return Buffer.from(data, "utf8");
  }
  if (Buffer.isBuffer(data)) {
    return data;
  }
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // Validate caller-supplied relative path first so any ../ or ..\ attempt is refused.
  const requestedTarget = resolveStoragePath(relKey);

  const { ext } = normalizeContentType(contentType);
  const buffer = toBuffer(data);

  const configuredLimit = Number(process.env.STORAGE_MAX_BYTES);
  const maxBytes =
    Number.isFinite(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : MAX_STORAGE_FILE_BYTES;

  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `File size ${buffer.byteLength} bytes exceeds maximum allowed limit of ${maxBytes} bytes`
    );
  }

  if (isCredentialsKey(requestedTarget.key)) {
    const { key, filePath } = requestedTarget;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return { key, url: `/manus-storage/${key}` };
  }

  // Server-generated file name only; never uses the upload's original name.
  const serverKey = `${crypto.randomUUID()}${ext}`;
  const { key, filePath, storageRoot } = resolveStoragePath(serverKey);

  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(filePath, buffer, { flag: "wx" });

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { key } = resolveStoragePath(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { key } = resolveStoragePath(relKey);
  return `/manus-storage/${key}`;
}

export async function storageRead(
  relKey: string
): Promise<{ key: string; data: Buffer; contentType: string }> {
  const { key, filePath, storageRoot } = resolveStoragePath(relKey);
  const realRoot = await fs.realpath(storageRoot);
  const realFile = await fs.realpath(filePath);
  const rel = path.relative(realRoot, realFile);

  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Invalid storage path: resolved path leaves STORAGE_DIR");
  }

  const stat = await fs.stat(realFile);
  if (!stat.isFile()) {
    throw new Error("Requested storage path is not a regular file");
  }

  const data = await fs.readFile(realFile);
  const ext = path.extname(realFile).toLowerCase();
  const contentType =
    EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";

  return { key, data, contentType };
}
