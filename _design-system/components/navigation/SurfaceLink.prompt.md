Link card pointing to a product surface in the ANTIGRAVITY ecosystem. Used in the "Public Surfaces" grid. Lifts and lights its border cyan on hover.

```jsx
import { ExternalLink } from 'lucide-react';
<SurfaceLink
  name="YouAndINotAI"
  status="Live Product"
  statusTone="success"
  description="Dating & community with Bot-Shield human verification."
  href="https://youandinotai.com"
  icon={<ExternalLink size={16} />}
/>
```

`statusTone` colors the eyebrow — use `paused` for legal-review surfaces.
