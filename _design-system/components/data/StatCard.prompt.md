A single tracked metric on a glass card — mono label, big black value, muted note. Used across the status dashboards; only show numbers backed by real data.

```jsx
<StatCard label="Tracked Revenue" value="$24,980" note="Shown only when backed by a production data source." accent="cyan" live />
<StatCard label="Verified Members" value="1,204" accent="gold" />
```

`accent` colors the icon/live dot; pass `icon` for a top-right glyph or `live` for a glowing dot. Grid several together (`grid-template-columns: repeat(4, 1fr)`).
