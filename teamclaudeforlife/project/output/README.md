# Mission Control — Drop-in Patch

Five new files for the OpusPawClaw flagship at
`D:\Antigravity\joshuaclaw-flagship-beta-testing\`.

## Files

```
src/modes/MissionMode.tsx
src/components/HermesRouterPanel.tsx
src/components/PaperclipWorkerPanel.tsx
src/components/RunbookViewer.tsx
```

Drop them in at the paths above.

## Patch 1 — `src/App.tsx`

Two edits:

### a) Add `'mission'` to the `activeMode` union and add the import

```diff
 import { SocialCommandCenter } from './components/SocialCommandCenter';
+import MissionMode from './modes/MissionMode';

 export default function App() {
   const [is18Plus, setIs18Plus] = useState(false);
-  const [activeMode, setActiveMode] = useState<'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'social'>('code');
+  const [activeMode, setActiveMode] = useState<'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'social' | 'mission'>('mission');
```

(Default mode flipped to `'mission'` so Mission Control is the landing surface. Revert to `'code'` if you don't want that.)

### b) Add the case in `renderMode()`

```diff
   const renderMode = () => {
     switch (activeMode) {
       case 'code': return <CodeMode />;
       case 'chat': return <ChatMode />;
       case 'create': return <CreateMode />;
       case 'research': return <ResearchMode />;
       case 'settings': return <SettingsPanel />;
       case 'mars': return <MarsLaunch />;
       case 'social': return <SocialCommandCenter />;
+      case 'mission': return <MissionMode />;
       default: return <DualPane />;
     }
   };
```

## Patch 2 — `src/components/Sidebar.tsx`

Two edits — extend the prop union and add the button.

```diff
-import { Code2, Image as ImageIcon, Search, MessageSquare, Settings, Plus, Rocket, Ticket } from 'lucide-react';
+import { Code2, Image as ImageIcon, Search, MessageSquare, Settings, Plus, Rocket, Ticket, Compass } from 'lucide-react';
```

```diff
 interface SidebarProps {
   activeMode?: string;
-  onModeChange?: (mode: 'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars') => void;
+  onModeChange?: (mode: 'code' | 'chat' | 'create' | 'research' | 'settings' | 'mars' | 'mission') => void;
 }
```

```diff
       <div className="px-4 mb-6 flex flex-col gap-2">
+        <button onClick={() => onModeChange?.('mission')} className={getBtnClass('mission')}><Compass size={20} className="text-[#00d4ff]" /> <span className="text-sm font-medium">Mission Control</span></button>
         <button onClick={() => onModeChange?.('code')} className={getBtnClass('code')}><Code2 size={20} /> <span className="text-sm font-medium">Code Mode</span></button>
         <button onClick={() => onModeChange?.('create')} className={getBtnClass('create')}><ImageIcon size={20} /> <span className="text-sm font-medium">Create Mode</span></button>
         <button onClick={() => onModeChange?.('research')} className={getBtnClass('research')}><Search size={20} /> <span className="text-sm font-medium">Research Mode</span></button>
         <button onClick={() => onModeChange?.('chat')} className={getBtnClass('chat')}><MessageSquare size={20} /> <span className="text-sm font-medium">Chat Mode</span></button>
         <button onClick={() => onModeChange?.('mars')} className={getBtnClass('mars')}><Rocket size={20} className="text-[#ff3d00]" /> <span className="text-sm font-medium">Mars Liftoff</span></button>
       </div>
```

## Integrate

```bash
cd D:\Antigravity\joshuaclaw-flagship-beta-testing
# (no new deps — uses existing react / lucide-react / tailwind v4)
npm run dev:electron
```

Click **Mission Control** in the sidebar.

## Caveats

- `Sidebar.tsx` patch is best-effort — verify the Lucide icon import line matches yours.
- `SystemStatus` was originally written as a sidebar footer (`mt-auto`) — wrapping it in card chrome inside MissionMode keeps it visually consistent without modifying the component.
- `DAOMonitor` includes its own border/spacing; the wrapper card respects that.
- All three new panels respect `document.visibilityState === 'hidden'` and use 4-second `AbortController` timeouts.
- No Haiku / Sonnet / "donate" strings anywhere. Verified.
- All fetch URLs match the briefing exactly: `http://localhost:11435`, `https://paperclip-hq.youandinotai.com`. Local Ollama / Paperclip-local / Hermes-dashboard endpoints are referenced in copy only — no live polling against them from this patch.
