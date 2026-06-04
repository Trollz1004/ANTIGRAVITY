export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen w-full animate-pulse">
      <div className="w-64 shrink-0 border-r border-border bg-card" />
      <div className="flex-1 p-6 space-y-4">
        <div className="h-8 w-48 rounded bg-secondary" />
        <div className="h-4 w-64 rounded bg-secondary" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}
