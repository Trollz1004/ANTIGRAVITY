Dark-glass text field. Mono uppercase label, inset slate fill, cyan focus ring + glow. Pass a Lucide icon for a leading glyph.

```jsx
import { Mail } from 'lucide-react';
<Input label="Email" icon={<Mail size={15} />} placeholder="you@domain.com" hint="We never share this." />
```

Controlled via `value` / `onChange`. Extra props pass through to the native `<input>`.
