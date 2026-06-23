from __future__ import annotations

from ..secrets import VaultEnv
from ..status import Check


def probe_revenue(vault: VaultEnv | None = None) -> list[Check]:
    vault = vault or VaultEnv()
    square_ready = vault.has_any(("SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"))
    alternate processor_ready = vault.has_any(("alternate processor_SECRET_KEY",))
    return [
        Check("Square today", "yellow" if square_ready else "red", "API probe pending" if square_ready else "missing Square credentials", {"real_values_only": True}),
        Check("Square today", "yellow" if alternate processor_ready else "red", "API probe pending" if alternate processor_ready else "missing Square credentials", {"real_values_only": True}),
        Check("10 percent reserve floor", "yellow", "requires live payment ledger probe", {}),
    ]
