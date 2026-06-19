The universal small "system text" — JetBrains Mono, 10px, uppercase, widest tracking. Use for stat labels, timestamps, nav items, eyebrows, and small headers; pass `dot` for a glowing live indicator.

```jsx
<MonoLabel>Tracked Revenue</MonoLabel>
<MonoLabel dot color="var(--ag-cyan)">System · Live</MonoLabel>
<MonoLabel dot="var(--ag-warning)">Paused · Legal review</MonoLabel>
```

`dot={true}` renders a green live dot; pass a color string for any other status. `size` overrides the 10px default.
