/**
 * JARVIS globe — keyless Cesium OSM shell (inspired by gods-eye-view map stack).
 * No Google/ion keys required. Uses Cesium from CDN when available; otherwise
 * returns a stub controller so the dashboard still boots.
 */

export function createGlobe(container, opts = {}) {
  const keyless = opts.keyless !== false
  let viewer = null
  let destroyed = false

  // Prefer real Cesium if the page loaded it; otherwise stub.
  const Cesium = typeof window !== 'undefined' ? window.Cesium : undefined

  if (Cesium && container) {
    try {
      // Clear prior content of a container we own (not user HTML — no XSS vector)
      if (container.innerHTML !== undefined) container.innerHTML = ''
      const canvasHost = typeof document !== 'undefined'
        ? document.createElement('div')
        : { style: {} }
      if (canvasHost.style) {
        canvasHost.style.width = '100%'
        canvasHost.style.height = '100%'
        canvasHost.style.position = 'absolute'
        canvasHost.style.inset = '0'
        canvasHost.style.zIndex = '0'
      }
      if (container.appendChild) container.appendChild(canvasHost)

      viewer = new Cesium.Viewer(canvasHost, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      })

      // Keyless OSM basemap (same pattern as gods-eye-view mapStackController)
      if (keyless && Cesium.OpenStreetMapImageryProvider) {
        viewer.imageryLayers.removeAll()
        viewer.imageryLayers.addImageryProvider(
          new Cesium.OpenStreetMapImageryProvider({
            url: 'https://tile.openstreetmap.org/',
          }),
        )
      }

      // Dark atmosphere for JARVIS look
      if (viewer.scene?.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true
      }
      if (viewer.scene?.globe) {
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1628')
      }
    } catch (err) {
      // Fall through to stub
      viewer = null
      console.warn('[jarvis/globe] Cesium init failed, using stub:', err?.message || err)
    }
  }

  const controller = {
    keyless,
    get viewer() { return viewer },
    flyTo(lon, lat, height = 2_000_000) {
      if (destroyed) return
      if (viewer?.camera?.flyTo && Cesium) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          duration: 1.5,
        })
      }
    },
    destroy() {
      destroyed = true
      try { viewer?.destroy?.() } catch {}
      viewer = null
    },
  }

  return controller
}
