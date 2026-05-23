# Mission Control drop-in · OpusPawClaw flagship

**Target repo:** `D:\Antigravity\joshuaclaw-flagship-beta-testing\`
**Contract:** spec from `briefings/MISSION-CONTROL-GUI-PROMPT-2026-04-28.md`.

## Files in this drop

```
src/modes/MissionMode.tsx                    — new mode component (default export)
src/components/HermesRouterPanel.tsx         — polls localhost:11435/healthz
src/components/PaperclipWorkerPanel.tsx      — polls paperclip-hq.youandinotai.com/api/health
src/components/RunbookViewer.tsx             — sandboxed .html runbook iframe
```

## Integration steps

1. Copy the 4 files above into the matching paths inside the flagship repo.
2. Apply the two edits in `src/App.tsx` below.
3. Apply the one edit in `src/components/Sidebar.tsx` below.
4. From the flagship root: `npm run dev:electron`
5. Click **Mission** in the sidebar.

## App.tsx — 2 edits

```tsx
// ① add 'mission' to the activeMode union
const [activeMode, setActiveMode] = useState<
  'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'social' | 'mission'
>('code');

// ② add the switch case (import at top)
import MissionMode from './modes/MissionMode';

const renderMode = () => {
  switch (activeMode) {
    case 'code':     return <CodeMode />;
    case 'chat':     return <ChatMode />;
    case 'create':   return <CreateMode />;
    case 'research': return <ResearchMode />;
    case 'settings': return <SettingsPanel />;
    case 'mars':     return <MarsLaunch />;
    case 'social':   return <SocialCommandCenter />;
    case 'mission':  return <MissionMode />;    // ← add
    default:         return <DualPane />;
  }
};
```

## Sidebar.tsx — 1 edit (best-effort)

Add the Compass import at the top:
```tsx
import { Code2, Image as ImageIcon, Search, MessageSquare, Settings, Plus, Rocket, Ticket, Compass } from 'lucide-react';
```

Then inside the top button stack (where Code/Create/Research/Chat/Mars currently live), add one more entry:
```tsx
<button onClick={() => onModeChange?.('mission')} className={getBtnClass('mission')}>
  <Compass size={20} className="text-[#e040fb]" />
  <span className="text-sm font-medium">Mission</span>
</button>
```

(Also widen the `onModeChange` type in the `SidebarProps` to include `'mission'`.)

## Caveats

- All three new panels enforce a **4-second AbortController timeout** on every fetch
  (per the prompt rules).
- Polling pauses when `document.visibilityState === 'hidden'`.
- No fabricated data. On unreachable: "endpoint unreachable — retry".
- No Haiku string anywhere; only "Opus" as the Anthropic surface label.
- No §496.405 trigger words ("donate/donation/solicitation"). "for the kids" is allowed.
- Tailwind tokens reused from `src/index.css`: cyan/magenta/gold/green on `#0a0f1a`. No new colors.
- Lucide icons only. No new fonts.

## Web-preview mirror

Everything here also runs in the hosted preview that ships with this repo
(`/app/frontend` + `/app/backend`). The backend implements a Hermes Router
mirror at `/api/hermes/*` and a Paperclip mirror at `/api/paperclip/health`,
both powered by the Emergent Universal LLM key. Use that to demo Mission
Control from any browser while Joshua's workstation is offline.

#UntilNoKidInNeed · for the kids
