import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface SectionStop {
  id: string;
  index: string;
  label: string;
  shortLabel: string;
  phrase: string;
}

export const SECTION_STOPS: SectionStop[] = [
  {
    id: 'about',
    index: '01',
    label: 'Overview',
    shortLabel: 'OVERVIEW',
    phrase: 'VERIFIED PEOPLE. REAL CONNECTION.',
  },
  {
    id: 'platform',
    index: '02',
    label: 'Platform',
    shortLabel: 'PLATFORM',
    phrase: 'BUILT FOR THE FIRST CONVERSATION AND THE FIRST MEETUP.',
  },
  {
    id: 'verification',
    index: '03',
    label: 'Verification',
    shortLabel: 'VERIFY',
    phrase: 'EVERY INTRODUCTION STARTS WITH A VERIFIED HUMAN.',
  },
  {
    id: 'trust',
    index: '04',
    label: 'Trust & Safety',
    shortLabel: 'TRUST',
    phrase: 'ADULTS-ONLY STANDARDS AND FULL DATA OWNERSHIP.',
  },
  {
    id: 'pricing',
    index: '05',
    label: 'Membership',
    shortLabel: 'TIERS',
    phrase: 'ACCOUNT-BOUND FOUNDER TIERS AND VERIFIED ACCESS.',
  },
  {
    id: 'support',
    index: '06',
    label: 'Support',
    shortLabel: 'SUPPORT',
    phrase: 'DIRECT MEMBER TRIAGE AND TRACEABLE ASSISTANCE.',
  },
  {
    id: 'join',
    index: '07',
    label: 'Start Tonight',
    shortLabel: 'START',
    phrase: 'VERIFIED PEOPLE ARE ALREADY HERE.',
  },
  {
    id: 'footer',
    index: '08',
    label: 'Terms & Footer',
    shortLabel: 'TERMS',
    phrase: 'LEGAL STANDARDS AND PLATFORM OPERATIONS.',
  },
];

interface CameraKeyframe {
  zoom: number;
  camX: number;
  camY: number;
  camZ: number;
  pitchX: number;
  tiltY: number;
  rollZ: number;
  surfaceDetail: number;
}

const STOP_KEYFRAMES: CameraKeyframe[] = [
  {
    zoom: 1.0,
    camX: 0.0,
    camY: 0.35,
    camZ: 11.2,
    pitchX: 0.54,
    tiltY: -0.24,
    rollZ: 0.12,
    surfaceDetail: 0.28,
  },
  {
    zoom: 1.38,
    camX: 0.95,
    camY: 0.18,
    camZ: 8.4,
    pitchX: 0.82,
    tiltY: 0.36,
    rollZ: -0.22,
    surfaceDetail: 0.56,
  },
  {
    zoom: 1.62,
    camX: -0.85,
    camY: 0.42,
    camZ: 6.8,
    pitchX: 1.08,
    tiltY: -0.38,
    rollZ: 0.35,
    surfaceDetail: 0.76,
  },
  {
    zoom: 1.28,
    camX: 0.65,
    camY: 1.15,
    camZ: 7.8,
    pitchX: 1.32,
    tiltY: 0.22,
    rollZ: -0.44,
    surfaceDetail: 0.86,
  },
  {
    zoom: 1.48,
    camX: -0.92,
    camY: -0.25,
    camZ: 7.4,
    pitchX: 0.66,
    tiltY: -0.48,
    rollZ: 0.18,
    surfaceDetail: 0.92,
  },
  {
    zoom: 1.24,
    camX: 0.88,
    camY: 0.28,
    camZ: 8.2,
    pitchX: 0.94,
    tiltY: 0.44,
    rollZ: -0.28,
    surfaceDetail: 0.96,
  },
  {
    zoom: 1.72,
    camX: 0.0,
    camY: 0.1,
    camZ: 6.2,
    pitchX: 1.42,
    tiltY: 0.0,
    rollZ: 0.0,
    surfaceDetail: 1.0,
  },
  {
    zoom: 0.86,
    camX: 0.0,
    camY: 0.5,
    camZ: 12.6,
    pitchX: 0.32,
    tiltY: 0.0,
    rollZ: 0.0,
    surfaceDetail: 0.4,
  },
];

export interface SectionJourneyState {
  activeSectionIndex: number;
  activeSectionId: string;
  sectionFloat: number;
  atFooter: boolean;
}

export function readSectionJourneyState(): SectionJourneyState {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      activeSectionIndex: 0,
      activeSectionId: SECTION_STOPS[0].id,
      sectionFloat: 0,
      atFooter: false,
    };
  }

  if (window.scrollY <= 4) {
    return {
      activeSectionIndex: 0,
      activeSectionId: SECTION_STOPS[0].id,
      sectionFloat: 0,
      atFooter: false,
    };
  }

  const vh = Math.max(window.innerHeight, 1);
  const footerEl =
    document.getElementById('footer') || document.querySelector('footer');
  if (footerEl) {
    const fRect = footerEl.getBoundingClientRect();
    if (
      fRect.height > 0 &&
      (fRect.top <= vh * 0.82 || fRect.bottom <= vh + 32)
    ) {
      const lastIdx = SECTION_STOPS.length - 1;
      return {
        activeSectionIndex: lastIdx,
        activeSectionId: SECTION_STOPS[lastIdx].id,
        sectionFloat: lastIdx,
        atFooter: true,
      };
    }
  }

  let activeIdx = 0;
  let intra = 0;
  const triggerLine = vh * 0.42;

  for (let i = 0; i < SECTION_STOPS.length - 1; i++) {
    const el = document.getElementById(SECTION_STOPS[i].id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= triggerLine) {
      activeIdx = i;
      const span = Math.max(rect.height - vh * 0.35, 1);
      const passed = Math.max(triggerLine - rect.top, 0);
      intra = Math.min(Math.max(passed / span, 0), 0.99);
    }
  }

  if (activeIdx === 0 && window.scrollY > 0) {
    const aboutEl = document.getElementById('about');
    const aboutSpan = Math.max((aboutEl?.offsetHeight || vh) * 0.55, 180);
    intra = Math.min(Math.max(window.scrollY / aboutSpan, intra), 0.98);
  }

  return {
    activeSectionIndex: activeIdx,
    activeSectionId: SECTION_STOPS[activeIdx].id,
    sectionFloat: activeIdx + intra,
    atFooter: false,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateKeyframe(sectionFloat: number): CameraKeyframe {
  const clamped = Math.min(
    Math.max(sectionFloat, 0),
    STOP_KEYFRAMES.length - 1
  );
  const idx = Math.min(Math.floor(clamped), STOP_KEYFRAMES.length - 2);
  const frac = clamped - idx;
  const a = STOP_KEYFRAMES[idx];
  const b = STOP_KEYFRAMES[idx + 1];
  return {
    zoom: lerp(a.zoom, b.zoom, frac),
    camX: lerp(a.camX, b.camX, frac),
    camY: lerp(a.camY, b.camY, frac),
    camZ: lerp(a.camZ, b.camZ, frac),
    pitchX: lerp(a.pitchX, b.pitchX, frac),
    tiltY: lerp(a.tiltY, b.tiltY, frac),
    rollZ: lerp(a.rollZ, b.rollZ, frac),
    surfaceDetail: lerp(a.surfaceDetail, b.surfaceDetail, frac),
  };
}

const BEST_STATIC_TIME_SEC = 2.4;
export function DreamSpaceStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageMode, setStageMode] = useState<
    'active' | 'reduced-motion' | 'static-high-contrast'
  >('active');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isLowPowerPhone =
      typeof window !== 'undefined' &&
      window.innerWidth <= 480 &&
      typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' &&
      navigator.hardwareConcurrency <= 2;

    if (prefersReducedMotion) {
      setStageMode('reduced-motion');
    } else if (isLowPowerPhone) {
      setStageMode('static-high-contrast');
    }

    const ctx2d = canvas.getContext('2d', { alpha: false });
    const glCanvas = document.createElement('canvas');

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setClearColor(0x0a0b0d, 1);
    } catch {
      renderer = null;
    }

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(window.innerWidth, 1);
      const h = Math.max(window.innerHeight, 1);
      canvas.width = Math.max(Math.floor(w * dpr), 1);
      canvas.height = Math.max(Math.floor(h * dpr), 1);
      if (renderer) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
      }
    };

    syncCanvasSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      44,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      120
    );
    camera.position.set(0, 0.35, 11.2);
    camera.lookAt(0, 0.85, 0);

    const starCount = 320;
    const starPositions = new Float32Array(starCount * 3);
    const starSeeds: Array<{
      x: number;
      y: number;
      r: number;
      signal: boolean;
    }> = [];
    let seed = 42109;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < starCount; i++) {
      const sx = (nextRand() - 0.5) * 42;
      const sy = (nextRand() - 0.5) * 24;
      const sz = -4 - nextRand() * 30;
      starPositions[i * 3] = sx;
      starPositions[i * 3 + 1] = sy;
      starPositions[i * 3 + 2] = sz;
      starSeeds.push({
        x: nextRand(),
        y: nextRand() * 0.62,
        r: nextRand() > 0.82 ? 1.8 : 1.1,
        signal: i % 11 === 0,
      });
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xf4f1ea,
      size: 0.065,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const rigGroup = new THREE.Group();
    rigGroup.position.set(0, 1.35, 0);
    scene.add(rigGroup);

    const coreWireGeo = new THREE.IcosahedronGeometry(1.18, 2);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0xf4f1ea,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
    rigGroup.add(coreWireMesh);

    const coreSolidGeo = new THREE.SphereGeometry(1.12, 28, 20);
    const coreSolidMat = new THREE.MeshBasicMaterial({
      color: 0x1a1e25,
      transparent: true,
      opacity: 0.45,
    });
    const coreSolidMesh = new THREE.Mesh(coreSolidGeo, coreSolidMat);
    rigGroup.add(coreSolidMesh);

    const signalRingGeo = new THREE.TorusGeometry(2.25, 0.045, 20, 160);
    const signalRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd21e,
      transparent: true,
      opacity: 0.96,
    });
    const signalRing = new THREE.Mesh(signalRingGeo, signalRingMat);
    rigGroup.add(signalRing);

    const porcelainRingGeo = new THREE.TorusGeometry(2.75, 0.035, 18, 160);
    const porcelainRingMat = new THREE.MeshBasicMaterial({
      color: 0xf4f1ea,
      transparent: true,
      opacity: 0.92,
    });
    const porcelainRing = new THREE.Mesh(porcelainRingGeo, porcelainRingMat);
    rigGroup.add(porcelainRing);

    const outerRingGeo = new THREE.TorusGeometry(3.25, 0.022, 16, 140);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xf4f1ea,
      transparent: true,
      opacity: 0.58,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    rigGroup.add(outerRing);

    const nodeGeo = new THREE.SphereGeometry(0.11, 14, 14);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffd21e });
    const nodeAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    nodeAngles.forEach(angle => {
      const marker = new THREE.Mesh(nodeGeo, nodeMat);
      marker.position.set(Math.cos(angle) * 2.25, Math.sin(angle) * 2.25, 0);
      signalRing.add(marker);
    });

    const mountTime = performance.now();
    let journey = readSectionJourneyState();
    let currentSectionFloat = journey.sectionFloat;
    let rafId = 0;
    let staticLatched = prefersReducedMotion || isLowPowerPhone;
    let slowFrameCount = 0;
    let lastFrameTime = performance.now();
    const drawHighContrastAstrolabe = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      elapsedSec: number,
      kf: CameraKeyframe,
      atFooter: boolean
    ) => {
      camera.updateMatrixWorld();
      const centerNdc = new THREE.Vector3(0, 1.35, 0).project(camera);
      const edgeNdc = new THREE.Vector3(2.35, 1.35, 0).project(camera);
      const cx = (centerNdc.x * 0.5 + 0.5) * w;
      const cy = w < 640 ? h * 0.235 : (-centerNdc.y * 0.5 + 0.5) * h;
      const baseRadius =
        w < 640
          ? Math.min(w * 0.27, h * 0.145) * kf.zoom
          : Math.max(
              Math.abs(edgeNdc.x - centerNdc.x) * 0.5 * w,
              Math.min(w, h) * 0.18
            );

      for (let i = 0; i < starSeeds.length; i++) {
        const s = starSeeds[i];
        const sx = s.x * w;
        const sy = s.y * h;
        ctx.fillStyle = s.signal ? '#FFD21E' : '#F4F1EA';
        ctx.fillRect(sx, sy, s.r, s.r);
      }

      const projectPoint = (
        x: number,
        y: number,
        z: number,
        rx: number,
        ry: number,
        rz: number
      ) => {
        const cz = Math.cos(rz);
        const sz = Math.sin(rz);
        const x1 = x * cz - y * sz;
        const y1 = x * sz + y * cz;
        const z1 = z;
        const cxRot = Math.cos(rx);
        const sxRot = Math.sin(rx);
        const y2 = y1 * cxRot - z1 * sxRot;
        const z2 = y1 * sxRot + z1 * cxRot;
        const x2 = x1;
        const cyRot = Math.cos(ry);
        const syRot = Math.sin(ry);
        const x3 = x2 * cyRot + z2 * syRot;
        const z3 = -x2 * syRot + z2 * cyRot;
        const y3 = y2;

        const fov = 560;
        const scale = fov / Math.max(fov - z3 * 85, 120);
        return {
          px: cx + x3 * baseRadius * scale,
          py: cy + y3 * baseRadius * scale,
          z: z3,
          scale,
        };
      };

      const spinTime = atFooter ? BEST_STATIC_TIME_SEC : elapsedSec;
      const ring1Phase = spinTime * 0.58 + kf.rollZ;
      const ring2Phase = -spinTime * 0.44 - kf.rollZ * 0.8;
      const coreSpin = spinTime * 0.36 + kf.tiltY;

      const coreR = baseRadius * 0.48;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = kf.surfaceDetail > 0.55 ? '#1A1E25' : '#12151A';
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#F4F1EA';
      ctx.stroke();

      if (kf.surfaceDetail > 0.35) {
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 0.76, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD21E';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();

      const meridianCount = 6;
      for (let m = 0; m < meridianCount; m++) {
        const mAngle = coreSpin + (m * Math.PI) / meridianCount;
        ctx.beginPath();
        for (let step = 0; step <= 48; step++) {
          const theta = (step / 48) * Math.PI * 2;
          const lx = Math.sin(theta) * Math.cos(mAngle) * 0.48;
          const ly = Math.cos(theta) * 0.48;
          const lz = Math.sin(theta) * Math.sin(mAngle) * 0.48;
          const pt = projectPoint(
            lx,
            ly,
            lz,
            kf.pitchX * 0.5,
            kf.tiltY * 0.5,
            0
          );
          if (step === 0) ctx.moveTo(pt.px, pt.py);
          else ctx.lineTo(pt.px, pt.py);
        }
        ctx.strokeStyle = m % 2 === 0 ? '#FFD21E' : '#F4F1EA';
        ctx.lineWidth = m % 2 === 0 ? 1.8 : 1.3;
        ctx.stroke();
      }

      const outerR = 1.38;
      ctx.beginPath();
      for (let step = 0; step <= 96; step++) {
        const a = (step / 96) * Math.PI * 2;
        const pt = projectPoint(
          Math.cos(a) * outerR,
          Math.sin(a) * outerR * 0.58,
          Math.sin(a) * 0.25,
          kf.pitchX * 0.35,
          kf.tiltY * 0.3,
          0.08
        );
        if (step === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = '#3A3F45';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const sweepStart = spinTime * 0.65;
      ctx.beginPath();
      for (let step = 0; step <= 28; step++) {
        const a = sweepStart + (step / 28) * (Math.PI * 0.48);
        const pt = projectPoint(
          Math.cos(a) * outerR,
          Math.sin(a) * outerR * 0.58,
          Math.sin(a) * 0.25,
          kf.pitchX * 0.35,
          kf.tiltY * 0.3,
          0.08
        );
        if (step === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = '#FFD21E';
      ctx.lineWidth = 4.0;
      ctx.stroke();

      const porcR = 1.18;
      const porcRx = -0.52 - kf.pitchX * 0.35;
      const porcRy = 0.34 + kf.tiltY * 0.45;
      const porcRz = -0.28 + ring2Phase * 0.25;
      ctx.beginPath();
      for (let step = 0; step <= 100; step++) {
        const a = (step / 100) * Math.PI * 2;
        const pt = projectPoint(
          Math.cos(a) * porcR,
          Math.sin(a) * porcR,
          0,
          porcRx,
          porcRy,
          porcRz
        );
        if (step === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = '#F4F1EA';
      ctx.lineWidth = 3.0;
      ctx.stroke();

      for (let n = 0; n < 3; n++) {
        const na = ring2Phase + (n * Math.PI * 2) / 3;
        const npt = projectPoint(
          Math.cos(na) * porcR,
          Math.sin(na) * porcR,
          0,
          porcRx,
          porcRy,
          porcRz
        );
        ctx.beginPath();
        ctx.arc(npt.px, npt.py, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#F4F1EA';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(npt.px, npt.py, 11, 0, Math.PI * 2);
        ctx.strokeStyle = '#F4F1EA';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const sigR = 0.96;
      const sigRx = 0.62 + kf.pitchX * 0.4;
      const sigRy = -0.28 + kf.tiltY * 0.5;
      const sigRz = 0.22 + ring1Phase * 0.2;
      ctx.beginPath();
      for (let step = 0; step <= 100; step++) {
        const a = (step / 100) * Math.PI * 2;
        const pt = projectPoint(
          Math.cos(a) * sigR,
          Math.sin(a) * sigR,
          0,
          sigRx,
          sigRy,
          sigRz
        );
        if (step === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = '#FFD21E';
      ctx.lineWidth = 4.2;
      ctx.stroke();

      for (let b = 0; b < 4; b++) {
        const ba = ring1Phase + (b * Math.PI) / 2;
        const bpt = projectPoint(
          Math.cos(ba) * sigR,
          Math.sin(ba) * sigR,
          0,
          sigRx,
          sigRy,
          sigRz
        );
        ctx.beginPath();
        ctx.arc(bpt.px, bpt.py, b === 0 ? 7.5 : 5.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD21E';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bpt.px, bpt.py, b === 0 ? 16 : 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD21E';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      const wingSpan = baseRadius * 1.65;
      ctx.strokeStyle = '#3A3F45';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - wingSpan, cy);
      ctx.lineTo(cx - coreR * 1.15, cy);
      ctx.moveTo(cx + coreR * 1.15, cy);
      ctx.lineTo(cx + wingSpan, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD21E';
      ctx.fill();
    };
    const renderFrame = (nowMs: number) => {
      if (staticLatched) {
        currentSectionFloat = journey.sectionFloat;
      } else {
        currentSectionFloat +=
          (journey.sectionFloat - currentSectionFloat) * 0.14;
      }

      const elapsedSec = staticLatched
        ? BEST_STATIC_TIME_SEC
        : Math.max((nowMs - mountTime) / 1000, 0);

      const kf = interpolateKeyframe(currentSectionFloat);

      if (renderer) {
        camera.position.set(kf.camX, kf.camY, kf.camZ);
        camera.lookAt(0, 0.85, 0);

        const spin = journey.atFooter ? BEST_STATIC_TIME_SEC : elapsedSec;
        signalRing.rotation.x = 0.62 + kf.pitchX * 0.35;
        signalRing.rotation.y = -0.28 + spin * 0.58;
        signalRing.rotation.z = kf.rollZ;

        porcelainRing.rotation.x = -0.52 - kf.pitchX * 0.3;
        porcelainRing.rotation.y = 0.34 - spin * 0.44;
        porcelainRing.rotation.z = -kf.rollZ * 0.8;

        outerRing.rotation.x = Math.PI * 0.42 + kf.pitchX * 0.2;
        outerRing.rotation.z = spin * 0.25;

        coreWireMesh.rotation.y = spin * 0.36;
        coreWireMesh.rotation.x = kf.pitchX * 0.4;
        coreSolidMat.opacity = 0.35 + kf.surfaceDetail * 0.55;

        renderer.render(scene, camera);
      }

      if (ctx2d) {
        ctx2d.fillStyle = '#0A0B0D';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        if (renderer) {
          ctx2d.drawImage(glCanvas, 0, 0, canvas.width, canvas.height);
        }
        drawHighContrastAstrolabe(
          ctx2d,
          canvas.width,
          canvas.height,
          elapsedSec,
          kf,
          journey.atFooter
        );
      }
    };

    if (staticLatched) {
      renderFrame(performance.now());
    } else {
      const tick = (nowMs: number) => {
        const dt = nowMs - lastFrameTime;
        lastFrameTime = nowMs;

        if (window.innerWidth <= 480 && dt > 42 && dt < 500) {
          slowFrameCount++;
          if (slowFrameCount >= 18) {
            staticLatched = true;
            setStageMode('static-high-contrast');
            renderFrame(nowMs);
            return;
          }
        } else {
          slowFrameCount = Math.max(0, slowFrameCount - 1);
        }

        if (!document.hidden) {
          renderFrame(nowMs);
        }
        rafId = window.requestAnimationFrame(tick);
      };
      renderFrame(performance.now());
      rafId = window.requestAnimationFrame(tick);
    }

    const onScroll = () => {
      journey = readSectionJourneyState();
      if (staticLatched) {
        renderFrame(performance.now());
      }
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
      syncCanvasSize();
      journey = readSectionJourneyState();
      renderFrame(performance.now());
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
      starGeometry.dispose();
      starMaterial.dispose();
      coreWireGeo.dispose();
      coreWireMat.dispose();
      coreSolidGeo.dispose();
      coreSolidMat.dispose();
      porcelainRingGeo.dispose();
      porcelainRingMat.dispose();
      signalRingGeo.dispose();
      signalRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
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
      data-stage-mode={stageMode}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen bg-[#0A0B0D]"
    />
  );
}

export function HeaderOrbitMark({
  sectionFloat,
  atFooter,
}: {
  sectionFloat: number;
  atFooter: boolean;
}) {
  const markCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const floatRef = useRef(sectionFloat);
  const footerRef = useRef(atFooter);
  floatRef.current = sectionFloat;
  footerRef.current = atFooter;

  useEffect(() => {
    const canvas = markCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const euler = new THREE.Euler(0.55, -0.35, 0, 'XYZ');
    const vec = new THREE.Vector3();
    const mountMs = performance.now();
    let raf = 0;

    const drawMark = (nowMs: number) => {
      const t =
        prefersReducedMotion || footerRef.current
          ? BEST_STATIC_TIME_SEC
          : (nowMs - mountMs) / 1000;
      const scrollAngle = floatRef.current * 0.55;

      ctx.clearRect(0, 0, 32, 32);
      const cx = 16;
      const cy = 16;

      euler.set(0.65, t * 0.75 + scrollAngle, 0.25);
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        vec.set(Math.cos(a) * 12, Math.sin(a) * 12, 0).applyEuler(euler);
        if (i === 0) ctx.moveTo(cx + vec.x, cy + vec.y);
        else ctx.lineTo(cx + vec.x, cy + vec.y);
      }
      ctx.strokeStyle = '#F4F1EA';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      euler.set(-0.58, -t * 0.95 - scrollAngle, -0.2);
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        vec.set(Math.cos(a) * 9, Math.sin(a) * 9, 0).applyEuler(euler);
        if (i === 0) ctx.moveTo(cx + vec.x, cy + vec.y);
        else ctx.lineTo(cx + vec.x, cy + vec.y);
      }
      ctx.strokeStyle = '#FFD21E';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      vec
        .set(
          Math.cos(t * 1.1 + scrollAngle) * 9,
          Math.sin(t * 1.1 + scrollAngle) * 9,
          0
        )
        .applyEuler(euler);
      ctx.beginPath();
      ctx.arc(cx + vec.x, cy + vec.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD21E';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#F4F1EA';
      ctx.fill();
    };

    drawMark(performance.now());
    if (!prefersReducedMotion) {
      const loop = (nowMs: number) => {
        if (!document.hidden) {
          drawMark(nowMs);
        }
        raf = window.requestAnimationFrame(loop);
      };
      raf = window.requestAnimationFrame(loop);
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      id="youandinotai-header-mark"
      ref={markCanvasRef}
      width={32}
      height={32}
      aria-hidden="true"
      className="h-8 w-8 shrink-0"
    />
  );
}

export function HeaderTelemetryLine({
  activeSectionIndex,
  atFooter,
}: {
  activeSectionIndex: number;
  atFooter: boolean;
}) {
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const idxRef = useRef(activeSectionIndex);
  const footerRef = useRef(atFooter);
  idxRef.current = activeSectionIndex;
  footerRef.current = atFooter;

  useEffect(() => {
    const canvas = lineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const syncWidth = () => {
      canvas.width = Math.max(window.innerWidth, 320);
      canvas.height = 4;
    };
    syncWidth();

    const mountMs = performance.now();
    let raf = 0;

    const drawLine = (nowMs: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#3A3F45';
      ctx.fillRect(0, 0, w, h);

      const totalStops = SECTION_STOPS.length;
      const fillRatio = footerRef.current
        ? 1
        : Math.min(
            Math.max((idxRef.current + 1) / totalStops, 1 / totalStops),
            1
          );
      const fillWidth = Math.round(w * fillRatio);

      ctx.fillStyle = '#FFD21E';
      ctx.fillRect(0, 0, fillWidth, h);

      const t =
        prefersReducedMotion || footerRef.current
          ? BEST_STATIC_TIME_SEC
          : (nowMs - mountMs) / 1000;
      const carrierNorm = (((t * 0.11) % 1) + 1) % 1;
      const carrierX = Math.round(carrierNorm * w);
      ctx.fillStyle = '#F4F1EA';
      ctx.fillRect(Math.max(0, carrierX - 18), 0, 36, h);
      ctx.fillStyle = '#FFD21E';
      ctx.fillRect(Math.max(0, carrierX - 6), 0, 12, h);
    };

    drawLine(performance.now());
    if (!prefersReducedMotion) {
      const loop = (nowMs: number) => {
        if (!document.hidden) {
          drawLine(nowMs);
        }
        raf = window.requestAnimationFrame(loop);
      };
      raf = window.requestAnimationFrame(loop);
    }

    window.addEventListener('resize', syncWidth);
    return () => {
      window.removeEventListener('resize', syncWidth);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      id="youandinotai-header-line"
      ref={lineCanvasRef}
      height={4}
      aria-hidden="true"
      className="pointer-events-none block h-[3px] w-full"
    />
  );
}

export function JourneyProgressBar({
  activeSectionIndex,
  onSelectSection,
}: {
  activeSectionIndex: number;
  onSelectSection: (id: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const focusedOrHovered = hoveredIdx ?? activeSectionIndex;
  const activeStop = SECTION_STOPS[focusedOrHovered] || SECTION_STOPS[0];

  return (
    <nav
      id="youandinotai-progress-map"
      aria-label="Section journey progress map"
      data-active-stop={SECTION_STOPS[activeSectionIndex]?.id ?? 'about'}
      data-filled-count={activeSectionIndex + 1}
      data-total-stops={SECTION_STOPS.length}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#3A3F45] bg-[#0A0B0D]"
    >
      <div className="mx-auto flex min-h-[56px] max-w-[1440px] items-center justify-between gap-1.5 px-1.5 py-1.5 sm:gap-4 sm:px-6">
        <div role="list" className="grid flex-1 grid-cols-8 gap-0.5 sm:gap-2">
          {SECTION_STOPS.map((stop, idx) => {
            const isFilled = idx <= activeSectionIndex;
            const isCurrent = idx === activeSectionIndex;
            const showInlineLabel = idx < 3 || isCurrent;
            return (
              <div key={stop.id} role="listitem" className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setHoveredIdx(idx);
                    onSelectSection(stop.id);
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  title={`${stop.index} · ${stop.label}`}
                  aria-label={`${stop.index} ${stop.label}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  data-stop-id={stop.id}
                  data-filled={isFilled ? 'true' : 'false'}
                  className={`group flex h-11 min-h-[44px] min-w-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border px-1 font-mono text-[14px] font-bold uppercase tracking-[0.04em] transition-colors sm:px-2.5 ${
                    isFilled
                      ? 'border-[#FFD21E] bg-[#FFD21E] text-[#0A0B0D]'
                      : 'border-[#3A3F45] bg-[#12151A] text-[#F4F1EA] hover:border-[#FFD21E]'
                  }`}
                >
                  <span>{stop.index}</span>
                  <span
                    className={
                      showInlineLabel
                        ? 'hidden truncate md:inline'
                        : 'hidden truncate xl:inline'
                    }
                  >
                    {stop.shortLabel}
                  </span>
                </button>

                {hoveredIdx === idx && (
                  <div
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-[4px] border border-[#FFD21E] bg-[#0A0B0D] px-2.5 py-1 font-mono text-[14px] font-bold uppercase tracking-[0.06em] text-[#FFD21E] ${
                      idx === 0
                        ? 'left-0'
                        : idx === SECTION_STOPS.length - 1
                          ? 'right-0'
                          : 'left-1/2 -translate-x-1/2'
                    }`}
                  >
                    {stop.index} · {stop.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-[4px] border border-[#3A3F45] bg-[#12151A] px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA] sm:flex">
          <span className="text-[#FFD21E]">
            {activeSectionIndex + 1}/{SECTION_STOPS.length}
          </span>
          <span>·</span>
          <span>{activeStop.label}</span>
        </div>
      </div>
    </nav>
  );
}

export default DreamSpaceStage;
