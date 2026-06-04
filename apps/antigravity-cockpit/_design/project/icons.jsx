/* global React */

// Lucide-style stroke icons, inlined so we don't need npm/esm.
// All icons share the same prop signature: { size = 18, strokeWidth = 1.8 }.

const I = ({ size = 18, strokeWidth = 1.8, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

const Icon = {
  Dashboard: (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></I>,
  Comms: (p) => <I {...p}><path d="M21 12c0 4.4-4 8-9 8a10 10 0 0 1-3.7-.7L3 21l1.7-4.6A8.4 8.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z"/></I>,
  Hash: (p) => <I {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></I>,
  Paperweight: (p) => <I {...p}><path d="M5 5h10l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M14 5v5h5"/><path d="M8 14h6M8 18h6"/></I>,
  Hermes: (p) => <I {...p}><path d="M12 2v20M5 7l7-3 7 3"/><circle cx="12" cy="13" r="3"/><path d="M8 21h8"/></I>,
  Network: (p) => <I {...p}><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7v3M10.6 11.4 7 17M13.4 11.4 17 17"/></I>,
  Terminal: (p) => <I {...p}><path d="M4 5h16v14H4z"/><path d="m7 10 3 2-3 2M13 14h4"/></I>,
  Shield: (p) => <I {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z"/></I>,
  Bolt: (p) => <I {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></I>,
  BoltOff: (p) => <I {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/><path d="M3 3l18 18"/></I>,
  Search: (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>,
  Plus: (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Send: (p) => <I {...p}><path d="m4 4 16 8-16 8 4-8-4-8Z"/><path d="m8 12 12 0"/></I>,
  Mic: (p) => <I {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></I>,
  Paperclip: (p) => <I {...p}><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L11 18a2 2 0 0 1-3-3l7-7"/></I>,
  Eye: (p) => <I {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></I>,
  Check: (p) => <I {...p}><path d="m5 12 5 5 9-11"/></I>,
  Clock: (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I>,
  Alert: (p) => <I {...p}><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18v.5"/></I>,
  Heart: (p) => <I {...p}><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"/></I>,
  Lock: (p) => <I {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></I>,
  Globe: (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18"/></I>,
  Arrow: (p) => <I {...p}><path d="M5 12h14M13 6l6 6-6 6"/></I>,
  ArrowDown: (p) => <I {...p}><path d="M12 5v14M6 13l6 6 6-6"/></I>,
  Layers: (p) => <I {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></I>,
  Sliders: (p) => <I {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/></I>,
  Settings: (p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></I>,
  X: (p) => <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>,
  Cmd: (p) => <I {...p}><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z"/></I>,
  Sparkles: (p) => <I {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4"/></I>,
  Brain: (p) => <I {...p}><path d="M9 4a4 4 0 0 0-4 4v1a4 4 0 0 0-1 7 4 4 0 0 0 5 5 4 4 0 0 0 5-2v-3"/><path d="M14 21a4 4 0 0 1-4-3"/><path d="M15 4a4 4 0 0 1 4 4v1a4 4 0 0 1 1 7 4 4 0 0 1-5 5"/><path d="M9 12h2"/></I>,
  Sun: (p) => <I {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></I>,
  Moon: (p) => <I {...p}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/></I>,
  Pin: (p) => <I {...p}><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6Z"/></I>,
  Filter: (p) => <I {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></I>,
  Refresh: (p) => <I {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></I>,
  Grid: (p) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></I>,
  List: (p) => <I {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></I>,
  Megaphone: (p) => <I {...p}><path d="M3 11v2a2 2 0 0 0 2 2h2l9 5V4L7 9H5a2 2 0 0 0-2 2Z"/><path d="M19 5v14"/></I>,
  Coins: (p) => <I {...p}><circle cx="8" cy="8" r="6"/><path d="M18.1 8.5A6 6 0 1 1 11 18.4M7 6h2v2M7 12c1.5 0 2-.5 2-2"/></I>,
  Cpu: (p) => <I {...p}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></I>,
  Discord: (p) => <I {...p}><path d="M20 7a16 16 0 0 0-5-2l-.5 1a14 14 0 0 0-5 0L9 5a16 16 0 0 0-5 2c-2 4-2.5 8-2 12 1.5 1 3.5 2 5.5 2l1-2c-1-.3-2-.7-2.5-1.3.5 0 1 0 1.5.3 2.5 1 5.5 1 8 0 .5-.3 1-.3 1.5-.3-.5.6-1.5 1-2.5 1.3l1 2c2 0 4-1 5.5-2 .5-4 0-8-2-12Z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></I>,
  Telegram: (p) => <I {...p}><path d="m21 4-18 7 6 2 8-6-5 8 8 6 1-17Z"/></I>,
  GitBranch: (p) => <I {...p}><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9a6 6 0 0 1-6 6h-1"/></I>,
};

window.Icon = Icon;
