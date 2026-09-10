/**
 * Test setup — mocks browser globals and CDN imports for vitest
 */

// Mock three.js and VRM plugin
const threeMocks = {
  Scene: class { constructor() { this.background = null; this.children = [] } add() {} remove() {} },
  PerspectiveCamera: class { constructor() { this.position = { set() {} }; this.aspect = 1 } updateProjectionMatrix() {} },
  WebGLRenderer: class { constructor() { this.domElement = {} } setSize() {} setPixelRatio() {} render() {} },
  Color: class { constructor(v) { this.value = v } },
  DirectionalLight: class { constructor() { this.position = { set() {}, normalize() {} } } },
  AmbientLight: class { constructor() {} },
  GridHelper: class { constructor() {} },
  CapsuleGeometry: class { constructor() {} },
  SphereGeometry: class { constructor() {} },
  MeshStandardMaterial: class { constructor() {} },
  Mesh: class { constructor() { this.position = { set() {}, y: 0 }; this.rotation = { y: 0 } } },
  Clock: class { getDelta() { return 0.016 } },
  Group: class { constructor() { this.children = [] } add() {} },
}

vi.mock('three', () => threeMocks)
vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: class { constructor() { this.target = { set() {} } } update() {} },
}))
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class { register() {} async parseAsync() { return { userData: {} } } },
}))
vi.mock('@pixiv/three-vrm', () => ({
  VRMLoaderPlugin: class { constructor() {} },
  VRM: class { constructor() {} },
}))

// DOM mock
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag
    this.children = []
    this.classList = { add: vi.fn(), remove: vi.fn(), contains: vi.fn(() => false) }
    this.style = {}
    this.dataset = {}
    this._innerHTML = ''
    this._textContent = ''
    this.value = ''
    this.files = []
    this.clientWidth = 800
    this.clientHeight = 600
    this.scrollTop = 0
    this.scrollHeight = 0
  }
  appendChild(c) { this.children.push(c); return c }
  insertBefore(c) { this.children.unshift(c); return c }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null }
  focus() {}
  click() {}
  play() {}
  toBlob(cb) { cb(null) }
  get innerHTML() { return this._innerHTML }
  set innerHTML(v) { this._innerHTML = v }
  get textContent() { return this._textContent }
  set textContent(v) { this._textContent = v }
  querySelector() { return new MockElement() }
  querySelectorAll() { return [] }
}

global.document = {
  createElement: (tag) => new MockElement(tag),
  createElementNS: () => new MockElement(),
  createTextNode: (t) => ({ textContent: t }),
  querySelector: () => new MockElement(),
  querySelectorAll: () => [],
  getElementById: () => new MockElement(),
  addEventListener: vi.fn(),
  body: new MockElement('body'),
}

global.window = {
  addEventListener: vi.fn(),
  devicePixelRatio: 1,
  requestAnimationFrame: vi.fn(() => 1),
}

global.fetch = vi.fn()
global.URL.createObjectURL = vi.fn(() => 'blob:mock')
