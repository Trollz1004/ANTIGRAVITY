import "dotenv/config";

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

function num(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: num(process.env.PORT, 8090),

  router: {
    timeoutMs: num(process.env.ROUTER_TIMEOUT_MS, 8000),
    circuitBreakerThreshold: num(process.env.CIRCUIT_BREAKER_THRESHOLD, 5),
    circuitBreakerCooldownMs: num(process.env.CIRCUIT_BREAKER_COOLDOWN_MS, 30000),
  },

  childMode: {
    enableCloud: bool(process.env.ENABLE_CHILD_MODE_CLOUD, false),
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    modelT0: process.env.OLLAMA_MODEL_T0 ?? "joshlcoleman/CFO-Until-No-Kid-In-Need:latest",
  },

  onemin: {
    apiKey: process.env.ONEMIN_API_KEY ?? "",
    baseUrl: process.env.ONEMIN_BASE_URL ?? "https://api.1min.ai",
    modelT1: process.env.ONEMIN_MODEL_T1 ?? "",
    authStyle: (process.env.ONEMIN_AUTH_STYLE ?? "api-key") as "api-key" | "bearer",
    rateLimitPerMin: num(process.env.ONEMIN_RATE_LIMIT_PER_MIN, 180),
  },

  aihubmix: {
    apiKey: process.env.AIHUBMIX_API_KEY ?? "",
    baseUrl: process.env.AIHUBMIX_BASE_URL ?? "https://aihubmix.com/v1",
    modelOverflow: process.env.AIHUBMIX_MODEL_OVERFLOW ?? "auto",
  },

  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;

export type AppConfig = typeof config;
