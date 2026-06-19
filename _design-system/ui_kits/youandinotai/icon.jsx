/* Shared Lucide icon helper for the YouAndINotAI UI kit.
   Renders a Lucide glyph via the UMD build; re-hydrates on every render. */

function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 2, style = {} }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: { width: size, height: size, stroke: color, 'stroke-width': strokeWidth },
        nameAttr: 'data-lucide',
      });
    }
  }, [name, size, color, strokeWidth]);
  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}
    />
  );
}

window.YIN_Icon = Icon;
