import { useEffect, useState, useCallback, useRef } from "react";
import "./index.css";
import { AgentCardSkeleton } from "./Skeletons";

const API_BASE =
  import.meta.env.VITE_OPENCLAW_SUPPORT_URL || "http://localhost:18789";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle" | "offline";
  taskCount: number;
  color: string;
}

interface PlatformHealth {
  openclaw: boolean;
  agents: Agent[];
  lastCheck: string;
}

const AGENTS: Agent[] = [
  { id: "ceo", name: "CEO", role: "Strategy & Orchestration", status: "idle", taskCount: 0, color: "#66b3ff" },
  { id: "cfo", name: "CFO", role: "Financial Integrity", status: "idle", taskCount: 0, color: "#8ff2c7" },
  { id: "cmo", name: "CMO", role: "Marketing & Growth", status: "idle", taskCount: 0, color: "#ff6eb4" },
  { id: "cto", name: "CTO", role: "Technical Execution", status: "idle", taskCount: 0, color: "#ffd966" },
  { id: "intern-1", name: "INTERN", role: "DoWhatTold", status: "idle", taskCount: 0, color: "#c4a5ff" },
];

const LAUNCH_UNITS = [
  { symbol: "DATE", platform: "YouAndINotAI", supply: "Memberships", color: "#ff6eb4" },
  { symbol: "VERIFY", platform: "Bot-Shield", supply: "Verification", color: "#66b3ff" },
  { symbol: "RECYCLE", platform: "OnlineRecycle", supply: "Service", color: "#8ff2c7" },
  { symbol: "SUPPORT", platform: "OpenClaw", supply: "Customer Care", color: "#ffd966" },
];

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: "#8ff2c7",
    busy: "#ffd966",
    idle: "#66b3ff",
    offline: "#ff5555",
  };
  return (
    <span
      className="status-dot"
      style={{ background: colors[status] || "#555", boxShadow: `0 0 12px ${colors[status] || "#555"}` }}
    />
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="agent-card" style={{ borderColor: agent.color + "44" }}>
      <div className="agent-header">
        <StatusDot status={agent.status} />
        <span className="agent-name" style={{ color: agent.color }}>{agent.name}</span>
        <span className="agent-status">{agent.status}</span>
      </div>
      <div className="agent-role">{agent.role}</div>
      <div className="agent-tasks">
        <div className="task-bar-bg">
          <div
            className="task-bar-fill"
            style={{
              width: `${Math.min((agent.taskCount / 25) * 100, 100)}%`,
              background: agent.color,
            }}
          />
        </div>
        <span className="task-count">{agent.taskCount}/25 tasks</span>
      </div>
    </div>
  );
}

function LaunchUnitCard({ unit }: { unit: (typeof LAUNCH_UNITS)[number] }) {
  return (
    <div className="launch-unit-card">
      <div className="launch-unit-symbol" style={{ color: unit.color }}>{unit.symbol}</div>
      <div className="launch-unit-platform">{unit.platform}</div>
      <div className="launch-unit-supply">{unit.supply}</div>
    </div>
  );
}

function RevenueMeter({ id, label, pct }: { id: number; label: string; pct: number }) {
  return (
    <div className="revenue-item">
      <div className="revenue-label">#{id} {label}</div>
      <div className="revenue-bar-bg">
        <div className="revenue-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="revenue-pct">{pct}%</span>
    </div>
  );
}

export function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState<string>("");
  const pollInProgress = useRef(false);

  const poll = useCallback(async () => {
    if (pollInProgress.current) return;
    pollInProgress.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setConnected(true);
        const data = await res.json();
        if (data.agents) setAgents(data.agents);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
      setLastPoll(new Date().toLocaleTimeString());
      pollInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [poll]);

  return (
    <ErrorBoundary>
      <div className="dashboard">
        <header className="top-bar">
          <div className="logo">ANTIGRAVITY</div>
          <div className="subtitle">Business Control</div>
          <div className="connection">
            <StatusDot status={connected ? "online" : "offline"} />
            <span>{connected ? "OpenClaw Support Connected" : "OpenClaw Support Offline"}</span>
            {loading && agents.length > 0 && (
              <span className="refresh-indicator">Refreshing...</span>
            )}
            <button
              className="refresh-btn"
              onClick={poll}
              disabled={loading}
              title="Refresh dashboard data"
            >
              ↻ Refresh
            </button>
            {lastPoll && <span className="last-poll">Last: {lastPoll}</span>}
          </div>
        </header>

        <section className="section">
          <h2 className="section-title">Agent Fleet</h2>
          <div className="agent-grid">
            {loading && agents.length === 0 ? (
              <>
                <AgentCardSkeleton />
                <AgentCardSkeleton />
                <AgentCardSkeleton />
                <AgentCardSkeleton />
                <AgentCardSkeleton />
              </>
            ) : (
              agents.map((a) => <AgentCard key={a.id} agent={a} />)
            )}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Launch Operations</h2>
          <div className="launch-unit-grid">
            {LAUNCH_UNITS.map((unit) => (
              <LaunchUnitCard key={unit.symbol} unit={unit} />
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Revenue Engine</h2>
          <div className="revenue-grid">
            <RevenueMeter id={1} label="Platform Subs" pct={100} />
            <RevenueMeter id={2} label="Verification" pct={100} />
            <RevenueMeter id={3} label="Memberships" pct={100} />
            <RevenueMeter id={4} label="AI-Solutions" pct={100} />
            <RevenueMeter id={5} label="Support" pct={100} />
            <RevenueMeter id={6} label="OnlineRecycle" pct={100} />
            <RevenueMeter id={7} label="Merch Net" pct={100} />
            <RevenueMeter id={8} label="Operations" pct={100} />
          </div>
          <div className="revenue-note">Business-only revenue view. Customer purchases buy platform value delivered.</div>
        </section>

        <footer className="footer">
          Business operations | Base L2 | Account-bound
        </footer>
      </div>
    </ErrorBoundary>
  );
}
