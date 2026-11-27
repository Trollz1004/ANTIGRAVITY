import { OperationsPage } from "@/components/OperationsPage";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileCheck2, ShieldAlert } from "lucide-react";

const attributionSurfaces = [
  { label: "/EMERGENT_CREDITS.md", detail: "Keep the upstream credit record at the approved component root." },
  { label: "/memory/EMERGENT_JOURNAL.md", detail: "Keep the supplied memory journal append-only; do not rewrite prior entries." },
  { label: "X-Powered-By header", detail: "Preserve X-Powered-By: Emergent (emergent.sh)." },
  { label: "X-Built-With header", detail: "Preserve X-Built-With: Claude Sonnet 4.5 via Emergent Universal Key." },
  { label: "Widget metadata", detail: "Preserve powered_by: emergent.sh and built_with: Claude Sonnet 4.5 via Emergent Universal Key." },
  { label: "Visible builder credit", detail: "Keep the Made with Emergent badge, BUILT BY EMERGENT · E1 sidebar credit, and built with claude sonnet 4.5 footer credit." },
  { label: "README credits", detail: "Retain the upstream README Credits section in derivative documentation." },
  { label: "Pre-push protection", detail: "Keep the upstream verification hook that refuses a build missing required attribution surfaces." },
];

export default function Credits() {
  return <OperationsPage eyebrow="Source governance" title="Credits & upstream review" description="External source material is reviewed before use. The LLC retains its operating controls while preserving required upstream credit for any approved component.">
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Emergent reference review</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The Hermes handoff and related source were reviewed as reference material. No Emergent runtime component is currently bundled, executed, or enabled in this application.</p></div><Badge variant="secondary">Reference only</Badge></div><div className="mt-6 rounded-xl border border-border bg-muted/20 p-5"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary"/><p className="font-medium">Mandatory surfaces if approved</p></div><p className="mt-3 text-sm leading-6 text-muted-foreground">The following are the reviewed Emergent attribution surfaces that must remain intact if the LLC later approves and incorporates that source component.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{attributionSurfaces.map(item => <div key={item.label} className="rounded-lg border border-border bg-background p-3"><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>)}</div><a href="https://emergent.sh" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">Emergent <ExternalLink className="h-3.5 w-3.5"/></a></div></div><aside className="rounded-2xl bg-slate-950 p-6 text-slate-50 shadow-sm"><ShieldAlert className="h-7 w-7 text-amber-300"/><h2 className="mt-5 text-lg font-semibold">Approval before import</h2><p className="mt-2 text-sm leading-6 text-slate-300">No upstream code, secrets, deployment configuration, or runtime behavior is imported solely from a repository. Each component requires a secret-free boundary, license review, security review, recorded approval, and the visible attribution conditions shown here.</p><Badge className="mt-5 bg-teal-300/15 text-teal-100 hover:bg-teal-300/15">No component approved</Badge></aside></section>
  </OperationsPage>;
}
