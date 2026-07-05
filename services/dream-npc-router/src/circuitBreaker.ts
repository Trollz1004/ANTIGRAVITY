/**
 * Minimal per-provider circuit breaker. Opens after N consecutive failures;
 * stays open for a cooldown window, then allows a single half-open probe.
 */
export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
  ) {}

  canAttempt(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = "half-open";
        return true;
      }
      return false;
    }
    // half-open: allow the single probe through
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.state === "half-open") {
      // Probe failed — reopen immediately.
      this.state = "open";
      this.openedAt = Date.now();
      return;
    }
    if (this.consecutiveFailures >= this.threshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
