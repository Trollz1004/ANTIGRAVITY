import { OperationsPage } from "@/components/OperationsPage";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole, SlidersHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Controls() {
  const channels = trpc.operations.channels.useQuery();
  return <OperationsPage eyebrow="LLC-owned configuration" title="Channel controls" description="Connection status, fulfillment defaults, policy mappings, listing rules, and channel enablement are managed here. Secret values remain server-side and are never displayed.">
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Marketplace connections</h2><p className="mt-1 text-sm text-muted-foreground">Each channel starts disabled and in review mode.</p></div><LockKeyhole className="h-6 w-6 text-primary"/></div><div className="mt-6 divide-y divide-border">{(channels.data ?? []).map(channel => <div key={channel.code} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{channel.displayName}</p><p className="mt-1 text-sm text-muted-foreground">{channel.capability === "api" ? "API-capable after authorized configuration" : channel.capability === "conditional" ? "Review-only until eligible access is confirmed" : "Prepared workflow only"}</p></div><div className="flex gap-2"><Badge variant="outline">{channel.operationMode}</Badge><Badge variant={channel.credentialState.configured ? "default" : "secondary"}>{channel.credentialState.configured ? "Configured" : "Not configured"}</Badge></div></div>)}</div></section><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><SlidersHorizontal className="h-6 w-6 text-primary"/><h2 className="mt-4 text-lg font-semibold">Operational defaults</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Fulfillment, return, location, category, and listing rules will be stored as non-secret mappings. Changing a channel to enabled will remain an explicit, audited decision.</p></section>
  </OperationsPage>;
}
