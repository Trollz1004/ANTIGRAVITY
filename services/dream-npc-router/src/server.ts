import express from "express";
import helmet from "helmet";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { NpcRequestSchema } from "./contract.js";
import { routeNpcRequest, getCircuitBreakerStates } from "./policy.js";
import {
  CANONICAL_SCHEMA_REL,
  DOCS_SCHEMA_REL,
  SAMPLE_ALIAS_TO_CANONICAL,
  SAMPLE_ALIAS_TO_SKILL_SAMPLE,
  SAMPLE_EVENT_ALIASES,
  SKILL_SAMPLES_DIR,
  parseGameWebhookEvent,
  type SampleEventAlias,
} from "./webhooks/events.js";
import { handleGameWebhookEvent } from "./webhooks/handler.js";

const SERVICE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Monorepo root (services/dream-npc-router → ../..). */
const REPO_ROOT = path.resolve(SERVICE_ROOT, "../..");

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
  const provided = req.header("x-api-key") ?? "";
  // Constant-time comparison so the key check doesn't leak length/content via
  // response-time timing side-channels. timingSafeEqual requires equal-length
  // buffers, so gate on length first with a plain check that reveals nothing
  // beyond "wrong length."
  const providedBuf = Buffer.from(provided);
  const configuredBuf = Buffer.from(configured);
  if (
    providedBuf.length === configuredBuf.length &&
    timingSafeEqual(providedBuf, configuredBuf)
  ) {
    next();
    return;
  }
  res.status(401).json({ error: "unauthorized" });
}

async function readRepoFile(relPath: string): Promise<string> {
  return readFile(path.join(REPO_ROOT, relPath), "utf8");
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

  /**
   * TRO-114 — live-NPC sample webhook surface.
   * Validates TRO-87 envelope (with player_enter / need_change / interaction aliases)
   * and returns a stub agent_wake envelope. No provider dispatch.
   */
  app.get("/webhooks/events", requireApiKey, (_req, res) => {
    res.json({
      schema_version: "1.0.0",
      contract: "TRO-87 live-npc-webhook",
      sampleAliases: SAMPLE_EVENT_ALIASES,
      aliasToCanonical: SAMPLE_ALIAS_TO_CANONICAL,
      schemaPaths: {
        skill: CANONICAL_SCHEMA_REL,
        docs: DOCS_SCHEMA_REL,
      },
      samplesDir: SKILL_SAMPLES_DIR,
      routes: {
        accept: "POST /webhooks/events",
        schema: "GET /webhooks/events/schema",
        sample: "GET /webhooks/events/:alias/sample  (player_enter|need_change|interaction)",
      },
    });
  });

  app.get("/webhooks/events/schema", requireApiKey, async (_req, res) => {
    try {
      const raw = await readRepoFile(CANONICAL_SCHEMA_REL);
      res.type("application/json").send(raw);
    } catch (err) {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, "webhook_schema_read_failed");
      res.status(500).json({ error: "schema_read_failed", path: CANONICAL_SCHEMA_REL });
    }
  });

  app.get("/webhooks/events/:alias/sample", requireApiKey, async (req, res) => {
    const alias = req.params.alias as SampleEventAlias;
    if (!(SAMPLE_EVENT_ALIASES as readonly string[]).includes(alias)) {
      res.status(404).json({
        error: "unknown_sample_alias",
        alias,
        allowed: SAMPLE_EVENT_ALIASES,
      });
      return;
    }
    try {
      const rel = path.join(SKILL_SAMPLES_DIR, SAMPLE_ALIAS_TO_SKILL_SAMPLE[alias]);
      const raw = await readRepoFile(rel);
      res.type("application/json").send(raw);
    } catch (err) {
      logger.error({ alias, err: err instanceof Error ? err.message : String(err) }, "webhook_sample_read_failed");
      res.status(500).json({ error: "sample_read_failed", alias });
    }
  });

  app.post("/webhooks/events", requireApiKey, (req, res) => {
    const reqId = randomUUID();
    const parsed = parseGameWebhookEvent(req.body);
    if (!parsed.success) {
      const details =
        parsed.error instanceof Error === false && "flatten" in parsed.error
          ? (parsed.error as { flatten: () => unknown }).flatten()
          : parsed.error;
      res.status(400).json({ error: "invalid_event", reqId, details });
      return;
    }

    const result = handleGameWebhookEvent(parsed.data);
    logger.info(
      {
        reqId,
        eventType: result.eventType,
        eventId: result.eventId,
        npcId: result.npcId,
        dispatch: result.agentCall.dispatch,
      },
      "webhook_event_accepted_stub",
    );
    res.status(202).json({ reqId, ...result });
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
