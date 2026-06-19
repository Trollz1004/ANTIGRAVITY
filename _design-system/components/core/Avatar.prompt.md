Circular user avatar. The gold `verified` ring is the platform's core trust signal ("Verified Human") — use it for any bot-shield-verified person.

```jsx
<Avatar src="/me.jpg" name="Maya R" size={56} verified online />
<Avatar name="Josh Coleman" size={40} />
```

Falls back to initials when `src` is absent. `online` shows a green status dot; `ring` sets a custom ring color when not verified.
