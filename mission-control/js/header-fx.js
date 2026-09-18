/**
 * You&i hero — the dashboard's front face, built for the 24/7 live stream.
 *
 * The founder's spec, verbatim in intent:
 *  - an animated particle header from the finisher.co generator he configured,
 *    vendored locally (js/vendor/finisher-header.es5.min.js) so the stream never
 *    depends on a CDN;
 *  - HIS colors (#011a18 / #fcebca / #d7f3fe / #f95d07) — explicitly not the
 *    dashboard's cyan/pink/gold, because "all AI productions are all that color";
 *  - the You&i identity with "Watched over by AI" and the galaxy studio link;
 *  - a subtle 3D tilt so the hero reacts to the pointer like glass.
 *
 * Everything degrades honestly: no container, no canvas lib — the hero still
 * renders its content, it just loses the particles/tilt.
 */

export const HERO_CONFIG = {
  count: 38,
  size: { min: 2, max: 406, pulse: 0.7 },
  speed: { x: { min: 0, max: 1.9 }, y: { min: 0, max: 1.9 } },
  colors: {
    background: '#011a18',
    particles: ['#fcebca', '#d7f3fe', '#f95d07'],
  },
  blending: 'overlay',
  opacity: { center: 1, edge: 0.3 },
  skew: 1.3,
  shapes: ['c'],
  className: 'finisher-header', // the lib resolves its target element by this class (gr())
}

const GALAXY_URL = 'https://youandinotai-galaxy.ai.studio/'

export function createHeroFx({ document: doc = document, container, FinisherHeader } = {}) {
  if (!container) return { init: () => null }

  function init() {
    container.innerHTML = ''
    container.classList.add('hero-youi')
    container.classList.add('finisher-header') // what the vendored lib targets

    const fx = doc.createElement('div')
    fx.className = 'hero-fx'
    container.appendChild(fx)

    const content = doc.createElement('div')
    content.className = 'hero-content'
    const title = doc.createElement('h1')
    title.className = 'hero-title'
    title.textContent = 'You&i'
    const sub = doc.createElement('p')
    sub.className = 'hero-sub'
    sub.textContent = 'Watched over by AI'
    const link = doc.createElement('a')
    link.className = 'hero-link'
    link.setAttribute('href', GALAXY_URL)
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    link.textContent = '✦ Enter the Galaxy'
    content.appendChild(title)
    content.appendChild(sub)
    content.appendChild(link)
    container.appendChild(content)

    if (FinisherHeader) {
      try {
        new FinisherHeader(HERO_CONFIG) // eslint-disable-line no-new
      } catch {
        /* particles are decoration; the hero stands without them */
      }
    }

    // 3D tilt — pointer over the hero tilts the glass panel; leaving resets it.
    container.addEventListener('pointermove', (e) => {
      const r = container.getBoundingClientRect?.() || { width: 1, height: 1 }
      const px = (e.clientX - (r.left || 0)) / (r.width || 1) - 0.5
      const py = (e.clientY - (r.top || 0)) / (r.height || 1) - 0.5
      container.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`
    })
    container.addEventListener('pointerleave', () => { container.style.transform = '' })

    return container
  }

  return { init }
}
