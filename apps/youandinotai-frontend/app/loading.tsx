export default function Loading() {
  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.10), transparent 60%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6" role="status" aria-label="Loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
          Loading
        </p>
      </div>
    </main>
  );
}
