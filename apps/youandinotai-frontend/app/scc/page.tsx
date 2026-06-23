import { ExternalLink, Globe, Lock, ShieldCheck } from 'lucide-react';

const publicSurfaces = [
  {
    name: 'YouAndINotAI',
    url: 'https://youandinotai.com',
    label: 'Customer-facing social platform',
  },
  {
    name: 'OnlineRecycle',
    url: 'https://onlinerecycle.org',
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
    label: 'Public status page',
  },
] as const;

const privateItems = [
  'Private account details are never shown on a public page.',
  'Payment changes happen through Square or signed-in account pages.',
  'This page keeps only customer-safe status, verified links, and support information.',
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
                Customer Status Page
              </p>
              <h1 className="text-3xl font-black tracking-tight">Public Updates Stay Simple</h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This page is limited to customer-safe updates, verified links, and support information. Account,
            payment, and support changes happen through secure pages.
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
            <h2 className="text-lg font-black tracking-tight">What This Page Does Not Show</h2>
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
          If you reached this page from an old bookmark or indexed link, return to the main site for the current
          dating app, membership, and support information.
        </section>

        <footer className="border-t border-slate-800 py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
          YouAndINotAI public status page
        </footer>
      </main>
    </div>
  );
}
