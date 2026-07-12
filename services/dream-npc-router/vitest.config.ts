import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    // Cold transform on Windows can exceed 20s; keep per-test budget generous
    // while individual roundtrip assertions still enforce ≤2s wall latency.
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
