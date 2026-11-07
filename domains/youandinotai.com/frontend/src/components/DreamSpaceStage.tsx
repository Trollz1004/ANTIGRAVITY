import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * In-house Three.js WebGL stage (#youandinotai-stage-canvas).
 * MIT library, zero hosted scene service, zero gradient wash.
 * Camera glides along scroll progress while all foreground typography holds still.
 */
export function DreamSpaceStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx2d = canvas.getContext('2d', { alpha: false });
    const glCanvas = document.createElement('canvas');

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Graceful fallback when WebGL is unavailable (e.g., headless JSDOM tests).
      return;
    }

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(Math.floor(window.innerWidth * dpr), 1);
      canvas.height = Math.max(Math.floor(window.innerHeight * dpr), 1);
      renderer?.setPixelRatio(dpr);
      renderer?.setSize(window.innerWidth, window.innerHeight, false);
    };

    renderer.setClearColor(0x0a0b0d, 1);
    syncCanvasSize();

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      46,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      120
    );
    camera.position.set(0, 0.8, 13.5);
    camera.lookAt(0, 0, 0);

    // 1. Deep-field calm starfield on Ink #0A0B0D
    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    // Deterministic seed so the field is calm and repeatable
    let seed = 42109;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (nextRand() - 0.5) * 44;
      starPositions[i * 3 + 1] = (nextRand() - 0.5) * 26;
      starPositions[i * 3 + 2] = -4 - nextRand() * 34;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xf4f1ea,
      size: 0.055,
      transparent: true,
      opacity: 0.52,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 2. Dual Orbital Connection Rings (Porcelain #F4F1EA + Signal #FFD21E)
    const rigGroup = new THREE.Group();
    scene.add(rigGroup);

    const porcelainRingGeo = new THREE.TorusGeometry(3.25, 0.014, 16, 140);
    const porcelainRingMat = new THREE.MeshBasicMaterial({
      color: 0xf4f1ea,
      transparent: true,
      opacity: 0.35,
    });
    const porcelainRing = new THREE.Mesh(porcelainRingGeo, porcelainRingMat);
    porcelainRing.rotation.x = Math.PI * 0.36;
    porcelainRing.rotation.y = -Math.PI * 0.12;
    rigGroup.add(porcelainRing);

    const signalRingGeo = new THREE.TorusGeometry(2.55, 0.018, 16, 140);
    const signalRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd21e,
      transparent: true,
      opacity: 0.45,
    });
    const signalRing = new THREE.Mesh(signalRingGeo, signalRingMat);
    signalRing.rotation.x = -Math.PI * 0.28;
    signalRing.rotation.y = Math.PI * 0.18;
    rigGroup.add(signalRing);

    // Subtle Hull #3A3F45 outer reference ring
    const hullRingGeo = new THREE.TorusGeometry(4.15, 0.01, 12, 120);
    const hullRingMat = new THREE.MeshBasicMaterial({
      color: 0x3a3f45,
      transparent: true,
      opacity: 0.42,
    });
    const hullRing = new THREE.Mesh(hullRingGeo, hullRingMat);
    hullRing.rotation.x = Math.PI * 0.48;
    rigGroup.add(hullRing);

    // Verified alignment node markers on Signal ring
    const nodeGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffd21e });
    const nodeAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    nodeAngles.forEach(angle => {
      const marker = new THREE.Mesh(nodeGeo, nodeMat);
      marker.position.set(Math.cos(angle) * 2.55, Math.sin(angle) * 2.55, 0);
      signalRing.add(marker);
    });

    // 3. Subtle Coordinate Grid Plane in Hull #3A3F45
    const gridHelper = new THREE.GridHelper(32, 24, 0x3a3f45, 0x3a3f45);
    gridHelper.position.y = -3.8;
    const gridMaterials = Array.isArray(gridHelper.material)
      ? gridHelper.material
      : [gridHelper.material];
    gridMaterials.forEach(mat => {
      mat.transparent = true;
      mat.opacity = 0.18;
    });
    scene.add(gridHelper);

    let targetScroll = 0;
    let currentScroll = 0;
    let rafId = 0;

    const readScrollProgress = () => {
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScroll = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };

    readScrollProgress();

    const renderFrame = () => {
      if (!renderer) return;
      currentScroll += (targetScroll - currentScroll) * 0.07;

      // Camera moves smoothly along scroll progress; typography on page holds still
      const p = currentScroll;
      camera.position.z = 13.5 - p * 4.8;
      camera.position.y = 0.8 + Math.sin(p * Math.PI) * 1.15 - p * 0.45;
      camera.position.x = Math.sin(p * Math.PI * 1.25) * 1.1;
      camera.lookAt(0, -0.15 * p, 0);

      // Slow, restrained orbital alignment tied to scroll + subtle time
      porcelainRing.rotation.z = p * 0.85;
      signalRing.rotation.z = -p * 1.05;
      hullRing.rotation.z = p * 0.4;

      renderer.render(scene, camera);
      if (ctx2d) {
        ctx2d.fillStyle = '#0A0B0D';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(glCanvas, 0, 0, canvas.width, canvas.height);
      }
    };

    if (prefersReducedMotion) {
      renderFrame();
    } else {
      const tick = () => {
        if (!document.hidden) {
          porcelainRing.rotation.y += 0.00045;
          signalRing.rotation.y -= 0.00055;
          renderFrame();
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    const onScroll = () => {
      readScrollProgress();
      if (prefersReducedMotion) {
        renderFrame();
      }
    };

    const onResize = () => {
      if (!renderer) return;
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
      syncCanvasSize();
      renderFrame();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
      starGeometry.dispose();
      starMaterial.dispose();
      porcelainRingGeo.dispose();
      porcelainRingMat.dispose();
      signalRingGeo.dispose();
      signalRingMat.dispose();
      hullRingGeo.dispose();
      hullRingMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      id="youandinotai-stage-canvas"
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen bg-[#0A0B0D]"
    />
  );
}

export default DreamSpaceStage;
