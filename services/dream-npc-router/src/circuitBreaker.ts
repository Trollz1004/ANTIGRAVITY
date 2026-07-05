/**
 * Minimal per-provider circuit breaker. Opens after N consecutive failures;
 * stays open for a cooldown window, then allows a single half-open probe.
 */
export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;
  private probeInFlight = false;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
  ) {}

  canAttempt(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = "half-open";
        this.probeInFlight = true;
        return true;
      }
      return false;
    }
    // half-open: only one probe at a time — concurrent callers must wait
    // for the in-flight probe to settle before another attempt is allowed.
    if (this.probeInFlight) return false;
    this.probeInFlight = true;
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
    this.probeInFlight = false;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.state === "half-open") {
      // Probe failed — reopen immediately.
      this.state = "open";
      this.openedAt = Date.now();
      this.probeInFlight = false;
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
