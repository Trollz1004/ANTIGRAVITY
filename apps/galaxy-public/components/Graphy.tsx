import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCw,
  Tv,
  ExternalLink,
  Orbit,
  Volume2,
  VolumeX,
  Palette,
  Gauge,
  Compass,
  Activity,
  Sliders,
  Keyboard,
  Sun,
  X,
  HelpCircle,
  Maximize2,
  Music
} from 'lucide-react';
import SpaceAudioDock from './SpaceAudioDock';
import { spaceAudio } from './spaceAudioEngine';

export interface SpaceNode {
  id: string;
  label: string;
  type: 'core' | 'community' | 'intelligence' | 'trust' | 'discovery' | 'mesh';
  color: string;
  glow: string;
  size: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  orbitR: number;
  speed: number;
  angle: number;
  tilt: number;
  pulsePhase: number;
  category: string;
  details: {
    description: string;
    role: string;
    metrics: string;
    status: string;
  };
}

export interface SpaceLink {
  source: string;
  target: string;
  strength: number;
  color?: string;
  animated?: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  badgeColor: string;
  bgGradStart: string;
  bgGradMid: string;
  nebulaColors: [string, string, string];
  nodeColors: Record<string, { color: string; glow: string }>;
  linkDefaultColor: string;
}

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'cosmic-cyan',
    name: 'Cosmic Cyan',
    badgeColor: '#00e5ff',
    bgGradStart: '#0a1026',
    bgGradMid: '#050814',
    nebulaColors: [
      'rgba(0, 229, 255, 0.09)',
      'rgba(236, 72, 153, 0.08)',
      'rgba(245, 158, 11, 0.07)'
    ],
    nodeColors: {
      'nexus-core': { color: '#00f2fe', glow: '#38bdf8' },
      'authentic-community': { color: '#ec4899', glow: '#f472b6' },
      'real-world-meetups': { color: '#f59e0b', glow: '#fbbf24' },
      'kinetic-intelligence': { color: '#00e5ff', glow: '#60a5fa' },
      'verified-trust': { color: '#10b981', glow: '#34d399' },
      'organic-social-graph': { color: '#a855f7', glow: '#c084fc' },
      'spatial-synapse': { color: '#06b6d4', glow: '#22d3ee' },
      'live-discovery': { color: '#f43f5e', glow: '#fb7185' },
      'adaptive-presence': { color: '#14b8a6', glow: '#2dd4bf' },
      'human-first': { color: '#eab308', glow: '#fde047' }
    },
    linkDefaultColor: '#38bdf8'
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    badgeColor: '#f97316',
    bgGradStart: '#1a0800',
    bgGradMid: '#0d0400',
    nebulaColors: [
      'rgba(249, 115, 22, 0.11)',
      'rgba(239, 68, 68, 0.09)',
      'rgba(234, 179, 8, 0.08)'
    ],
    nodeColors: {
      'nexus-core': { color: '#fbbf24', glow: '#fef08a' },
      'authentic-community': { color: '#f97316', glow: '#fdba74' },
      'real-world-meetups': { color: '#ef4444', glow: '#fca5a5' },
      'kinetic-intelligence': { color: '#eab308', glow: '#fef08a' },
      'verified-trust': { color: '#84cc16', glow: '#bef264' },
      'organic-social-graph': { color: '#f59e0b', glow: '#fde68a' },
      'spatial-synapse': { color: '#ea580c', glow: '#fb923c' },
      'live-discovery': { color: '#dc2626', glow: '#f87171' },
      'adaptive-presence': { color: '#fb923c', glow: '#fed7aa' },
      'human-first': { color: '#facc15', glow: '#fef08a' }
    },
    linkDefaultColor: '#fb923c'
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    badgeColor: '#d946ef',
    bgGradStart: '#160424',
    bgGradMid: '#0b0214',
    nebulaColors: [
      'rgba(217, 70, 239, 0.12)',
      'rgba(6, 182, 212, 0.09)',
      'rgba(244, 63, 94, 0.09)'
    ],
    nodeColors: {
      'nexus-core': { color: '#c084fc', glow: '#e879f9' },
      'authentic-community': { color: '#f43f5e', glow: '#fda4af' },
      'real-world-meetups': { color: '#d946ef', glow: '#f0abfc' },
      'kinetic-intelligence': { color: '#818cf8', glow: '#c7d2fe' },
      'verified-trust': { color: '#22d3ee', glow: '#67e8f9' },
      'organic-social-graph': { color: '#a855f7', glow: '#d8b4fe' },
      'spatial-synapse': { color: '#e879f9', glow: '#f5d0fe' },
      'live-discovery': { color: '#ec4899', glow: '#fbcfe8' },
      'adaptive-presence': { color: '#38bdf8', glow: '#bae6fd' },
      'human-first': { color: '#c084fc', glow: '#f3e8ff' }
    },
    linkDefaultColor: '#c084fc'
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    badgeColor: '#10b981',
    bgGradStart: '#021812',
    bgGradMid: '#010d0a',
    nebulaColors: [
      'rgba(16, 185, 129, 0.11)',
      'rgba(6, 182, 212, 0.09)',
      'rgba(132, 204, 22, 0.08)'
    ],
    nodeColors: {
      'nexus-core': { color: '#34d399', glow: '#6ee7b7' },
      'authentic-community': { color: '#10b981', glow: '#a7f3d0' },
      'real-world-meetups': { color: '#14b8a6', glow: '#5eead4' },
      'kinetic-intelligence': { color: '#06b6d4', glow: '#67e8f9' },
      'verified-trust': { color: '#84cc16', glow: '#d9f99d' },
      'organic-social-graph': { color: '#059669', glow: '#34d399' },
      'spatial-synapse': { color: '#2dd4bf', glow: '#99f6e4' },
      'live-discovery': { color: '#22c55e', glow: '#86efac' },
      'adaptive-presence': { color: '#0d9488', glow: '#2dd4bf' },
      'human-first': { color: '#a3e635', glow: '#bef264' }
    },
    linkDefaultColor: '#34d399'
  }
];

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3];

const PUBLIC_NODES_DATA: Omit<SpaceNode, 'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz' | 'angle' | 'pulsePhase'>[] = [
  {
    id: 'nexus-core',
    label: 'YouAndINotAI Nexus',
    type: 'core',
    color: '#00f2fe',
    glow: '#38bdf8',
    size: 32,
    orbitR: 0,
    speed: 0,
    tilt: 0,
    category: 'Singularity Core',
    details: {
      description: 'The central kinetic nexus powering genuine real-world interactions and authentic social discovery for youandinotai.com.',
      role: 'Human Connection Singularity',
      metrics: 'Zero-Latency Sync · Infinite Scalability',
      status: 'OPERATIONAL'
    }
  },
  {
    id: 'authentic-community',
    label: 'Authentic Community',
    type: 'community',
    color: '#ec4899',
    glow: '#f472b6',
    size: 24,
    orbitR: 110,
    speed: 0.009,
    tilt: 0.22,
    category: 'Social Engine',
    details: {
      description: 'Facilitates verified, organic connections between real people through shared interests and mutual values.',
      role: 'Organic Relationship Mesh',
      metrics: '100% Real Identity · Bot-Free Ecosystem',
      status: 'ACTIVE'
    }
  },
  {
    id: 'real-world-meetups',
    label: 'Real-World Meetups',
    type: 'community',
    color: '#f59e0b',
    glow: '#fbbf24',
    size: 24,
    orbitR: 155,
    speed: 0.0072,
    tilt: -0.28,
    category: 'Social Engine',
    details: {
      description: 'Coordinates local gatherings, volunteer opportunities, and face-to-face community events.',
      role: 'Local Event Coordinator',
      metrics: 'Spatial Proximity · Safe Zones',
      status: 'ACTIVE'
    }
  },
  {
    id: 'kinetic-intelligence',
    label: 'Kinetic Intelligence',
    type: 'intelligence',
    color: '#00e5ff',
    glow: '#60a5fa',
    size: 25,
    orbitR: 195,
    speed: 0.0058,
    tilt: 0.38,
    category: 'Visual & Neural',
    details: {
      description: 'Multi-spectral visual intelligence engine providing real-time spatial graph rendering and ambient visualization.',
      role: 'Visual Synthesis & Kinetic Geometry',
      metrics: '60 FPS 3D Stream · Multi-Chromatics',
      status: 'SYNCHRONIZED'
    }
  },
  {
    id: 'verified-trust',
    label: 'Verified Trust Protocol',
    type: 'trust',
    color: '#10b981',
    glow: '#34d399',
    size: 22,
    orbitR: 235,
    speed: 0.0046,
    tilt: -0.2,
    category: 'Security & Safety',
    details: {
      description: 'End-to-end cryptographic verification ensuring account authenticity and privacy protection.',
      role: 'Privacy & Reputation Verification',
      metrics: 'Deterministic Security · PII Shielded',
      status: 'VERIFIED'
    }
  },
  {
    id: 'organic-social-graph',
    label: 'Organic Social Graph',
    type: 'mesh',
    color: '#a855f7',
    glow: '#c084fc',
    size: 23,
    orbitR: 275,
    speed: 0.0038,
    tilt: 0.45,
    category: 'Graph Topology',
    details: {
      description: 'Dynamic graph clustering mapping natural human networks without invasive data monetization.',
      role: 'Topological Relationship Visualizer',
      metrics: 'Graph Density 99.8% · Zero Ad-Tracking',
      status: 'OPTIMIZED'
    }
  },
  {
    id: 'spatial-synapse',
    label: 'Spatial Audio Synapse',
    type: 'intelligence',
    color: '#06b6d4',
    glow: '#22d3ee',
    size: 20,
    orbitR: 315,
    speed: 0.0031,
    tilt: -0.32,
    category: 'Visual & Neural',
    details: {
      description: 'Audio-reactive kinetic waveform generator synthesizing live acoustic resonance and orbital pulse rhythms.',
      role: 'Resonance Visualizer',
      metrics: 'Harmonic Modulation · 44.1kHz Loop',
      status: 'RESONATING'
    }
  },
  {
    id: 'live-discovery',
    label: 'Live Discovery Stream',
    type: 'discovery',
    color: '#f43f5e',
    glow: '#fb7185',
    size: 21,
    orbitR: 355,
    speed: 0.0026,
    tilt: 0.18,
    category: 'Social Engine',
    details: {
      description: 'Instant discovery feed highlighting trending community initiatives and live neighborhood activities.',
      role: 'Real-Time Activity Stream',
      metrics: 'Instant Broadcast · Sub-second Latency',
      status: 'STREAMING'
    }
  },
  {
    id: 'adaptive-presence',
    label: 'Adaptive Presence Mesh',
    type: 'mesh',
    color: '#14b8a6',
    glow: '#2dd4bf',
    size: 19,
    orbitR: 395,
    speed: 0.0021,
    tilt: -0.24,
    category: 'Graph Topology',
    details: {
      description: 'Low-energy spatial beacon network enabling context-aware proximity alerts when friends are nearby.',
      role: 'Proximity Awareness Network',
      metrics: 'Precision Mesh · Battery Optimized',
      status: 'ACTIVE'
    }
  },
  {
    id: 'human-first',
    label: 'Human First Protocol',
    type: 'trust',
    color: '#eab308',
    glow: '#fde047',
    size: 21,
    orbitR: 435,
    speed: 0.0016,
    tilt: 0.3,
    category: 'Security & Safety',
    details: {
      description: 'Core architectural principle prioritizing real human wellbeing and meaningful interactions over algorithmic engagement loops.',
      role: 'Ethical Platform Foundation',
      metrics: 'Wellbeing Centric · Zero Dark Patterns',
      status: 'PROTECTED'
    }
  }
];

const PUBLIC_LINKS: SpaceLink[] = [
  { source: 'nexus-core', target: 'authentic-community', strength: 1, color: '#00f2fe', animated: true },
  { source: 'nexus-core', target: 'real-world-meetups', strength: 1, color: '#00f2fe', animated: true },
  { source: 'nexus-core', target: 'kinetic-intelligence', strength: 1, color: '#00f2fe', animated: true },
  { source: 'nexus-core', target: 'verified-trust', strength: 1, color: '#00f2fe', animated: true },
  { source: 'nexus-core', target: 'organic-social-graph', strength: 0.9, color: '#a855f7', animated: true },
  { source: 'nexus-core', target: 'spatial-synapse', strength: 0.85, color: '#06b6d4', animated: true },
  { source: 'nexus-core', target: 'live-discovery', strength: 0.8, color: '#f43f5e', animated: true },
  { source: 'nexus-core', target: 'human-first', strength: 0.9, color: '#eab308', animated: true },
  { source: 'authentic-community', target: 'real-world-meetups', strength: 0.85, color: '#ec4899', animated: false },
  { source: 'authentic-community', target: 'verified-trust', strength: 0.8, color: '#10b981', animated: false },
  { source: 'kinetic-intelligence', target: 'spatial-synapse', strength: 0.9, color: '#00e5ff', animated: true },
  { source: 'organic-social-graph', target: 'adaptive-presence', strength: 0.75, color: '#14b8a6', animated: false },
  { source: 'live-discovery', target: 'real-world-meetups', strength: 0.8, color: '#f59e0b', animated: false },
  { source: 'human-first', target: 'verified-trust', strength: 0.85, color: '#10b981', animated: false }
];

export interface GraphyProps {
  isStandalone?: boolean;
}

export default function Graphy({ isStandalone = true }: GraphyProps) {
  // Palette & Customization State
  const [paletteIndex, setPaletteIndex] = useState(0);
  const currentPalette = COLOR_PALETTES[paletteIndex];

  // Nodes state with dynamic coordinates
  const [nodes] = useState<SpaceNode[]>(() => {
    return PUBLIC_NODES_DATA.map((n, i) => {
      const angle = (i * Math.PI * 2) / PUBLIC_NODES_DATA.length;
      return {
        ...n,
        x: Math.cos(angle) * n.orbitR,
        y: Math.sin(angle * 2) * 20,
        z: Math.sin(angle) * n.orbitR,
        vx: 0,
        vy: 0,
        vz: 0,
        angle,
        pulsePhase: Math.random() * Math.PI * 2
      };
    });
  });

  // Selected & Hovered Node State
  const [selectedNode, setSelectedNode] = useState<SpaceNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SpaceNode | null>(null);

  // Visual & Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showOrbitTrails, setShowOrbitTrails] = useState(true);
  const [enableBloomShader, setEnableBloomShader] = useState(true);
  // Bloom intensity level (0.0 to 1.0, defaults to calibrated subtle 0.45)
  const [bloomIntensity, setBloomIntensity] = useState<number>(0.45);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isScreensaver, setIsScreensaver] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [rotX, setRotX] = useState(0.45);
  const [rotY, setRotY] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [pulseWave, setPulseWave] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Canvas & Animation References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotYRef = useRef(0);
  const rotXRef = useRef(0.45);
  const zoomRef = useRef(1);
  const autoRotateRef = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);

  // Sync ref values for high-rate requestAnimationFrame
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    rotXRef.current = rotX;
  }, [rotX]);

  useEffect(() => {
    zoomRef.current = cameraZoom;
  }, [cameraZoom]);

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(PUBLIC_NODES_DATA.map((n) => n.category)));
    return ['All', ...cats];
  }, []);

  // Ambient Web Audio Soundscape Synthesizer
  const toggleAudioSynth = () => {
    if (audioEnabled) {
      spaceAudio.stop();
      setAudioEnabled(false);
    } else {
      spaceAudio.start();
      setAudioEnabled(true);
    }
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (isScreensaver) {
          setIsScreensaver(false);
        } else if (selectedNode) {
          setSelectedNode(null);
        }
      } else if (e.key === 's' || e.key === 'S') {
        setIsScreensaver((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        setAutoRotate((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setPaletteIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
      } else if (e.key === 't' || e.key === 'T') {
        setShowOrbitTrails((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setEnableBloomShader((prev) => !prev);
      } else if (e.key === '[' ) {
        setBloomIntensity((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))));
      } else if (e.key === ']') {
        setBloomIntensity((prev) => Math.min(1.0, Number((prev + 0.1).toFixed(2))));
      } else if (e.key === '?' || e.key === 'k' || e.key === 'K') {
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleAudioSynth();
      } else if (e.key === '+' || e.key === '=') {
        setSpeedMultiplier((current) => {
          const idx = SPEED_OPTIONS.indexOf(current);
          if (idx === -1 || idx === SPEED_OPTIONS.length - 1) return SPEED_OPTIONS[0];
          return SPEED_OPTIONS[idx + 1];
        });
      } else if (e.key === '-' || e.key === '_') {
        setSpeedMultiplier((current) => {
          const idx = SPEED_OPTIONS.indexOf(current);
          if (idx <= 0) return SPEED_OPTIONS[SPEED_OPTIONS.length - 1];
          return SPEED_OPTIONS[idx - 1];
        });
      } else if (e.key === '0') {
        setCameraZoom(1);
        setRotX(0.45);
        rotYRef.current = 0;
        setRotY(0);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        setPulseWave(true);
        setTimeout(() => setPulseWave(false), 2400);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, isScreensaver, selectedNode, audioEnabled]);

  // Starfield Generator
  const stars = useMemo(() => {
    const s = [];
    for (let i = 0; i < 320; i++) {
      s.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 2200,
        z: (Math.random() - 0.5) * 2200,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.75 + 0.25,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        hue: Math.random() > 0.6 ? 190 : Math.random() > 0.4 ? 280 : 45
      });
    }
    return s;
  }, []);

  // Main Canvas 3D Rendering Engine with Multi-Pass Bloom Shader & Calibrated Intensity Level
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationTime = 0;
    let pulseWaveRadius = 0;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
      const centerX = width / 2;
      const centerY = height / 2;

      if (isPlaying) {
        animationTime += 0.012 * speedMultiplier;
        if (!isDraggingRef.current && autoRotateRef.current) {
          rotYRef.current += 0.0035 * speedMultiplier;
          setRotY(rotYRef.current);
        }
      }

      const currentRotY = rotYRef.current;
      const currentRotX = rotXRef.current;
      const zoom = zoomRef.current;
      const time = animationTime;

      // 1. Render Deep Space Background with Palette Gradient
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        100 * zoom,
        centerX,
        centerY,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, currentPalette.bgGradStart);
      bgGrad.addColorStop(0.35, currentPalette.bgGradMid);
      bgGrad.addColorStop(0.75, '#02040a');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Cosmic Ambient Nebula Dust Waves
      ctx.save();
      const nebulaCount = 3;
      for (let n = 0; n < nebulaCount; n++) {
        const nAngle = time * 0.15 + (n * Math.PI * 2) / nebulaCount;
        const nx = centerX + Math.cos(nAngle) * 160 * zoom;
        const ny = centerY + Math.sin(nAngle * 1.4) * 90 * zoom;
        const nGrad = ctx.createRadialGradient(nx, ny, 20, nx, ny, 320 * zoom);

        nGrad.addColorStop(0, currentPalette.nebulaColors[n % currentPalette.nebulaColors.length]);
        nGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.02)');
        nGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, 320 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Render 3D Perspective Starfield
      stars.forEach((star) => {
        const cosY = Math.cos(currentRotY * 0.4);
        const sinY = Math.sin(currentRotY * 0.4);
        const cosX = Math.cos(currentRotX * 0.4);
        const sinX = Math.sin(currentRotX * 0.4);

        let rx = star.x * cosY - star.z * sinY;
        let rz = star.x * sinY + star.z * cosY;
        let ry = star.y * cosX - rz * sinX;
        rz = star.y * sinX + rz * cosX;

        const fov = 700;
        const dist = rz + 1000;
        if (dist > 50) {
          const p = (fov / dist) * zoom;
          const sx = centerX + rx * p;
          const sy = centerY + ry * p;

          if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
            const twinkle = Math.sin(time * 6 + star.x) * 0.35 + 0.65;
            ctx.fillStyle = `hsla(${star.hue}, 85%, 85%, ${star.alpha * twinkle})`;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.6, star.size * p), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 4. Update Node Positions with 3D Celestial Orbital Mechanics
      const projectedNodes = nodes.map((node) => {
        let currentAngle = node.angle;
        if (isPlaying && node.orbitR > 0) {
          currentAngle += node.speed * speedMultiplier;
          node.angle = currentAngle;
        }

        // Apply dynamic palette colors
        const paletteNodeColor = currentPalette.nodeColors[node.id] || {
          color: node.color,
          glow: node.glow
        };

        // Orbit coordinates
        const ox = Math.cos(currentAngle) * node.orbitR;
        const oz = Math.sin(currentAngle) * node.orbitR;
        const oy = Math.sin(currentAngle * 1.5 + node.tilt * 5) * (node.orbitR * 0.15);

        // 3D Matrix Rotation (Y axis then X axis)
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        let rx = ox * cosY - oz * sinY;
        let rz = ox * sinY + oz * cosY;
        let ry = oy * cosX - rz * sinX;
        rz = oy * sinX + rz * cosX;

        const fov = 750;
        const distance = rz + 850;
        const perspective = (fov / Math.max(distance, 100)) * zoom;

        const screenX = centerX + rx * perspective;
        const screenY = centerY + ry * perspective;

        return {
          ...node,
          color: paletteNodeColor.color,
          glow: paletteNodeColor.glow,
          screenX,
          screenY,
          depth: rz,
          scale: perspective,
          currentAngle
        };
      });

      // Sort nodes by depth (painter's algorithm)
      projectedNodes.sort((a, b) => b.depth - a.depth);

      // 5. Draw Dynamic Orbital Rings & Orbit Trails
      if (showOrbitTrails) {
        projectedNodes.forEach((node) => {
          if (node.orbitR > 0) {
            // A. Base Orbital Ring
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              node.orbitR * zoom,
              node.orbitR * Math.abs(Math.sin(currentRotX)) * zoom * 0.95,
              currentRotY * 0.1,
              0,
              Math.PI * 2
            );
            ctx.strokeStyle = `${node.color}25`;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 6]);
            ctx.stroke();
            ctx.restore();

            // B. Kinetic Luminous Orbit Trail Arc Behind Node
            ctx.save();
            const trailSegments = 24;
            const trailArcLength = 0.65; // in radians
            const cosY = Math.cos(currentRotY);
            const sinY = Math.sin(currentRotY);
            const cosX = Math.cos(currentRotX);
            const sinX = Math.sin(currentRotX);
            const fov = 750;

            ctx.beginPath();
            for (let t = 0; t <= trailSegments; t++) {
              const segProgress = t / trailSegments;
              const segAngle = node.currentAngle - (1 - segProgress) * trailArcLength;

              const tox = Math.cos(segAngle) * node.orbitR;
              const toz = Math.sin(segAngle) * node.orbitR;
              const toy = Math.sin(segAngle * 1.5 + node.tilt * 5) * (node.orbitR * 0.15);

              let trx = tox * cosY - toz * sinY;
              let trz = tox * sinY + toz * cosY;
              let trY = toy * cosX - trz * sinX;
              trz = toy * sinX + trz * cosX;

              const tDist = trz + 850;
              const tPersp = (fov / Math.max(tDist, 100)) * zoom;
              const tsx = centerX + trx * tPersp;
              const tsy = centerY + trY * tPersp;

              if (t === 0) {
                ctx.moveTo(tsx, tsy);
              } else {
                ctx.lineTo(tsx, tsy);
              }
            }

            const trailGrad = ctx.createLinearGradient(
              node.screenX - 80 * node.scale,
              node.screenY - 80 * node.scale,
              node.screenX,
              node.screenY
            );
            trailGrad.addColorStop(0, 'transparent');
            trailGrad.addColorStop(0.7, `${node.color}66`);
            trailGrad.addColorStop(1, `${node.glow}dd`);

            ctx.strokeStyle = trailGrad;
            ctx.lineWidth = Math.max(1.5, 3.2 * node.scale);
            ctx.stroke();
            ctx.restore();
          }
        });
      }

      // 6. Supernova Shockwave Pulse Wave Effect
      if (pulseWave) {
        pulseWaveRadius += 7 * zoom;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseWaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${Math.max(0, 0.9 - pulseWaveRadius / (width * 0.8))})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = currentPalette.badgeColor;
        ctx.shadowBlur = 24;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseWaveRadius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(236, 72, 153, ${Math.max(0, 0.7 - pulseWaveRadius / (width * 0.8))})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 7. Draw Interplanetary Kinetic Synapse Links
      PUBLIC_LINKS.forEach((link) => {
        const sourceNode = projectedNodes.find((n) => n.id === link.source);
        const targetNode = projectedNodes.find((n) => n.id === link.target);

        if (sourceNode && targetNode) {
          const isFilterActive =
            activeCategory === 'All' ||
            sourceNode.category === activeCategory ||
            targetNode.category === activeCategory;

          const linkAlpha = isFilterActive ? 0.45 : 0.1;
          const linkGrad = ctx.createLinearGradient(
            sourceNode.screenX,
            sourceNode.screenY,
            targetNode.screenX,
            targetNode.screenY
          );
          linkGrad.addColorStop(0, `${sourceNode.color}dd`);
          linkGrad.addColorStop(0.5, `${currentPalette.linkDefaultColor}99`);
          linkGrad.addColorStop(1, `${targetNode.color}dd`);

          ctx.save();
          ctx.strokeStyle = linkGrad;
          ctx.lineWidth = Math.max(1, (link.strength * 2.2 + 0.5) * sourceNode.scale);
          ctx.globalAlpha = linkAlpha;
          ctx.beginPath();
          ctx.moveTo(sourceNode.screenX, sourceNode.screenY);

          // Subtle organic curve
          const midX = (sourceNode.screenX + targetNode.screenX) / 2;
          const midY = (sourceNode.screenY + targetNode.screenY) / 2 - 15 * sourceNode.scale;
          ctx.quadraticCurveTo(midX, midY, targetNode.screenX, targetNode.screenY);
          ctx.stroke();

          // Animated Photons Traveling along link
          if (link.animated && isPlaying && isFilterActive) {
            const photonCount = 2;
            for (let p = 0; p < photonCount; p++) {
              const prog = (time * (1.2 + link.strength * 0.8) + (p * 1) / photonCount) % 1;
              const px = (1 - prog) * (1 - prog) * sourceNode.screenX + 2 * (1 - prog) * prog * midX + prog * prog * targetNode.screenX;
              const py = (1 - prog) * (1 - prog) * sourceNode.screenY + 2 * (1 - prog) * prog * midY + prog * prog * targetNode.screenY;

              ctx.beginPath();
              ctx.arc(px, py, 2.5 * sourceNode.scale, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = currentPalette.badgeColor;
              ctx.shadowBlur = 10;
              ctx.fill();
            }
          }
          ctx.restore();
        }
      });

      // 8. Draw Celestial Bodies, Multi-Pass Radiant Bloom Shaders & Diamond Starbursts
      projectedNodes.forEach((node) => {
        const isCore = node.id === 'nexus-core';
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const radius = Math.max(7, node.size * node.scale);

        const isDimmed = activeCategory !== 'All' && node.category !== activeCategory && !isSelected;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.22 : 1;

        // 🌟 A. Multi-Pass Radiant Bloom Shader Effect with Dynamic Intensity Multiplier
        if (enableBloomShader && bloomIntensity > 0.05) {
          ctx.save();
          // Use additive / screen blend mode for photographic glow
          ctx.globalCompositeOperation = 'lighter';
          // Scale global bloom opacity by adjustable intensity level
          ctx.globalAlpha = (isDimmed ? 0.22 : 1) * bloomIntensity;

          // Pass 1: Wide Soft Atmospheric Diffusion Halo (Calibrated radius)
          const wideBloomRadius = radius * (isCore ? (3.5 + bloomIntensity * 3.5) : isSelected ? (2.6 + bloomIntensity * 2.2) : (2.0 + bloomIntensity * 1.6));
          const wideBloomGrad = ctx.createRadialGradient(
            node.screenX,
            node.screenY,
            radius * 0.2,
            node.screenX,
            node.screenY,
            wideBloomRadius
          );
          wideBloomGrad.addColorStop(0, isCore ? `${node.glow}99` : `${node.glow}55`);
          wideBloomGrad.addColorStop(0.35, isCore ? `${node.color}44` : `${node.color}25`);
          wideBloomGrad.addColorStop(0.7, `${currentPalette.badgeColor}12`);
          wideBloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = wideBloomGrad;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, wideBloomRadius, 0, Math.PI * 2);
          ctx.fill();

          // Pass 2: High-Intensity Radiant Specular Core Corona
          const coreBloomRadius = radius * (isCore ? (2.2 + bloomIntensity * 1.4) : (1.4 + bloomIntensity * 0.8));
          const coreBloomGrad = ctx.createRadialGradient(
            node.screenX,
            node.screenY,
            0,
            node.screenX,
            node.screenY,
            coreBloomRadius
          );
          coreBloomGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 + bloomIntensity * 0.45})`);
          coreBloomGrad.addColorStop(0.3, `${node.color}99`);
          coreBloomGrad.addColorStop(0.75, `${node.glow}33`);
          coreBloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = coreBloomGrad;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, coreBloomRadius, 0, Math.PI * 2);
          ctx.fill();

          // Pass 3: Subtle Anamorphic Lens Flare Streak (Core & Selected Nodes)
          if (isCore || isSelected) {
            const streakWidth = radius * (isCore ? (4.0 + bloomIntensity * 4.5) : (2.5 + bloomIntensity * 2.5));
            const streakHeight = radius * 0.35;
            const streakGrad = ctx.createRadialGradient(
              node.screenX,
              node.screenY,
              0,
              node.screenX,
              node.screenY,
              streakWidth
            );
            streakGrad.addColorStop(0, `rgba(255, 255, 255, ${0.5 + bloomIntensity * 0.4})`);
            streakGrad.addColorStop(0.25, `${node.color}77`);
            streakGrad.addColorStop(0.65, `${currentPalette.badgeColor}22`);
            streakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = streakGrad;
            ctx.beginPath();
            ctx.ellipse(node.screenX, node.screenY, streakWidth, streakHeight, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        } else {
          // Standard Fallback Glow when Bloom Shader is toggled OFF
          const glowRadius = radius * (isCore ? 3.5 : isSelected ? 2.5 : 1.8);
          const glowGrad = ctx.createRadialGradient(
            node.screenX,
            node.screenY,
            radius * 0.3,
            node.screenX,
            node.screenY,
            glowRadius
          );
          glowGrad.addColorStop(0, `${node.glow}88`);
          glowGrad.addColorStop(0.5, `${node.color}33`);
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 🌟 B. Radiant Optical Diffraction Starburst Spikes & Rotating Corona
        if (isCore || (enableBloomShader && (isSelected || node.type === 'intelligence'))) {
          ctx.save();
          const starAngle = time * (isCore ? 0.75 : 0.45);
          const starPulse = Math.sin(time * 3 + node.pulsePhase) * 0.25 + 1;
          const starRadius = radius * ((isCore ? (2.0 + bloomIntensity * 1.0) : 1.5) * starPulse);

          ctx.translate(node.screenX, node.screenY);
          ctx.rotate(starAngle);

          // Multi-Ray Optical Diffraction Starburst
          const rayCount = isCore ? 4 : 2;
          ctx.fillStyle = enableBloomShader ? `rgba(255, 255, 255, ${0.4 + bloomIntensity * 0.45})` : 'rgba(255, 255, 255, 0.6)';
          ctx.shadowColor = node.color;
          ctx.shadowBlur = enableBloomShader ? (10 + bloomIntensity * 12) : 8;

          for (let s = 0; s < rayCount; s++) {
            ctx.rotate(Math.PI / rayCount);
            ctx.beginPath();
            const len = starRadius * (s % 2 === 0 ? 1.3 : 0.8);
            const w = starRadius * (s % 2 === 0 ? 0.22 : 0.15);
            ctx.moveTo(0, -len);
            ctx.quadraticCurveTo(0, 0, w, 0);
            ctx.quadraticCurveTo(0, 0, 0, len);
            ctx.quadraticCurveTo(0, 0, -w, 0);
            ctx.quadraticCurveTo(0, 0, 0, -len);
            ctx.fill();
          }

          // Rotating Multi-Spectral Orbital Ring & Satellites (For Nexus Core)
          if (isCore) {
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 2.0, radius * 0.85, -time * 1.2, 0, Math.PI * 2);
            ctx.strokeStyle = `${node.color}bb`;
            ctx.lineWidth = 1.8;
            ctx.stroke();

            // Orbital Quantum Satellites
            const photonCount = 4;
            for (let p = 0; p < photonCount; p++) {
              const pAngle = time * 2.5 + (p * Math.PI * 2) / photonCount;
              const pDist = radius * 1.7;
              const px = Math.cos(pAngle) * pDist;
              const py = Math.sin(pAngle) * (pDist * 0.55);

              ctx.beginPath();
              ctx.arc(px, py, 2.2 * node.scale, 0, Math.PI * 2);
              ctx.fillStyle = p % 2 === 0 ? node.color : '#ffffff';
              ctx.shadowColor = node.glow;
              ctx.shadowBlur = 8;
              ctx.fill();
            }
          }

          ctx.restore();
        }

        // 🌟 C. Central Celestial Sphere Body
        const bodyGrad = ctx.createRadialGradient(
          node.screenX - radius * 0.3,
          node.screenY - radius * 0.3,
          radius * 0.1,
          node.screenX,
          node.screenY,
          radius
        );

        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, node.glow);
        bodyGrad.addColorStop(0.8, node.color);
        bodyGrad.addColorStop(1, '#020617');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Focus Rings on Selection or Hover
        if (isSelected || isHovered) {
          ctx.strokeStyle = isCore ? currentPalette.badgeColor : '#ffffff';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius + (isCore ? 14 : 8), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Core Planetary Ring
        if (node.type === 'core') {
          ctx.strokeStyle = `${node.color}cc`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(node.screenX, node.screenY, radius * 2.0, radius * 0.7, time * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Node Label Rendering
        if (node.scale > 0.45 || isSelected || isScreensaver || isCore) {
          ctx.font = `${isCore || isSelected ? 'bold 12px' : '600 10px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = isCore ? currentPalette.badgeColor : isSelected ? '#ffffff' : '#cbd5e1';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;

          const labelPrefix = isCore ? '✨ ' : '';
          ctx.fillText(`${labelPrefix}${node.label}`, node.screenX, node.screenY + radius + (isCore ? 20 : 15));

          // Sub-role badge on screensaver or Core
          if (isScreensaver || isSelected || isCore) {
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = isCore ? node.glow : node.color;
            const subText = isCore ? 'HUMAN CONNECTION NEXUS' : node.category.toUpperCase();
            ctx.fillText(subText, node.screenX, node.screenY + radius + (isCore ? 32 : 27));
          }
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // 9. Overlay Screensaver HUD (Broadcast / Streaming Mode)
      if (isScreensaver) {
        ctx.save();

        // Top Left: Stream Centerpiece Banner
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = `${currentPalette.badgeColor}66`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(24, 24, 440, 96, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentPalette.badgeColor;
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.fillText('🔴 LIVE STREAM CENTERPIECE — 3D GALAXY SCREENSAVER', 42, 50);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('✨ YOUANDINOTAI.COM · THE HUMAN CONNECTION PLATFORM', 42, 70);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('• Kinetic Social Graph · Verified Trust Protocol · Real-World Meetups', 42, 90);

        // Top Right: Live Connection Matrix Telemetry
        const trWidth = 320;
        const trX = width - trWidth - 24;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = `${currentPalette.badgeColor}66`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(trX, 24, trWidth, 96, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentPalette.badgeColor;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('🛰️ KINETIC SPACE TELEMETRY', trX + 18, 48);

        ctx.fillStyle = '#4ade80';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('● 3D ENGINE: 60 FPS DETERMINISTIC CANVAS', trX + 18, 68);
        ctx.fillText(`● PALETTE: ${currentPalette.name.toUpperCase()}`, trX + 18, 86);

        // Bottom Left: Live Audio-Reactive Waveform Visualizer
        const blWidth = 380;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = `${currentPalette.badgeColor}66`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(24, height - 90, blWidth, 66, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentPalette.badgeColor;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('⚡ HARMONIC RESONANCE SPECTRUM', 40, height - 68);

        // Real-Time Audio Reactive Waveform
        const audioData = spaceAudio.getAudioData();
        ctx.beginPath();
        ctx.strokeStyle = currentPalette.badgeColor;
        ctx.lineWidth = 2;
        for (let w = 0; w < 300; w += 4) {
          const sampleIdx = Math.floor((w / 300) * (audioData.length || 32));
          const freqAmp = audioData[sampleIdx] ? (audioData[sampleIdx] / 255) * 16 : 0;
          const waveX = 40 + w;
          const waveY = height - 42 + Math.sin(time * 6 + w * 0.08) * (6 + freqAmp) * Math.cos(time * 2 + w * 0.04);
          if (w === 0) ctx.moveTo(waveX, waveY);
          else ctx.lineTo(waveX, waveY);
        }
        ctx.stroke();

        // Bottom Right: Orbit Telemetry & Exit Shortcut
        const brWidth = 380;
        const brX = width - brWidth - 24;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = `${currentPalette.badgeColor}66`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(brX, height - 96, brWidth, 72, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentPalette.badgeColor;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`ORBIT: ${(rotYRef.current % (Math.PI * 2)).toFixed(2)} rad | ZOOM: ${zoom.toFixed(2)}x | ${nodes.length} NODES`, brX + 18, height - 74);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('✨ Built with Google AI Studio & Gemini Models', brX + 18, height - 56);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Press [ESC], [S], or Click anywhere to Exit', brX + 18, height - 38);

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPlaying,
    speedMultiplier,
    isScreensaver,
    activeCategory,
    pulseWave,
    stars,
    nodes,
    selectedNode,
    hoveredNode,
    currentPalette,
    showOrbitTrails,
    enableBloomShader,
    bloomIntensity
  ]);

  // Mouse Interaction Handlers for 3D Drag & Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (isScreensaver) {
      setIsScreensaver(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      rotYRef.current += deltaX * 0.006;
      rotXRef.current = Math.max(-1.2, Math.min(1.2, rotXRef.current + deltaY * 0.006));

      setRotY(rotYRef.current);
      setRotX(rotXRef.current);

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover hit detection
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found: SpaceNode | null = null;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const rad = Math.max(14, node.size * (zoomRef.current || 1));
        const dist = Math.hypot((node as unknown as { screenX: number }).screenX - mouseX, (node as unknown as { screenY: number }).screenY - mouseY);
        if (dist <= rad + 10) {
          found = node;
          if (hoveredNode?.id !== node.id) {
            spaceAudio.playNodeChime(i);
          }
          break;
        }
      }
      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clicked: SpaceNode | null = null;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const rad = Math.max(14, node.size * (zoomRef.current || 1));
      const dist = Math.hypot((node as unknown as { screenX: number }).screenX - mouseX, (node as unknown as { screenY: number }).screenY - mouseY);
      if (dist <= rad + 12) {
        clicked = node;
        spaceAudio.playNodeChime(i);
        break;
      }
    }

    setSelectedNode(clicked);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
    setCameraZoom((prev) => Math.max(0.4, Math.min(2.5, prev + zoomDelta)));
  };

  const triggerSupernova = () => {
    setPulseWave(true);
    setTimeout(() => setPulseWave(false), 2400);
  };

  const cycleSpeed = () => {
    setSpeedMultiplier((current) => {
      const idx = SPEED_OPTIONS.indexOf(current);
      if (idx === -1 || idx === SPEED_OPTIONS.length - 1) {
        return SPEED_OPTIONS[0];
      }
      return SPEED_OPTIONS[idx + 1];
    });
  };

  const cyclePalette = () => {
    setPaletteIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
  };

  const shortcutList = [
    { key: 'Space', desc: 'Play / Pause Orbital Simulation', group: 'Simulation' },
    { key: 'R', desc: 'Toggle Auto-Rotate Camera', group: 'Camera' },
    { key: 'C', desc: 'Cycle Galaxy Theme & Color Palette', group: 'Aesthetics' },
    { key: 'T', desc: 'Toggle Kinetic Orbit Trails', group: 'Aesthetics' },
    { key: 'B', desc: 'Toggle Radiant Bloom Shader Effect', group: 'Aesthetics' },
    { key: '[ / ]', desc: 'Decrease / Increase Bloom Level', group: 'Aesthetics' },
    { key: 'P', desc: 'Trigger Supernova Shockwave Pulse', group: 'Simulation' },
    { key: 'S', desc: 'Launch AFK Screensaver Mode', group: 'Modes' },
    { key: 'M', desc: 'Toggle Ambient Cosmic Soundscapes & Chimes', group: 'Audio' },
    { key: '+ / -', desc: 'Increase / Decrease Simulation Speed', group: 'Simulation' },
    { key: '0', desc: 'Reset Camera Zoom & Orientation', group: 'Camera' },
    { key: 'F', desc: 'Toggle Fullscreen Mode', group: 'Display' },
    { key: '? / K', desc: 'Show / Hide Keyboard Shortcuts Guide', group: 'Navigation' },
    { key: 'Esc', desc: 'Close Drawers / Exit Screensaver', group: 'Navigation' }
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans text-slate-100">
      {/* 🌌 Background 3D Space Canvas */}
      <canvas
        id="galaxy-3d-canvas"
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
      />

      {/* 🎛️ Standard HUD (Hidden in Full Screensaver Mode) */}
      {!isScreensaver && (
        <>
          {/* Top Header Bar */}
          <header
            id="galaxy-top-header"
            className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-20 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent"
          >
            {/* Brand & Mission Badge */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div
                className="w-10 h-10 rounded-xl p-0.5 shadow-lg flex items-center justify-center transition-colors duration-500"
                style={{
                  background: `linear-gradient(135deg, ${currentPalette.badgeColor}, #3b82f6, #9333ea)`,
                  boxShadow: `0 0 16px ${currentPalette.badgeColor}40`
                }}
              >
                <Orbit className="w-6 h-6 text-white animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-white tracking-tight">YouAndINotAI</h1>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold transition-all duration-300"
                    style={{
                      backgroundColor: `${currentPalette.badgeColor}20`,
                      color: currentPalette.badgeColor,
                      borderColor: `${currentPalette.badgeColor}50`
                    }}
                  >
                    3D GALAXY
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">youandinotai.com · The Human Connection Platform</p>
              </div>
            </div>

            {/* Quick Actions, Modes & AI Studio Credit */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Built with Google AI Studio & Gemini Credit Badge */}
              <a
                id="built-with-aistudio-badge"
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-slate-700/60 hover:border-indigo-400/60 shadow-lg shadow-indigo-950/40 text-xs font-semibold text-slate-200 transition-all hover:scale-105 group"
                title="Crafted with Google AI Studio and Gemini Models"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-sm shadow-blue-500/40">
                  <Sparkles className="w-3 h-3 text-white animate-pulse" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono text-indigo-300 font-bold leading-none tracking-wider uppercase">Built with</span>
                  <span className="text-[11px] font-bold text-white group-hover:text-cyan-300 leading-tight">AI Studio & Gemini</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              {/* Keyboard Shortcuts Button */}
              <button
                id="toggle-shortcuts-button"
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-all"
                title="Keyboard Shortcuts Cheat Sheet [Shortcut: ? or K]"
              >
                <Keyboard className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Shortcuts</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">?</span>
              </button>

              {/* Cosmic Audio Ambient Soundscape Toggle */}
              <button
                id="toggle-audio-synth-button"
                type="button"
                onClick={toggleAudioSynth}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  audioEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
                title="Toggle Ambient Cosmic Soundscapes [Shortcut: M]"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{audioEnabled ? 'Cosmic Audio ON' : 'Cosmic Audio OFF'}</span>
              </button>

              {/* Screensaver Toggle */}
              <button
                id="toggle-screensaver-button"
                type="button"
                onClick={() => setIsScreensaver(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95"
                title="Launch AFK Fullscreen Screensaver [Shortcut: S]"
              >
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">AFK Screensaver [S]</span>
              </button>
            </div>
          </header>

          {/* 🌟 Floating Semi-Transparent UI Panel (Bottom-Left Corner) */}
          <section
            id="galaxy-quick-controls-panel"
            aria-label="Simulation Controls"
            className="absolute bottom-20 left-4 z-30 pointer-events-auto p-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 shadow-2xl shadow-black/80 max-w-sm flex flex-col gap-2.5 transition-all duration-300 hover:border-cyan-500/40"
          >
            {/* Header with Title & Active Palette Pill */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/70">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold font-mono text-slate-200 uppercase tracking-wider">
                  Simulation Controls
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowShortcutsModal(true)}
                  className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5"
                  title="View Keyboard Shortcuts [?]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${currentPalette.badgeColor}20`,
                    color: currentPalette.badgeColor
                  }}
                >
                  {currentPalette.name}
                </span>
              </div>
            </div>

            {/* Core Action Grid: Auto-Rotate, Sim Speed, Cycle Palettes, Orbit Trails */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Auto-Rotate Toggle */}
              <button
                id="toggle-auto-rotate-button"
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 border transition-all ${
                  autoRotate
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                }`}
                title="Toggle galaxy camera continuous auto-rotation [Shortcut: R]"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className={`w-3.5 h-3.5 ${autoRotate ? 'text-cyan-400 animate-spin-slow' : 'text-slate-500'}`} />
                  <span className="text-[11px]">Auto-Rotate</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    autoRotate ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {autoRotate ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 2. Simulation Speed Cycle */}
              <button
                id="cycle-speed-button"
                type="button"
                onClick={cycleSpeed}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-200 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-1.5 transition-all active:scale-95"
                title="Increase / cycle orbital simulation speed [Shortcut: + or -]"
              >
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Sim Speed</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {speedMultiplier}x
                </span>
              </button>

              {/* 3. Cycle Color Palettes */}
              <button
                id="cycle-palette-button"
                type="button"
                onClick={cyclePalette}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 text-slate-200 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-1.5 transition-all active:scale-95"
                title="Cycle galaxy theme & color palette [Shortcut: C]"
              >
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="text-[11px]">Palette</span>
                </div>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm"
                  style={{ backgroundColor: currentPalette.badgeColor }}
                />
              </button>

              {/* 4. Toggle Orbit Trails */}
              <button
                id="toggle-orbit-trails-button"
                type="button"
                onClick={() => setShowOrbitTrails(!showOrbitTrails)}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 border transition-all ${
                  showOrbitTrails
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                }`}
                title="Toggle glowing kinetic orbital trails & paths [Shortcut: T]"
              >
                <div className="flex items-center gap-1.5">
                  <Activity className={`w-3.5 h-3.5 ${showOrbitTrails ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[11px]">Orbit Trails</span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    showOrbitTrails ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {showOrbitTrails ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* 🌟 Bloom Shader & Intensity Adjustment Level */}
            <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-800/70">
              <div className="flex items-center justify-between">
                <button
                  id="toggle-bloom-shader-button"
                  type="button"
                  onClick={() => setEnableBloomShader(!enableBloomShader)}
                  className={`py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                    enableBloomShader
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Toggle radiant starburst bloom shader & lens flare effects [Shortcut: B]"
                >
                  <Sun className={`w-3 h-3 ${enableBloomShader ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>Bloom Shader</span>
                  <span className="text-[9px] font-mono opacity-80">[B]</span>
                </button>

                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <span>Level:</span>
                  <span className="font-bold text-amber-300">{enableBloomShader ? `${Math.round(bloomIntensity * 100)}%` : 'OFF'}</span>
                </div>
              </div>

              {/* Interactive Bloom Intensity Slider */}
              {enableBloomShader && (
                <div className="flex items-center gap-2 pt-0.5 px-1">
                  <span className="text-[9px] font-mono text-slate-500">Soft</span>
                  <input
                    id="bloom-intensity-slider"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={bloomIntensity}
                    onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
                    title="Adjust starburst radiant bloom level [Shortcut: [ to decrease, ] to increase]"
                  />
                  <span className="text-[9px] font-mono text-slate-500">High</span>
                </div>
              )}
            </div>
          </section>

          {/* Bottom Floating Footer Bar */}
          <footer
            id="galaxy-bottom-footer"
            className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-4 pointer-events-none z-20"
          >
            {/* Category Filter Chips */}
            <div
              id="category-filter-bar"
              className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-xl pointer-events-auto overflow-x-auto max-w-full"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Orbit Motion Controls */}
            <div
              id="orbit-playback-controls"
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-xl pointer-events-auto"
            >
              <button
                id="play-pause-orbit-button"
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-all"
                title={isPlaying ? 'Pause Orbit [Space]' : 'Play Orbit [Space]'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                id="trigger-supernova-pulse-button"
                type="button"
                onClick={triggerSupernova}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 border border-amber-500/30 transition-all"
                title="Trigger Kinetic Supernova Shockwave [Shortcut: P]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Supernova Pulse</span>
              </button>

              <button
                id="reset-camera-button"
                type="button"
                onClick={() => {
                  setCameraZoom(1);
                  setRotX(0.45);
                  rotYRef.current = 0;
                  setRotY(0);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                title="Reset Camera Orientation [Shortcut: 0]"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </footer>

          {/* Selected Node Details Drawer */}
          {selectedNode && (
            <div
              id="selected-node-detail-drawer"
              className="absolute top-20 right-4 w-80 md:w-96 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 p-5 shadow-2xl z-30 animate-in fade-in slide-in-from-right duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: selectedNode.color, boxShadow: `0 0 12px ${selectedNode.glow}` }}
                  />
                  <h3 className="text-base font-bold text-white tracking-tight">{selectedNode.label}</h3>
                </div>
                <button
                  id="close-node-detail-button"
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block mb-1">ROLE / CLUSTER</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-semibold">
                    {selectedNode.details.role}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{selectedNode.details.description}</p>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] block">METRICS</span>
                    <span className="text-emerald-400 font-mono font-medium">{selectedNode.details.metrics}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] block">STATUS</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedNode.details.status}</span>
                  </div>
                </div>

                <a
                  id="explore-youandinotai-link"
                  href="https://youandinotai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <span>Explore youandinotai.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* ⌨️ Keyboard Shortcuts Cheat Sheet Modal */}
          {showShortcutsModal && (
            <div
              id="keyboard-shortcuts-modal"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setShowShortcutsModal(false)}
            >
              <div
                className="w-full max-w-lg rounded-3xl bg-slate-950/95 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                      <Keyboard className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
                      <p className="text-xs text-slate-400 font-mono">Full visualizer & simulation command matrix</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShortcutsModal(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Shortcuts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {shortcutList.map((item) => (
                    <div
                      key={item.key}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-200 font-medium">{item.desc}</span>
                        <span className="text-[9px] font-mono text-slate-500">{item.group}</span>
                      </div>
                      <kbd className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold shadow-inner whitespace-nowrap">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                {/* Attribution & Footer Tip */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-cyan-300" />
                    <span>Built with <strong className="text-slate-200 group-hover:text-white">Google AI Studio & Gemini</strong></span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span>💡 Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400">Esc</kbd> to close</span>
                    <button
                      type="button"
                      onClick={() => setShowShortcutsModal(false)}
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🌌 Celestial Data Panel (Selected Node Details) */}
          {selectedNode && (
            <div className="absolute top-24 right-6 w-80 sm:w-96 rounded-2xl bg-slate-950/85 border border-slate-700/80 shadow-2xl backdrop-blur-2xl text-slate-100 z-20 pointer-events-auto animate-in fade-in slide-in-from-right-4">
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${selectedNode.color}40, ${selectedNode.glow}90)`,
                      border: `1px solid ${selectedNode.color}80`,
                      boxShadow: `0 0 20px ${selectedNode.glow}40`
                    }}
                  >
                    <Orbit className="w-5 h-5 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: selectedNode.color }}>
                      {selectedNode.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">{selectedNode.label}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close Panel [Esc]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Primary Role</h4>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {selectedNode.details.role}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedNode.details.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                    <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Status</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: selectedNode.color }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: selectedNode.glow }}></span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-200">{selectedNode.details.status}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                    <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Telemetry</h4>
                    <p className="text-[10px] font-mono text-slate-300 leading-tight">
                      {selectedNode.details.metrics.split(' · ').map((m, i) => (
                        <span key={i} className="block">{m}</span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-950 transition-all shadow-lg hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(to right, ${selectedNode.color}, ${selectedNode.glow})`,
                      boxShadow: `0 4px 14px ${selectedNode.color}40`
                    }}
                    onClick={() => {
                      triggerSupernova();
                    }}
                  >
                    Ping Node Cluster
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🎵 Floating Space Audio Dock & Soundscape Studio */}
          <SpaceAudioDock currentThemeColor={currentPalette.badgeColor} />
        </>
      )}
    </div>
  );
}
