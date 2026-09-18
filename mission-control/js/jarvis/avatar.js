/**
 * JARVIS avatar — load the billboard GLB/VRM into a three.js scene.
 * Defaults to the avatar-model package path (relative for web serve).
 */

export const DEFAULT_AVATAR_URL = './assets/avatar.glb'

/**
 * Load a glTF/VRM avatar into an existing three.js scene.
 * @param {object} three — the THREE namespace
 * @param {object} scene — THREE.Scene
 * @param {string} [url]
 * @param {object} [opts]
 * @returns {Promise<{root: object, dispose: Function}>}
 */
export async function loadAvatar(three, scene, url = DEFAULT_AVATAR_URL, opts = {}) {
  if (!three || !scene) throw new Error('loadAvatar requires three + scene')

  // Prefer GLTFLoader from opts or global; tests can pass a mock.
  const Loader = opts.GLTFLoader
    || (typeof window !== 'undefined' && window.GLTFLoader)
    || null

  if (!Loader) {
    // Stub path for tests / no-loader environments: place a named group.
    const root = new three.Group()
    root.name = 'JarvisAvatarStub'
    root.userData = { avatarUrl: url, stub: true }
    scene.add(root)
    return {
      root,
      dispose() { scene.remove(root) },
    }
  }

  const loader = new Loader()
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene || gltf
  root.name = 'JarvisAvatar'
  root.userData = { avatarUrl: url }
  if (opts.position) root.position.set(...opts.position)
  if (opts.scale) root.scale.setScalar(opts.scale)
  scene.add(root)
  return {
    root,
    dispose() { scene.remove(root) },
  }
}
