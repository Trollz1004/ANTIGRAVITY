"""ANTIGRAVITY Mission Control v6.

Self-healing health monitor for the local ANTIGRAVITY stack (Hermes dashboard,
OpenClaw gateway/UI, OmniRoute, Ollama, the date-app backend/frontend, and the
docker data-store trio).

Core contract:
    - watch every service that is *expected* to be up;
    - when one of them goes down, notify the operator through every configured
      channel. Every notification embeds the "easy button" (one POST to this
      service) AND the standalone fix script/commands so the issue can be
      resolved from inside the notification itself;
    - expose a dashboard + JSON API with a literal FIX button per service.
"""

__version__ = "6.0.0"
__all__ = ["__version__"]
