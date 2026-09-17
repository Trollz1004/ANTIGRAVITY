// Mock three.js for vitest
export class Scene { constructor() { this.background = null; this.children = [] } add() {} remove() {} }
export class PerspectiveCamera { constructor() { this.position = { set() {} }; this.aspect = 1 } updateProjectionMatrix() {} }
export class WebGLRenderer { constructor() { this.domElement = {} } setSize() {} setPixelRatio() {} render() {} }
export class Color { constructor(v) { this.value = v } }
export class DirectionalLight { constructor() { this.position = { set() {}, normalize() {} } } }
export class AmbientLight { constructor() {} }
export class GridHelper { constructor() {} }
export class CapsuleGeometry { constructor() {} }
export class SphereGeometry { constructor() {} }
export class MeshStandardMaterial { constructor() {} }
export class Mesh { constructor() { this.position = { set() {}, y: 0 }; this.rotation = { y: 0 } } }
export class Clock { getDelta() { return 0.016 } }
export class Group { constructor() { this.children = [] } add() {} }
export class Fog { constructor() {} }
