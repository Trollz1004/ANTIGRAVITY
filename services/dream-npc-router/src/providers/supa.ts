/**
 * Reserved path for npcId "SUPA" / "Sup@" — STUB ONLY, no implementation.
 *
 * Sup@ is planned to route to real Claude via CLI auth login at a later
 * date. It must NEVER be wired to an Anthropic API key — CLI auth login
 * only, consistent with repo-wide policy. This module exists purely to
 * return a clearly-marked "reserved" marker so callers/policy code have a
 * stable shape to branch on ahead of the real implementation.
 */
export interface ReservedMarker {
  reserved: true;
  npcId: "SUPA";
  note: string;
}

export function supaReservedStub(): ReservedMarker {
  return {
    reserved: true,
    npcId: "SUPA",
    note: "Sup@ path reserved for future real-Claude (CLI auth login) integration — not implemented.",
  };
}
