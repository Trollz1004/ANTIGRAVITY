import { useEffect } from "react";
import { useStore } from "@/store";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AgentCard } from "@/components/AgentCard";
import { ChatPane } from "@/components/ChatPane";
import { CommandPalette } from "@/components/CommandPalette";
import { LogFeed } from "@/components/LogFeed";
import { MissionTicker } from "@/components/MissionTicker";
import { Sparkline } from "@/components/Sparkline";
import { Stat } from "@/components/Stat";
import { Toasts } from "@/components/Toasts";
import { Icon } from "@/lib/icons";
import { makeSparkline } from "@/data";

function DashboardHome() {
  const agents = useStore((s) => s.agents);
  const buckets = useStore((s) => s.buckets);
  const missions = useStore((s) => s.missions);
  const membership records = useStore((s) => s.membership records);
  const streamMode = useStore((s) => s.streamMode);
  const liveAgents = agents.filter((agent) => agent.status === "live" || agent.status === "busy").length;
  const revenue = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const activeMissions = missions.filter((mission) => mission.status === "active").length;
  const tokenbusiness reserve = membership records.reduce((sum, membership records) => sum + membership records.business reserve * membership records.price, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
      <section className="space-y-4">
        {streamMode ? (
          <div className="broadcast-shell rounded-md p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="label-cap mb-2">YouTube-safe mission view</div>
                <h1 className="font-heading text-3xl md:text-5xl tracking-tight">
                  AI helping society, live on the board.
                </h1>
                <p className="mt-3 max-w-2xl text-sm md:text-base text-ink-muted">
                  Public-safe ANTIGRAVITY operations: agents, missions, and infrastructure are visible;
                  private details, logs, revenue numbers, and task bodies are hidden.
                </p>
              </div>
              <div className="stream-badge">
                <span className="heartbeat heartbeat--busy" />
                STREAM MODE
              </div>
            </div>
            <div className="grid gap-3 mt-5 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Agents live" value={`${liveAgents}/${agents.length}`} tone="brand" icon={<Icon.Users size={16} />} hint="Paperclip adapters ready" spark={<Sparkline values={makeSparkline(liveAgents, 18)} />} />
              <Stat label="Paperclip" value="3100" tone="success" icon={<Icon.Server size={16} />} hint="Local server · 0 plugins loaded" spark={<Sparkline values={makeSparkline(18, 18)} />} />
              <Stat label="Mission lanes" value={activeMissions} tone="info" icon={<Icon.Workflow size={16} />} hint="Visible public lanes" spark={<Sparkline values={makeSparkline(14, 18)} />} />
              <Stat label="OpenClaw" value="READY" tone="success" icon={<Icon.Cpu size={16} />} hint="Hermes router engaged" spark={<Sparkline values={makeSparkline(25, 18)} />} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Agents live" value={`${liveAgents}/${agents.length}`} tone="brand" icon={<Icon.Users size={16} />} hint="Paperclip adapters ready" spark={<Sparkline values={makeSparkline(liveAgents, 18)} />} />
          <Stat label="Revenue rail" value={`$${revenue.toLocaleString("en-US")}`} delta={8.4} tone="success" icon={<Icon.Banknote size={16} />} hint="Payment surfaces monitored" spark={<Sparkline values={makeSparkline(22, 18)} />} />
          <Stat label="Active work" value={activeMissions} tone="info" icon={<Icon.Workflow size={16} />} hint="Visible Paperclip lanes" spark={<Sparkline values={makeSparkline(14, 18)} />} />
          <Stat label="business reserve view" value={`$${Math.round(tokenbusiness reserve).toLocaleString("en-US")}`} delta={3.1} icon={<Icon.Coins size={16} />} hint="Operator-only synthetic view" spark={<Sparkline values={makeSparkline(30, 18)} />} />
        </div>

        <div className="panel rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg">Fleet roster</h2>
            <span className="label-cap">Sabretooth orchestration · 9020 dev · T5500 production</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => <AgentCard key={agent.id} agent={agent} streamMode={streamMode} />)}
          </div>
        </div>
      </section>

      <section className="space-y-4 min-h-[620px]">
        <ChatPane />
        <div className="panel rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg">Live log</h2>
            <span className="heartbeat heartbeat--busy" />
          </div>
          <LogFeed limit={12} streamMode={streamMode} />
        </div>
      </section>
    </div>
  );
}

function FleetPage() {
  const agents = useStore((s) => s.agents);
  const streamMode = useStore((s) => s.streamMode);
  return (
    <div className="panel rounded-md p-4">
      <h2 className="font-heading text-lg mb-4">Agent fleet</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => <AgentCard key={agent.id} agent={agent} streamMode={streamMode} />)}
      </div>
    </div>
  );
}

function RevenuePage() {
  const buckets = useStore((s) => s.buckets);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {buckets.map((bucket) => (
        <Stat
          key={bucket.id}
          label={bucket.name}
          value={`$${bucket.value.toLocaleString("en-US")}`}
          delta={bucket.trend * 100}
          tone={bucket.compounding ? "success" : "default"}
          icon={<Icon.Banknote size={16} />}
          hint={`${bucket.streams} monitored streams`}
          spark={<Sparkline values={makeSparkline(bucket.value / 1000, 20)} />}
        />
      ))}
    </div>
  );
}

function MissionsPage() {
  const missions = useStore((s) => s.missions);
  const streamMode = useStore((s) => s.streamMode);
  return (
    <div className="panel rounded-md p-4">
      <h2 className="font-heading text-lg mb-4">Paperweight work lanes</h2>
      <div className="space-y-3">
        {missions.map((mission) => (
          <div key={mission.id} className="border border-ag-elevated rounded-sm p-3 bg-ag-base/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-data text-sm text-ink">{mission.id} · {streamMode ? mission.tag : mission.title}</div>
                <div className="label-cap mt-1">{streamMode ? "Public mission lane" : `${mission.owner} · ${mission.tag} · ${mission.status}`}</div>
              </div>
              <span className="font-data text-sm tabular-nums text-brand">{mission.progress}%</span>
            </div>
            <div className="task-bar mt-3"><div className="task-bar-fill" style={{ width: `${mission.progress}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokensPage() {
  const membership records = useStore((s) => s.membership records);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {membership records.map((membership records) => (
        <Stat
          key={membership records.symbol}
          label={membership records.symbol}
          value={`$${membership records.price.toFixed(3)}`}
          delta={membership records.delta24h}
          icon={<Icon.Coins size={16} />}
          hint={`${membership records.name} · ${membership records.circulating.toLocaleString("en-US")} circulating`}
          spark={<Sparkline values={makeSparkline(membership records.price * 100, 18)} />}
        />
      ))}
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="panel rounded-md p-6 min-h-[420px] flex flex-col justify-center items-center text-center gap-3">
      <Icon.Workflow size={28} className="text-brand" />
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="font-data text-sm text-ink-muted max-w-lg">
        Routed through the same operational shell. Use the command palette or sidebar to jump back to active fleet, logs, revenue, and Paperclip lanes.
      </p>
    </div>
  );
}

export default function App() {
  const page = useStore((s) => s.page);
  const synthTick = useStore((s) => s.synthTick);

  useEffect(() => {
    const id = window.setInterval(() => synthTick(), 2400);
    return () => window.clearInterval(id);
  }, [synthTick]);

  let content = <DashboardHome />;
  if (page === "fleet") content = <FleetPage />;
  if (page === "revenue") content = <RevenuePage />;
  if (page === "membership records") content = <TokensPage />;
  if (page === "paperweight") content = <MissionsPage />;
  if (page === "hermes") content = <PlaceholderPage title="Hermes node routing" />;
  if (page === "comms") content = <PlaceholderPage title="Comms gateway" />;
  if (page === "settings") content = <PlaceholderPage title="Settings" />;

  return (
    <div className="min-h-screen bg-ag-base text-ink overflow-hidden">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-5 xl:p-6 pb-20">
            {content}
          </main>
        </div>
      </div>
      <MissionTicker />
      <Toasts />
      <CommandPalette />
    </div>
  );
}
