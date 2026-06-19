The glass surface every card, header and nav is built on. Wrap content in it; pick `radius` by density (`sm`/`card` for cards, `panel` for top-level sections, `hero` for feature panels).

```jsx
<GlassPanel radius="card" pad="card">
  <MonoLabel dot color="var(--ag-cyan)">System · Live</MonoLabel>
  <p style={{ color: 'var(--ag-text-body)' }}>Body content here.</p>
</GlassPanel>

<GlassPanel radius="panel" pad="panel" hoverLift glow>…</GlassPanel>
```

`glow` adds a cyan halo; `hoverLift` raises the panel and lights the border on hover (use for clickable cards). Set `as="a"` / `as="section"` to change the element.
