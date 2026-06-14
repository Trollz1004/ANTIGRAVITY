import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5179,
    host: "127.0.0.1",
    allowedHosts: ["dashboard.youandinotai.com"],
  },
  preview: {
    port: 9119,
    host: "127.0.0.1",
    allowedHosts: ["dashboard.youandinotai.com"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
});
