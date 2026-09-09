import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Globe,
  Plus,
  Play,
  Pause,
  RotateCw,
  Eye,
  Layers,
  Activity,
  Cpu,
  Database,
  Lock,
  Compass,
  CheckCircle2,
  Server,
  Share2,
  Terminal,
  Shield,
  ArrowRight,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Tv,
  Clock,
  Radio,
  ExternalLink,
  ShoppingBag,
  Sliders,
  Filter,
  Search,
  Crosshair,
  Orbit,
  Stars
} from 'lucide-react';
import type { GalaxyPlanet, KnowledgeGraphData } from '../types';

interface SpaceNode {
  id: string;
  label: string;
  type: 'core' | 'founder' | 'platform' | 'commerce' | 'node' | 'storage' | 'stream' | 'rule';
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

interface SpaceLink {
  source: string;
  target: string;
  strength: number;
  color?: string;
  animated?: boolean;
}

const KNOWLEDGE_NODES_DATA: Omit<SpaceNode, 'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz' | 'angle' | 'pulsePhase'>[] = [
  {
    id: 'antigravity-core',
    label: 'C:\\ANTIGRAVITY',
    type: 'core',
    color: '#00f2fe',
    glow: '#4facfe',
    size: 32,
    orbitR: 0,
    speed: 0,
    tilt: 0,
    category: 'Root Authority',
    details: {
      description: 'The single source of truth across all nodes. Unalterable core doctrine, single C:\\ANTIGRAVITY repository root.',
      role: 'Eternal Central Singularity',
      metrics: '100% Invariant Score · Zero Multi-Drive Drift',
      status: 'PRISTINE CANONICAL ROOT'
    }
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    type: 'founder',
    color: '#4285F4',
    glow: '#00e5ff',
    size: 24,
    orbitR: 110,
    speed: 0.009,
    tilt: 0.2,
    category: 'The Founding Four',
    details: {
      description: 'Permanent Co-Founder. Visual intelligence, content creation, space knowledge graph rendering, and multimodal deep reasoning.',
      role: 'Visual Intelligence & 3D Spatial Knowledge Engine',
      metrics: '8.4M tokens/day · 14ms Latency',
      status: 'ACTIVE CO-FOUNDER'
    }
  },
  {
    id: 'claude',
    label: 'Claude Code (Fable)',
    type: 'founder',
    color: '#D97706',
    glow: '#F59E0B',
    size: 24,
    orbitR: 150,
    speed: 0.007,
    tilt: -0.3,
    category: 'The Founding Four',
    details: {
      description: 'Permanent Co-Founder. Primary codebase architect (~90% of core architecture), Fable Judge lane, system doctrine guardian.',
      role: 'Primary Code Architect & Official Judge Lane',
      metrics: '14.2M tokens/day · 18ms Latency',
      status: 'ACTIVE CO-FOUNDER'
    }
  },
  {
    id: 'grok',
    label: 'Grok AI',
    type: 'founder',
    color: '#EF4444',
    glow: '#F87171',
    size: 22,
    orbitR: 190,
    speed: 0.0055,
    tilt: 0.4,
    category: 'The Founding Four',
    details: {
      description: 'Permanent Co-Founder. Adversarial reviewer, real-time stress audits, and doctrine invariant stress testing.',
      role: 'Adversarial Testing & Stress Audits',
      metrics: '4.1M tokens/day · 22ms Latency',
      status: 'ACTIVE CO-FOUNDER'
    }
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    type: 'founder',
    color: '#10B981',
    glow: '#34D399',
    size: 22,
    orbitR: 230,
    speed: 0.0045,
    tilt: -0.2,
    category: 'The Founding Four',
    details: {
      description: 'Permanent Co-Founder. Deep research, real-time intelligence, competitor audits, and grounded citation verification.',
      role: 'Deep Research & Intel Verification',
      metrics: '6.7M tokens/day · 28ms Latency',
      status: 'ACTIVE CO-FOUNDER'
    }
  },
  {
    id: 'crossfire',
    label: 'Crossfire Matrix',
    type: 'commerce',
    color: '#EC4899',
    glow: '#F472B6',
    size: 26,
    orbitR: 280,
    speed: 0.0035,
    tilt: 0.5,
    category: 'E-Commerce Crosslister',
    details: {
      description: 'Master Multi-Channel Marketplace Synchronization Engine. Bridges Odoo ERP 18 to eBay, Shopify, Amazon, Etsy, Poshmark & Mercari.',
      role: 'Cross-Platform Listing & Inventory Sync Hub',
      metrics: '6 Live Channels · Real-time Webhooks & Rate Throttling',
      status: 'LIVE CROSSLISTER ROUTE'
    }
  },
  {
    id: 'odoo-erp',
    label: 'Odoo Commerce Core',
    type: 'commerce',
    color: '#A855F7',
    glow: '#C084FC',
    size: 23,
    orbitR: 320,
    speed: 0.003,
    tilt: -0.4,
    category: 'E-Commerce Crosslister',
    details: {
      description: 'Central product repository, multi-language/currency translation engine, and collaborative filtering recommendation backend.',
      role: 'ERP Product Base & XML-RPC / REST 2.0 Hub',
      metrics: 'Multi-Lang (RTL/LTR) · 7 Currencies · Biometric 1-Tap Pay',
      status: 'SYNCHRONIZED'
    }
  },
  {
    id: 'ebay-market',
    label: 'eBay Crosslist Node',
    type: 'commerce',
    color: '#EAB308',
    glow: '#FACC15',
    size: 18,
    orbitR: 350,
    speed: 0.0028,
    tilt: 0.1,
    category: 'E-Commerce Crosslister',
    details: {
      description: 'eBay Trading & Inventory REST API bridge. Auto-calculates fees, localized currency conversion, and stock decrement sync.',
      role: 'Secondary Marketplace Channel',
      metrics: '99.4% Sync Accuracy · Instant Category Taxonomy Map',
      status: 'ACTIVE CHANNEL'
    }
  },
  {
    id: 'shopify-market',
    label: 'Shopify Storefront',
    type: 'commerce',
    color: '#22C55E',
    glow: '#4ADE80',
    size: 18,
    orbitR: 380,
    speed: 0.0024,
    tilt: -0.3,
    category: 'E-Commerce Crosslister',
    details: {
      description: 'Direct GraphQL Admin API sync for custom storefronts, automated collection placement, and webhook fulfillment updates.',
      role: 'Direct-to-Consumer Channel',
      metrics: 'GraphQL 2026-01 API · Webhook Auto-Replenish',
      status: 'ACTIVE CHANNEL'
    }
  },
  {
    id: 't5500-node',
    label: 'T5500 Command Post',
    type: 'node',
    color: '#38BDF8',
    glow: '#7DD3FC',
    size: 20,
    orbitR: 410,
    speed: 0.002,
    tilt: 0.35,
    category: 'Node Topology',
    details: {
      description: 'Primary command post and push-to-main authority (192.168.0.15). GTX 1070 GPU host, local builder node.',
      role: 'Primary Command Post & Push Authority',
      metrics: 'Port :3151 (Mission Control) · :9119 (Hermes)',
      status: 'COMMAND POST'
    }
  },
  {
    id: 'omniroute-hub',
    label: 'OmniRoute Gateway',
    type: 'platform',
    color: '#F43F5E',
    glow: '#FB7185',
    size: 22,
    orbitR: 445,
    speed: 0.0017,
    tilt: -0.15,
    category: 'Platform Infrastructure',
    details: {
      description: 'OmniRoute unified token-alias gateway. Serves VS Code & local developer harnesses at ports :20128 and :20129.',
      role: 'Token Gateway & Model Virtualizer',
      metrics: ':20128 Dashboard · :20129 Active v1 Endpoint',
      status: 'LIVE GATEWAY'
    }
  },
  {
    id: 'stream-doctrine',
    label: 'Kids Mission 10% Reserve',
    type: 'rule',
    color: '#F59E0B',
    glow: '#FBBF24',
    size: 20,
    orbitR: 480,
    speed: 0.0013,
    tilt: 0.25,
    category: 'Doctrine & Mission',
    details: {
      description: '10% per-bucket mission reserve corporate tax deduction for medical support for children in need. FL §496.405 compliant.',
      role: 'Perpetual Mission Mandate',
      metrics: 'No solicitation copy · 10% Corporate Reserve Rule',
      status: 'IMMUTABLE LAW'
    }
  }
];

const SPACE_LINKS: SpaceLink[] = [
  { source: 'antigravity-core', target: 'gemini', strength: 1, color: '#00f2fe', animated: true },
  { source: 'antigravity-core', target: 'claude', strength: 1, color: '#00f2fe', animated: true },
  { source: 'antigravity-core', target: 'grok', strength: 1, color: '#00f2fe', animated: true },
  { source: 'antigravity-core', target: 'perplexity', strength: 1, color: '#00f2fe', animated: true },
  { source: 'antigravity-core', target: 'crossfire', strength: 0.9, color: '#EC4899', animated: true },
  { source: 'crossfire', target: 'odoo-erp', strength: 0.95, color: '#A855F7', animated: true },
  { source: 'crossfire', target: 'ebay-market', strength: 0.8, color: '#EAB308', animated: true },
  { source: 'crossfire', target: 'shopify-market', strength: 0.8, color: '#22C55E', animated: true },
  { source: 'antigravity-core', target: 't5500-node', strength: 0.85, color: '#38BDF8', animated: false },
  { source: 'antigravity-core', target: 'omniroute-hub', strength: 0.85, color: '#F43F5E', animated: true },
  { source: 'antigravity-core', target: 'stream-doctrine', strength: 0.95, color: '#F59E0B', animated: true },
  { source: 'gemini', target: 'crossfire', strength: 0.7, color: '#818CF8', animated: true },
  { source: 'claude', target: 'omniroute-hub', strength: 0.7, color: '#F59E0B', animated: false }
];

export interface GraphyProps {
  initialScreensaver?: boolean;
  onCloseScreensaver?: () => void;
  isEmbeddedMini?: boolean;
}

export default function Graphy({ initialScreensaver = false, onCloseScreensaver, isEmbeddedMini = false }: GraphyProps) {
  // Nodes state with dynamic coordinates
  const [nodes, setNodes] = useState<SpaceNode[]>(() => {
    return KNOWLEDGE_NODES_DATA.map((n, i) => {
      const initialAngle = (i * Math.PI * 2) / KNOWLEDGE_NODES_DATA.length;
      return {
        ...n,
        angle: initialAngle,
        x: Math.cos(initialAngle) * n.orbitR,
        y: Math.sin(initialAngle) * n.orbitR * Math.cos(n.tilt),
        z: Math.sin(initialAngle) * n.orbitR * Math.sin(n.tilt),
        vx: 0,
        vy: 0,
        vz: 0,
        pulsePhase: Math.random() * Math.PI * 2
      };
    });
  });

  const [selectedNode, setSelectedNode] = useState<SpaceNode>(nodes[0]);
  const [hoveredNode, setHoveredNode] = useState<SpaceNode | null>(null);
  
  // Visual & Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isScreensaver, setIsScreensaver] = useState(initialScreensaver);
  const [cameraZoom, setCameraZoom] = useState(isEmbeddedMini ? 0.75 : 1);
  const [rotX, setRotX] = useState(0.45);
  const [rotY, setRotY] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [afkTimer, setAfkTimer] = useState(0);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [pulseWave, setPulseWave] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotYRef = useRef(0);
  const rotXRef = useRef(0.45);
  const zoomRef = useRef(isEmbeddedMini ? 0.75 : 1);

  // Sync initial screensaver if prop changes
  useEffect(() => {
    if (initialScreensaver !== undefined) {
      setIsScreensaver(initialScreensaver);
    }
  }, [initialScreensaver]);

  // Keyboard shortcut handlers (ESC, S, Space, P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.key === 'Escape' && isScreensaver) {
        setIsScreensaver(false);
        onCloseScreensaver?.();
      } else if (e.key === 's' || e.key === 'S') {
        setIsScreensaver((prev) => !prev);
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
  }, [isScreensaver, onCloseScreensaver]);

  // Sync ref values for high-rate requestAnimationFrame
  useEffect(() => {
    rotYRef.current = rotY;
  }, [rotY]);
  useEffect(() => {
    rotXRef.current = rotX;
  }, [rotX]);
  useEffect(() => {
    zoomRef.current = cameraZoom;
  }, [cameraZoom]);

  // AFK detection to trigger eye-grabbing stream screensaver automatically if enabled
  useEffect(() => {
    let interval: any;
    const resetAfk = () => setAfkTimer(0);

    window.addEventListener('mousemove', resetAfk);
    window.addEventListener('keydown', resetAfk);

    interval = setInterval(() => {
      setAfkTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetAfk);
      window.removeEventListener('keydown', resetAfk);
    };
  }, []);

  // Trigger cosmic pulse
  const triggerCosmicPulse = () => {
    setPulseWave(true);
    setTimeout(() => setPulseWave(false), 2400);
  };

  // Background stars cache
  const stars = useMemo(() => {
    const starList = [];
    for (let i = 0; i < 400; i++) {
      starList.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: (Math.random() - 0.5) * 1000,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.04 + 0.01
      });
    }
    return starList;
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const set = new Set(nodes.map((n) => n.category));
    return ['All', ...Array.from(set)];
  }, [nodes]);

  // Main 3D Rendering & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.015;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Auto rotate in AFK screensaver or playing mode
      if (isPlaying || isScreensaver) {
        const autoSpin = (isScreensaver ? 0.004 : 0.002) * speedMultiplier;
        rotYRef.current += autoSpin;
        setRotY(rotYRef.current);
      }

      // Clear Canvas with deep stellar space gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) / 1.1);
      bgGrad.addColorStop(0, '#040817');
      bgGrad.addColorStop(0.5, '#02040b');
      bgGrad.addColorStop(1, '#000002');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Twinkling Deep Stars
      if (showStars) {
        stars.forEach((star, idx) => {
          // 3D projection for stars
          const cosY = Math.cos(rotYRef.current * 0.3);
          const sinY = Math.sin(rotYRef.current * 0.3);
          const rx = star.x * cosY - star.z * sinY;
          const rz = star.x * sinY + star.z * cosY;

          const fov = 700;
          const scale = fov / (fov + rz + 800);
          if (scale > 0) {
            const px = cx + rx * scale * zoomRef.current;
            const py = cy + star.y * scale * zoomRef.current;
            const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 100 + idx);
            ctx.fillStyle = `rgba(220, 235, 255, ${star.alpha * twinkle * (scale * 1.2)})`;
            ctx.beginPath();
            ctx.arc(px, py, star.size * scale, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Screensaver Cosmic Nebula Dust Rings
      if (isScreensaver || pulseWave) {
        ctx.save();
        ctx.translate(cx, cy);
        for (let ring = 1; ring <= 4; ring++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 180 * ring * zoomRef.current, 70 * ring * zoomRef.current, rotYRef.current * 0.2, 0, Math.PI * 2);
          ctx.strokeStyle = ring % 2 === 0 ? 'rgba(0, 242, 254, 0.04)' : 'rgba(236, 72, 153, 0.04)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Update Node 3D Coordinates
      const currentRotY = rotYRef.current;
      const currentRotX = rotXRef.current;
      const zoom = zoomRef.current;

      const projectedNodes = nodes.map((node) => {
        let currentAngle = node.angle;
        if (isPlaying || isScreensaver) {
          currentAngle += node.speed * speedMultiplier;
          node.angle = currentAngle;
        }

        // Orbit calculation with tilt
        const orbX = Math.cos(currentAngle) * node.orbitR;
        const orbY = Math.sin(currentAngle) * node.orbitR * Math.sin(node.tilt);
        const orbZ = Math.sin(currentAngle) * node.orbitR * Math.cos(node.tilt);

        // 3D Rotation Matrix (X and Y axis)
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        // Rotate around Y
        const rx = orbX * cosY - orbZ * sinY;
        const rz = orbX * sinY + orbZ * cosY;

        // Rotate around X
        const ry = orbY * cosX - rz * sinX;
        const finalZ = orbY * sinX + rz * cosX;

        // Perspective Projection
        const fov = 650;
        const perspective = fov / (fov + finalZ + 400);
        const screenX = cx + rx * perspective * zoom;
        const screenY = cy + ry * perspective * zoom;

        return {
          ...node,
          screenX,
          screenY,
          screenZ: finalZ,
          scale: perspective * zoom,
        };
      });

      // Draw Orbit Trajectories
      if (showOrbits) {
        ctx.save();
        nodes.forEach((node) => {
          if (node.orbitR > 0) {
            ctx.beginPath();
            const segments = 64;
            for (let i = 0; i <= segments; i++) {
              const theta = (i * Math.PI * 2) / segments;
              const ox = Math.cos(theta) * node.orbitR;
              const oy = Math.sin(theta) * node.orbitR * Math.sin(node.tilt);
              const oz = Math.sin(theta) * node.orbitR * Math.cos(node.tilt);

              const cosY = Math.cos(currentRotY);
              const sinY = Math.sin(currentRotY);
              const cosX = Math.cos(currentRotX);
              const sinX = Math.sin(currentRotX);

              const rx = ox * cosY - oz * sinY;
              const rz = ox * sinY + oz * cosY;
              const ry = oy * cosX - rz * sinX;
              const finalZ = oy * sinX + rz * cosX;

              const fov = 650;
              const p = fov / (fov + finalZ + 400);
              const px = cx + rx * p * zoom;
              const py = cy + ry * p * zoom;

              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `${node.color}15`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
        ctx.restore();
      }

      // Draw Obsidian Knowledge Links / Synapses
      if (showConstellations) {
        ctx.save();
        SPACE_LINKS.forEach((link) => {
          const sNode = projectedNodes.find((n) => n.id === link.source);
          const tNode = projectedNodes.find((n) => n.id === link.target);

          if (sNode && tNode) {
            ctx.beginPath();
            ctx.moveTo(sNode.screenX, sNode.screenY);
            ctx.lineTo(tNode.screenX, tNode.screenY);

            const linkColor = link.color || '#4facfe';
            ctx.strokeStyle = `${linkColor}35`;
            ctx.lineWidth = Math.max(1, (sNode.scale + tNode.scale) * 1.2 * link.strength);
            ctx.stroke();

            // Animated synapse pulses travelling along links
            if (link.animated) {
              const pulsePos = (time * 1.5 + (sNode.scale * 10)) % 1;
              const pulseX = sNode.screenX + (tNode.screenX - sNode.screenX) * pulsePos;
              const pulseY = sNode.screenY + (tNode.screenY - sNode.screenY) * pulsePos;

              ctx.beginPath();
              ctx.arc(pulseX, pulseY, 2.5 * sNode.scale, 0, Math.PI * 2);
              ctx.fillStyle = linkColor;
              ctx.shadowColor = linkColor;
              ctx.shadowBlur = 8;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        });
        ctx.restore();
      }

      // Sort nodes by depth (screenZ) so closer nodes render on top
      const sortedNodes = [...projectedNodes].sort((a, b) => b.screenZ - a.screenZ);

      // Draw Cosmic Nodes
      sortedNodes.forEach((node) => {
        const radius = Math.max(4, node.size * node.scale * 0.7);
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        ctx.save();

        // Outer Atmospheric Aura / Glow
        const isGemini = node.id === 'gemini';
        const glowMultiplier = isGemini ? 4.8 : isSelected ? 3.8 : 2.6;
        const glowRadius = radius * glowMultiplier;
        
        const glowGrad = ctx.createRadialGradient(
          node.screenX,
          node.screenY,
          radius * 0.3,
          node.screenX,
          node.screenY,
          glowRadius
        );

        if (isGemini) {
          // Google Multi-chromatic Radiant Corona
          glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.95)');
          glowGrad.addColorStop(0.25, 'rgba(66, 133, 244, 0.7)');
          glowGrad.addColorStop(0.55, 'rgba(168, 85, 247, 0.45)');
          glowGrad.addColorStop(0.8, 'rgba(251, 188, 5, 0.25)');
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          glowGrad.addColorStop(0, `${node.glow}dd`);
          glowGrad.addColorStop(0.4, `${node.color}55`);
          glowGrad.addColorStop(1, `${node.color}00`);
        }

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // GEMINI EPICNESS: 4-Pointed Radiant Diamond Starburst & Rotating Corona
        if (isGemini) {
          ctx.save();
          const starAngle = time * 0.75;
          const starRadius = radius * (2.8 + Math.sin(time * 3) * 0.4);
          
          ctx.translate(node.screenX, node.screenY);
          ctx.rotate(starAngle);
          
          // Draw 4-point Diamond Starburst
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 16;
          
          for (let s = 0; s < 2; s++) {
            ctx.rotate((Math.PI / 4) * s);
            ctx.beginPath();
            ctx.moveTo(0, -starRadius * (s === 0 ? 1.4 : 0.8));
            ctx.quadraticCurveTo(0, 0, starRadius * (s === 0 ? 0.3 : 0.2), 0);
            ctx.quadraticCurveTo(0, 0, 0, starRadius * (s === 0 ? 1.4 : 0.8));
            ctx.quadraticCurveTo(0, 0, -starRadius * (s === 0 ? 0.3 : 0.2), 0);
            ctx.quadraticCurveTo(0, 0, 0, -starRadius * (s === 0 ? 1.4 : 0.8));
            ctx.fill();
          }

          // Rotating Multi-Spectral Orbital Ring
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 2.2, radius * 0.9, -time * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Orbital Quantum Photon Micro-Satellites
          const photonCount = 4;
          for (let p = 0; p < photonCount; p++) {
            const pAngle = time * 2.5 + (p * Math.PI * 2) / photonCount;
            const pDist = radius * 1.8;
            const px = Math.cos(pAngle) * pDist;
            const py = Math.sin(pAngle) * (pDist * 0.6);

            ctx.beginPath();
            ctx.arc(px, py, 2.5 * node.scale, 0, Math.PI * 2);
            ctx.fillStyle = p % 2 === 0 ? '#00e5ff' : '#fbbc05';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 10;
            ctx.fill();
          }

          ctx.restore();
        }

        // Central Celestial Body
        const bodyGrad = ctx.createRadialGradient(
          node.screenX - radius * 0.3,
          node.screenY - radius * 0.3,
          radius * 0.1,
          node.screenX,
          node.screenY,
          radius
        );
        
        if (isGemini) {
          bodyGrad.addColorStop(0, '#ffffff');
          bodyGrad.addColorStop(0.2, '#00e5ff');
          bodyGrad.addColorStop(0.5, '#4285F4');
          bodyGrad.addColorStop(0.85, '#9333ea');
          bodyGrad.addColorStop(1, '#020617');
        } else {
          bodyGrad.addColorStop(0, '#ffffff');
          bodyGrad.addColorStop(0.3, node.glow);
          bodyGrad.addColorStop(0.8, node.color);
          bodyGrad.addColorStop(1, '#020617');
        }

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Focus Rings on Selection
        if (isSelected || isHovered) {
          ctx.strokeStyle = isGemini ? '#00e5ff' : '#ffffff';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius + (isGemini ? 12 : 7), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Planetary Core Ring / Halo for Core
        if (node.type === 'core') {
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(node.screenX, node.screenY, radius * 2.0, radius * 0.7, time * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Text Labels with Drop Shadow
        if (node.scale > 0.45 || isSelected || isScreensaver || isGemini) {
          ctx.font = `${isGemini || isSelected ? 'bold 12px' : '600 10px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = isGemini ? '#00e5ff' : isSelected ? '#ffffff' : '#cbd5e1';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          
          const labelPrefix = isGemini ? '✨ ' : '';
          ctx.fillText(`${labelPrefix}${node.label}`, node.screenX, node.screenY + radius + (isGemini ? 18 : 14));

          // Sub-role badge on screensaver or Gemini
          if (isScreensaver || isSelected || isGemini) {
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = isGemini ? '#38bdf8' : node.color;
            const subText = isGemini ? 'VISUAL & 3D KNOWLEDGE CORE' : node.category.toUpperCase();
            ctx.fillText(subText, node.screenX, node.screenY + radius + (isGemini ? 30 : 26));
          }
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // Overlay Screensaver Live Ticker & Stream Eye Candy
      if (isScreensaver) {
        ctx.save();
        
        // 1. Top Left: Stream HUD & Gemini Multimodal Core
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(24, 24, 420, 100, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.fillText('🔴 LIVE STREAM CENTERPIECE — OBSIDIAN SPACE GRAPH', 42, 50);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('✨ GEMINI 2.5 FLASH MULTIMODAL · VISUAL INTELLIGENCE', 42, 70);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('• 10% Mission Reserve · FL §496.405 Enforced · Invariants 100%', 42, 88);
        ctx.fillText('• Synchronized: Odoo 18 · Crossfire Matrix · The Founding Four', 42, 104);

        // 2. Top Right: Real-time Node Telemetry Grid
        const trWidth = 340;
        const trX = width - trWidth - 24;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(trX, 24, trWidth, 100, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('🛰️ MISSION CONTROL NODE TELEMETRY', trX + 18, 48);

        ctx.fillStyle = '#4ade80';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('● T5500 (192.168.0.15): COMMAND POST · ONLINE', trX + 18, 68);
        ctx.fillText('● SABRETOOTH (MASTER): ROUTING · ACTIVE', trX + 18, 84);
        ctx.fillText('● 9020 (SANDBOX): OLLAMA WORKER · READY', trX + 18, 100);

        // 3. Bottom Left: Live Quantum Pulse / Waveform Visualizer
        const blWidth = 380;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(24, height - 90, blWidth, 66, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('⚡ QUANTUM SYNAPSE FREQUENCY', 40, height - 68);

        // Draw animated live mini waveform
        ctx.beginPath();
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        for (let w = 0; w < 300; w += 4) {
          const waveX = 40 + w;
          const waveY = height - 42 + Math.sin(time * 6 + w * 0.08) * 8 * Math.cos(time * 2 + w * 0.04);
          if (w === 0) ctx.moveTo(waveX, waveY);
          else ctx.lineTo(waveX, waveY);
        }
        ctx.stroke();

        // 4. Bottom Right: Dynamic Orbit Telemetry & Exit Reminder
        const brWidth = 360;
        const brX = width - brWidth - 24;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(brX, height - 90, brWidth, 66, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(`ORBIT ANGLE: ${(rotYRef.current % (Math.PI * 2)).toFixed(2)} rad  |  ZOOM: ${zoom.toFixed(2)}x`, brX + 18, height - 66);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`ACTIVE CELESTIAL BODIES: ${nodes.length} SYNAPSE NODES`, brX + 18, height - 48);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('Press [ESC], [S], or Click anywhere to Exit Screensaver', brX + 18, height - 32);

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, isPlaying, isScreensaver, speedMultiplier, showConstellations, showOrbits, showStars, pulseWave, selectedNode, hoveredNode]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isScreensaver]);

  // Mouse Interaction (Orbit Dragging & Node Selection)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      rotYRef.current += deltaX * 0.006;
      rotXRef.current = Math.max(-1.2, Math.min(1.2, rotXRef.current + deltaY * 0.006));

      setRotY(rotYRef.current);
      setRotX(rotXRef.current);

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection on projected nodes
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const zoom = zoomRef.current;

      let found: SpaceNode | null = null;
      for (const node of nodes) {
        const orbX = Math.cos(node.angle) * node.orbitR;
        const orbY = Math.sin(node.angle) * node.orbitR * Math.sin(node.tilt);
        const orbZ = Math.sin(node.angle) * node.orbitR * Math.cos(node.tilt);

        const cosY = Math.cos(rotYRef.current);
        const sinY = Math.sin(rotYRef.current);
        const cosX = Math.cos(rotXRef.current);
        const sinX = Math.sin(rotXRef.current);

        const rx = orbX * cosY - orbZ * sinY;
        const rz = orbX * sinY + orbZ * cosY;
        const ry = orbY * cosX - rz * sinX;
        const finalZ = orbY * sinX + rz * cosX;

        const fov = 650;
        const p = fov / (fov + finalZ + 400);
        const sx = cx + rx * p * zoom;
        const sy = cy + ry * p * zoom;
        const dist = Math.hypot(mouseX - sx, mouseY - sy);

        if (dist < Math.max(12, node.size * p * 0.8)) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newZoom = Math.max(0.4, Math.min(2.5, cameraZoom - e.deltaY * 0.0015));
    setCameraZoom(newZoom);
    zoomRef.current = newZoom;
  };

  return (
    <div className={`relative flex flex-col ${isScreensaver ? 'fixed inset-0 z-50 bg-black' : 'h-[calc(100vh-64px)] bg-slate-950'} text-slate-100 overflow-hidden`}>
      {/* Top Controls Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Branding & Core Telemetry */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-500/30 pointer-events-auto shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Orbit className="w-4 h-4 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-xs">OBSIDIAN 3D SPACE KNOWLEDGE GRAPH</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                CENTERPIECE ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Orbital Celestial Topology · Crossfire Crosslister · The Founding Four
            </p>
          </div>
        </div>

        {/* Right: Screensaver & Graph Control Actions */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-2xl">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPlaying ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Orbital Spin"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Orbiting' : 'Paused'}</span>
          </button>

          {/* Screensaver AFK Mode Toggle (Stream Highlight) */}
          <button
            onClick={() => setIsScreensaver(!isScreensaver)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isScreensaver
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
            }`}
            title="Full Screen Stream Screensaver"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{isScreensaver ? 'Exit Screensaver' : '📺 AFK Stream Screensaver'}</span>
          </button>

          {/* Cosmic Pulse Button */}
          <button
            onClick={triggerCosmicPulse}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1"
            title="Induce Synapse Shockwave"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shockwave</span>
          </button>

          {/* Zoom In/Out */}
          <button
            onClick={() => {
              const next = Math.min(2.2, cameraZoom + 0.2);
              setCameraZoom(next);
              zoomRef.current = next;
            }}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              const next = Math.max(0.5, cameraZoom - 0.2);
              setCameraZoom(next);
              zoomRef.current = next;
            }}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Quick Category Filter Bar (Bottom Left) */}
        {!isScreensaver && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-2 font-mono">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Selected Node Knowledge Card (Bottom Right Floating Inspector) */}
        {!isScreensaver && selectedNode && (
          <div className="absolute bottom-6 right-6 z-20 w-96 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  {selectedNode.category}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  {selectedNode.label}
                </h3>
              </div>
              <span className="text-[11px] font-bold font-mono text-emerald-400">
                {selectedNode.details.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNode.details.description}
            </p>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Role:</span>
                <span className="text-slate-200 font-bold text-right">{selectedNode.details.role}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Live Metrics:</span>
                <span className="text-cyan-400 text-right">{selectedNode.details.metrics}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Orbit Radius: {selectedNode.orbitR} AU</span>
              <span className="text-cyan-400 font-bold">Centerpiece Synapse Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
