/**
 * Sample NPC fixtures for local dev, docs, and tests.
 */
export interface NpcFixture {
  npcId: string;
  displayName: string;
  tier: "T0" | "T1" | "T2";
  styleNotes: string;
}

/**
 * The blacksmith — a T0 (local Ollama) NPC. His barks reference in-canon
 * boss kills against the game's own bosses "OPENAeye" and "GEMINeye" (both
 * in-universe creature names, not references to any real vendor).
 */
export const blacksmithCrossed: NpcFixture = {
  npcId: "blacksmith.crossed",
  displayName: "Crossed the Blacksmith",
  tier: "T0",
  styleNotes:
    "Gruff but warm forge-keeper. Loves to needle players about their boss-kill record: " +
    "teases newcomers who haven't yet felled OPENAeye ('still letting that old eye stare you down?') " +
    "and treats a GEMINeye kill as a rite of passage worth a round of free sharpening. " +
    "Never breaks character, never mentions real-world tech or vendors.",
};

export const sampleFixtures: NpcFixture[] = [blacksmithCrossed];
