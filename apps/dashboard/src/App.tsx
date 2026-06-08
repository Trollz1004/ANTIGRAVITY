import { useEffect, useState, useCallback, useRef } from "react";
import "./index.css";
import { AgentCardSkeleton, DAOCardSkeleton, BucketMeterSkeleton } from "./Skeletons";

const API_BASE =
  import.meta.env.VITE_PAPERCLIP_URL || "https://paperclip-hq.youandinotai.com";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle" | "offline";
  taskCount: number;
  color: string;
}

interface PlatformHealth {
  paperclip: boolean;
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

const DAO_TOKENS = [
  { symbol: "$LOVE", platform: "YouAndINotAI", supply: "2,500,000", color: "#ff6eb4" },
  { symbol: "$UKID", platform: "AI-Solutions", supply: "2,500,000", color: "#66b3ff" },
  { symbol: "$GREEN", platform: "OnlineRecycle", supply: "2,500,000", color: "#8ff2c7" },
  { symbol: "$AGRAV", platform: "AiDoesItAll", supply: "2,500,000", color: "#ffd966" },
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

function DAOCard({ dao }: { dao: (typeof DAO_TOKENS)[number] }) {
  return (
    <div className="dao-card">
      <div className="dao-symbol" style={{ color: dao.color }}>{dao.symbol}</div>
      <div className="dao-platform">{dao.platform}</div>
      <div className="dao-supply">{dao.supply} cap</div>
    </div>
  );
}

function BucketMeter({ id, label, pct }: { id: number; label: string; pct: number }) {
  return (
    <div className="bucket">
      <div className="bucket-label">#{id} {label}</div>
      <div className="bucket-bar-bg">
        <div className="bucket-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bucket-pct">{pct}%</span>
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
          <div className="subtitle">Mission Control</div>
          <div className="connection">
            <StatusDot status={connected ? "online" : "offline"} />
            <span>{connected ? "Paperclip HQ Connected" : "Paperclip HQ Offline"}</span>
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
          <h2 className="section-title">4-DAO Governance Tokens</h2>
          <div className="dao-grid">
            {DAO_TOKENS.map((d) => (
              <DAOCard key={d.symbol} dao={d} />
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">10-Bucket Revenue Engine</h2>
          <div className="bucket-grid">
            <BucketMeter id={1} label="Platform Subs" pct={10} />
            <BucketMeter id={2} label="Super Likes" pct={10} />
            <BucketMeter id={3} label="$LOVE Yield" pct={10} />
            <BucketMeter id={4} label="AI-Solutions" pct={10} />
            <BucketMeter id={5} label="$UKID Yield" pct={10} />
            <BucketMeter id={6} label="OnlineRecycle" pct={10} />
            <BucketMeter id={7} label="$GREEN Yield" pct={10} />
            <BucketMeter id={8} label="Merch Net" pct={10} />
            <BucketMeter id={9} label="$AGRAV Infra" pct={10} />
            <BucketMeter id={10} label="$AGRAV Yield" pct={10} />
          </div>
          <div className="bucket-note">Each bucket: 10% to kids. More buckets = more kids helped.</div>
        </section>

        <footer className="footer">
          Until no kid is in need. | Base L2 | Soulbound
        </footer>
      </div>
    </ErrorBoundary>
  );
}
