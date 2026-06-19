// templates/youandinotai-platform/ds-base.js
// Loads the ANTIGRAVITY design system (global CSS + compiled component bundle).
// In a consuming project, point `base` at the bound _ds/<folder> tree relative
// to this page (e.g. "_ds/antigravity" at the root, "../_ds/antigravity" one level down).
(() => {
  const base = '../..';
  for (const p of ['styles.css']) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = base + '/' + p;
    document.head.appendChild(l);
  }
  const s = document.createElement('script');
  s.src = base + '/_ds_bundle.js';
  s.onerror = () => console.error(
    'ds-base.js: failed to load ' + s.src +
    ' — if this is a consuming project, point the base line at the bound _ds/<folder> tree relative to this page; in a fresh design system this just means the bundle is not compiled yet'
  );
  document.head.appendChild(s);
})();
