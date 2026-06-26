import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const apiUrl = process.env.VITE_API_URL
  // Defensive guard: VITE_API_URL should be empty (relative paths) or a localhost
  // address. Baked-in LAN IPs (e.g. 192.168.x.x) lock the bundle to a single host
  // and break every other node that serves the same dist. The intent of the
  // api.ts code is "relative paths by default so the dashboard works regardless
  // of origin (localhost, LAN IP, tunnel)". A non-empty non-localhost value here
  // is almost always a mistake — fail the build loudly so it's caught in CI.
  if (apiUrl && apiUrl.length > 0) {
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/?$/.test(apiUrl)
    if (!isLocal) {
      throw new Error(
        `VITE_API_URL="${apiUrl}" looks like a baked-in LAN IP. ` +
        `Leave it unset (or set to http://127.0.0.1:<port>) so the bundle ` +
        `uses relative paths and works on whatever host serves it. ` +
        `Override at runtime with ?api=http://host:port if you need to.`,
      )
    }
  }
  return {
    plugins: [react()],
  }
})
