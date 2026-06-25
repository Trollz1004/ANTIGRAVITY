from __future__ import annotations

from ..secrets import VaultEnv
from ..status import Check


def probe_revenue(vault: VaultEnv | None = None) -> list[Check]:
    vault = vault or VaultEnv()
    square_ready = vault.has_any(("SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"))
    stripe_ready = vault.has_any(("STRIPE_SECRET_KEY",))
    return [
        Check("Square today", "yellow" if square_ready else "red", "API probe pending" if square_ready else "missing Square credentials", {"real_values_only": True}),
        Check("Stripe today", "yellow" if stripe_ready else "red", "API probe pending" if stripe_ready else "missing Stripe credentials", {"real_values_only": True}),
        Check("10 percent reserve floor", "yellow", "requires live payment ledger probe", {}),
    ]
