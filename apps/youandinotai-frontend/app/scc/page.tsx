import { ExternalLink, Globe, Lock, ShieldCheck } from 'lucide-react';

const publicSurfaces = [
  {
    name: 'YouAndINotAI',
    url: 'https://youandinotai.com',
    label: 'Customer-facing social platform',
  },
  {
    name: 'OnlineRecycle',
    url: 'https://onlinerecycle.net',
    label: 'Central Florida electronics recycling service',
  },
  {
    name: 'AI-Solutions Store',
    url: 'https://ai-solutions.store',
    label: 'Separate storefront surface',
  },
  {
    name: 'Antigravity Dashboard',
    url: 'https://dashboard.aidoesitall.website',
    label: 'Public status board',
  },
] as const;

const privateItems = [
  'Publishing queues, creator workflows, and platform dashboards stay on approved internal lanes.',
  'Internal node operations, credential flows, and unfinished rollout tooling do not belong on a public route.',
  'This public dashboard only keeps high-level status, verified links, and explicitly tracked information.',
] as const;

export default function SccBoundaryPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/60 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Non-Indexed Boundary Page
              </p>
              <h1 className="text-3xl font-black tracking-tight">Internal Workflow Tools Stay Private</h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This route is intentionally limited to a public-safe boundary note. Operational workspaces, publishing
            controls, platform dashboards, and internal automation lanes are handled outside the public status surface.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-tight">Verified Public Surfaces</h2>
            </div>

            <div className="space-y-3">
              {publicSurfaces.map((surface) => (
                <a
                  key={surface.url}
                  href={surface.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition-all hover:-translate-y-1 hover:border-blue-500"
                >
                  <div>
                    <p className="text-sm font-bold">{surface.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{surface.label}</p>
                  </div>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-tight">What Stays Private</h2>
            </div>

            <div className="space-y-3">
              {privateItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 text-sm leading-7 text-slate-300">
          If you reached this page from an old bookmark or indexed link, return to the main dashboard for the current
          public status view. Private workflow tooling is intentionally separated from public product and status
          surfaces.
        </section>

        <footer className="border-t border-slate-800 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
          ANTIGRAVITY public boundary page
        </footer>
      </main>
    </div>
  );
}
