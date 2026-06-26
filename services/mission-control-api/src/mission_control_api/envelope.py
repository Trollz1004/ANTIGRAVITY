import datetime
from dataclasses import dataclass, asdict
from typing import Any, Optional

@dataclass
class Envelope:
    status: str  # ok | degraded | unreachable
    checked_at: str
    latency_ms: int
    details: Any
    error: Optional[str] = None

    def dict(self):
        return asdict(self)

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()

def make_envelope(status, latency_ms, details, error=None):
    return Envelope(status=status, checked_at=now_iso(), latency_ms=latency_ms, details=details, error=error)
