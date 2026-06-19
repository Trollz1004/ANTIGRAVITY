Primary action control — use for any clickable action; neon-cyan fill is the default "go" button, pink for a secondary CTA, outline/ghost for low-emphasis.

```jsx
import { Heart } from 'lucide-react'; // optional icon
<Button variant="neon" size="lg" icon={<Heart size={16} />}>Match</Button>
<Button variant="outline">Cancel</Button>
<Button variant="pink">Super Like</Button>
<Button variant="ghost" size="sm">Skip</Button>
```

Variants: `neon` (cyan glow, dark text — primary), `pink` (rose glow — secondary CTA), `outline` (hairline, lifts on hover), `ghost` (cyan text only).
Sizes: `sm` / `md` / `lg`. Pass `icon` / `iconRight` for leading/trailing glyphs. All variants brighten on hover and shrink to 0.95 on press.
