import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { NpcRequestSchema } from "./contract.js";
import { routeNpcRequest, getCircuitBreakerStates } from "./policy.js";

/**
 * Optional API-key gate. When ROUTER_API_KEY is set, callers must send a
 * matching `X-API-Key` header on gated routes. When unset, the service is
 * treated as internal-only behind a trusted gateway — /health stays open
 * either way so orchestration/liveness probes don't need the key.
 */
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const configured = config.router.apiKey;
  if (!configured) {
    next();
    return;
  }
  const provided = req.header("x-api-key");
  if (provided && provided === configured) {
    next();
    return;
  }
  res.status(401).json({ error: "unauthorized" });
}

export function buildServer(): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "dream-npc-router", timestamp: new Date().toISOString() });
  });

  app.get("/providers", requireApiKey, (_req, res) => {
    res.json({
      providers: [
        {
          name: "ollama",
          tier: "T0 / child-mode / degrade target",
          baseUrl: config.ollama.baseUrl,
          model: config.ollama.modelT0,
          status: "local, default fallback",
        },
        {
          name: "onemin",
          tier: "T1 primary",
          baseUrl: config.onemin.baseUrl,
          model: config.onemin.modelT1 || "(unset)",
          authStyle: config.onemin.authStyle,
          configured: Boolean(config.onemin.apiKey),
          canary: "UNVERIFIED against live API — /api/features schema reconstructed from partial docs, needs a real key + live call to confirm.",
        },
        {
          name: "aihubmix",
          tier: "T1 overflow / T2 placeholder",
          baseUrl: config.aihubmix.baseUrl,
          model: config.aihubmix.modelOverflow,
          configured: Boolean(config.aihubmix.apiKey),
        },
        {
          name: "supa",
          tier: "reserved",
          status: "STUB ONLY — not implemented. Future: real Claude via CLI auth login, never an API key.",
        },
      ],
      circuitBreakers: getCircuitBreakerStates(),
    });
  });

  app.post("/npc/respond", requireApiKey, async (req, res) => {
    const reqId = randomUUID();
    const parsed = NpcRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      return;
    }

    try {
      const result = await routeNpcRequest(parsed.data, reqId);
      res.json({
        reqId,
        provider: result.providerUsed,
        fallbackReason: result.fallbackReason,
        reserved: result.reserved ?? false,
        ...result.response,
      });
    } catch (err) {
      logger.error({ reqId, err: err instanceof Error ? err.message : String(err) }, "npc_respond_unhandled_error");
      res.status(500).json({ error: "internal_error", reqId });
    }
  });

  return app;
}

/* c8 ignore start */
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("server.js")) {
  const app = buildServer();
  app.listen(config.port, () => {
    logger.info({ port: config.port }, "dream-npc-router listening");
  });
}
/* c8 ignore stop */
