# ANTIGRAVITY public stream brand spec

Source material located in repo: `C:\antigravity\tools\styles.css`, `C:\antigravity\mission-control\README.md`, and the user-provided build handoff. The attached OpenDesign zips were referenced by filename in the brief; the readable repo source is treated as the active source of truth for this pass.

## Tokens

```css
:root {
  --bg: oklch(12% 0.04 260);        /* deep-space #020617 */
  --surface: oklch(19% 0.04 255 / 0.60);
  --fg: oklch(96% 0.015 250);
  --muted: oklch(72% 0.03 255);
  --border: oklch(100% 0 0 / 0.10);
  --accent: oklch(74% 0.13 215);    /* cyan action */
  --secondary: oklch(70% 0.18 345); /* rose signal */
  --trust: oklch(79% 0.14 84);      /* gold verification */
  --ok: oklch(72% 0.16 155);
  --warn: oklch(78% 0.14 84);
  --bad: oklch(63% 0.19 25);

  --font-display: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
```

## Layout posture

- Public stream surface is separate from private operator panes; never embed Hermes Desktop, Paperclip admin, terminal, logs, or provider account screens.
- Deep-space canvas with faint 40px grid and two corner auroras; glass panels only.
- Extreme radii: 24px cards, 40–48px panels; 1px white/10 borders; shadow glow is panel-local.
- Brand gradient appears only in clipped headings/marks, not as a full background.
- Public status is categorical: green / yellow / red with last check timestamps and public-safe reasons.
- Toggle defaults to stream-safe ON. Operator preview remains blocked unless explicitly unlocked in the browser and still shows only local frame placeholders.

## Public copy rules

- Blunt builder-to-builder voice.
- No fake operational numbers. Unknown values are labeled `not verified` or `placeholder`.
- Payment/provider internals, auth material, private logs, family details, customer data, and remote-access details stay off-screen.
- Mission line may state `#UntilNoKidInNeed`; it must not ask the viewer for money.
