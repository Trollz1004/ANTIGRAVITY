// Minimal clsx-style helper (avoiding the dep).
export default function clsx(
  ...parts: Array<string | false | null | undefined | Record<string, boolean | undefined>>
): string {
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (typeof p === "string") {
      out.push(p);
    } else if (typeof p === "object") {
      for (const [k, v] of Object.entries(p)) {
        if (v) out.push(k);
      }
    }
  }
  return out.join(" ");
}
