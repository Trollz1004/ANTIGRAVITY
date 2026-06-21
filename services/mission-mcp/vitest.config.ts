import { defineConfig, Plugin } from "vitest/config";
import { readFileSync } from "fs";

function sqlPlugin(): Plugin {
  return {
    name: "sql-loader",
    transform(code, id) {
      if (id.endsWith(".sql")) {
        const content = readFileSync(id, "utf-8");
        return {
          code: `export default ${JSON.stringify(content)};`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [sqlPlugin()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "../../coverage/mission-mcp",
    },
  },
});
