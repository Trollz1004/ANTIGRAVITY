import { vi } from "vitest";

// Ensure a deterministic, cloud-key-free env for every test unless a test overrides it.
process.env.ROUTER_TIMEOUT_MS = process.env.ROUTER_TIMEOUT_MS ?? "8000";
process.env.CIRCUIT_BREAKER_THRESHOLD = process.env.CIRCUIT_BREAKER_THRESHOLD ?? "5";
process.env.CIRCUIT_BREAKER_COOLDOWN_MS = process.env.CIRCUIT_BREAKER_COOLDOWN_MS ?? "30000";

export function mockUndiciRequest() {
  return vi.fn();
}
