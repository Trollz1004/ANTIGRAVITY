from ..envelope import make_envelope

async def paperclip_probe():
    # Paperclip HQ + watchdog decommissioned 2026-05-29 (replaced by Hermes Dashboard :9119).
    # This stub keeps the import path working so /health/all doesn't 500.
    return make_envelope(
        "degraded",
        0,
        {
            "status": "decommissioned",
            "replaced_by": "Hermes Dashboard :9119 (tunneled: dashboard.youandinotai.com)",
            "decommissioned_at": "2026-05-29",
        },
        error="Paperclip probe stub — service was retired 2026-05-29",
    )
