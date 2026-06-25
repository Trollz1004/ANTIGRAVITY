/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm Orbital Ops palette (per design_guidelines.json)
        ag: {
          base: "#141110",
          surface: "#1A1614",
          elevated: "#261F1C",
          glass: "rgba(38, 31, 28, 0.6)",
        },
        ink: {
          DEFAULT: "#F9F6EE",
          muted: "#B5A79E",
          dim: "#8A7D75",
        },
        brand: {
          DEFAULT: "#FF6B35",
          glow: "rgba(255, 107, 53, 0.5)",
        },
        signal: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
        token: {
          LOVE: "#EF4444",
          UKID: "#3B82F6",
          GREEN: "#10B981",
          AGRAV: "#F59E0B",
        },
      },
      fontFamily: {
        heading: [
          "Instrument Serif",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        data: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        label: [
          "Geist Mono",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
        body: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        label: ["0.625rem", { lineHeight: "1", letterSpacing: "0.2em" }],
      },
      borderRadius: {
        sharp: "2px",
        sm: "4px",
        md: "6px",
      },
      boxShadow: {
        "brand-glow": "0 0 30px rgba(255, 107, 53, 0.35)",
        "ticker": "0 -4px 20px rgba(255, 107, 53, 0.3)",
        "focus-ring": "0 0 0 1px #FF6B35, 0 0 30px rgba(255, 107, 53, 0.15)",
      },
      animation: {
        "heartbeat-slow": "heartbeat 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "shimmer": "shimmer 3s linear infinite",
        "ticker-tick": "ticker-tick 1.2s ease-out",
        "page-in": "page-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "grain": "grain 8s steps(10) infinite",
      },
      keyframes: {
        heartbeat: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".7", transform: "scale(1.15)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ticker-tick": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "40%": { transform: "translateY(-6px)", opacity: "0.5" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -5%)" },
          "20%": { transform: "translate(-10%, 5%)" },
          "30%": { transform: "translate(5%, -10%)" },
          "40%": { transform: "translate(-5%, 15%)" },
          "50%": { transform: "translate(-10%, 5%)" },
          "60%": { transform: "translate(15%, 0)" },
          "70%": { transform: "translate(0, 10%)" },
          "80%": { transform: "translate(-15%, 0)" },
          "90%": { transform: "translate(10%, 5%)" },
        },
      },
    },
  },
  plugins: [],
};
