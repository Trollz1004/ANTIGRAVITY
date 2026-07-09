from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SABRETOOTH_VAULT = Path(r"C:\Users\joshl\OneDrive\Personal Vault-Sabretooth")
MASTER_ENV_NAME = "MASTER-UNIVERSAL-ENV-TROLLZ1004.env"


@dataclass(frozen=True)
class Node:
    name: str
    host: str | None
    user: str | None
    vault_path: str | None
    kind: str = "windows"
    notes: str | None = None


AUTHORIZED_NODES: tuple[Node, ...] = (
    Node("Sabretooth", "192.168.0.8", "joshl", str(SABRETOOTH_VAULT), notes="push-authority"),
    Node("T5500", "192.168.0.15", "joshl", r"C:\Users\joshl\OneDrive\Personal Vault-Sabretooth", notes="docker host"),
    Node("9020", "192.168.0.5", "joshl", r"C:\Users\joshl\OneDrive\Personal Vault-Sabretooth", notes="no git push creds"),
    Node("MINI-ASUS-PC", "192.168.0.48", "joshl", r"C:\Users\joshl\OneDrive\Personal Vault-Sabretooth", notes="thin display"),
    Node("Chromebook", None, None, None, kind="manual", notes="manual check-in only"),
)


PUBLIC_SURFACES: tuple[str, ...] = (
    "https://youandinotai.com/",
    "https://onlinerecycle.net/",
    "https://ai-solutions.store/",
    "https://dashboard.aidoesitall.website/",
)
