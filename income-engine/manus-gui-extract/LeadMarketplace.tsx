import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap, Search, DollarSign, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

const TIERS = {
  bronze: { label: "Bronze", price: "$25", color: "border-orange-700/50 bg-orange-900/10 text-orange-300", desc: "Raw lead" },
  silver: { label: "Silver", price: "$75", color: "border-slate-400/50 bg-slate-800/30 text-slate-300", desc: "Pre-qualified" },
  gold:   { label: "Gold",   price: "$200", color: "border-yellow-500/50 bg-yellow-900/10 text-yellow-300", desc: "Draft included" },
};

export default function LeadMarketplace() {
  const [scanning, setScanning] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const { data: leads, refetch } = trpc.fetcher.getQualifiedLeads.useQuery({ hoursAgo: 24 });
  const scanMutation = trpc.fetcher.scanForLeads.useMutation({
    onSuccess: () => { refetch(); },
  });
  const buyMutation = trpc.marketplace.createPaymentLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Opening secure checkout...");
    },
    onError: () => toast.error("Payment setup failed. Try again."),
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = await scanMutation.mutateAsync();
      toast.success(`Scan complete — ${result.qualified} qualified leads found`);
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleBuy = async (leadId: number, tier: "bronze" | "silver" | "gold") => {
    setBuyingId(`${leadId}-${tier}`);
    await buyMutation.mutateAsync({ leadId, tier });
    setBuyingId(null);
  };

  const timeAgo = (date: string) => {
    const h = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
    return h < 1 ? "< 1h ago" : `${h}h ago`;
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent neon-glow" />
          <h1 className="text-lg font-bold neon-glow">Lead Marketplace</h1>
          <Badge variant="outline" className="text-xs border-accent/50 text-accent">
            {leads?.length || 0} live
          </Badge>
        </div>
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="bg-accent hover:bg-accent/90 text-black font-semibold"
          size="sm"
        >
          {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          {scanning ? "Scanning..." : "Scan Now"}
        </Button>
      </div>

      {/* Tier Legend */}
      <div className="flex gap-3 p-4 border-b border-border">
        {Object.entries(TIERS).map(([k, t]) => (
          <div key={k} className={`flex items-center gap-2 px-3 py-1 rounded border text-xs ${t.color}`}>
            <span className="font-bold">{t.label}</span>
            <span className="font-mono">{t.price}</span>
            <span className="text-muted-foreground">— {t.desc}</span>
          </div>
        ))}
      </div>

      {/* Leads */}
      <ScrollArea className="flex-1 p-4">
        {!leads || leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <Zap className="w-8 h-8 opacity-30" />
            <p>No qualified leads yet. Hit Scan Now.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {leads.map((lead: any) => (
              <Card key={lead.id} className="border-border bg-card hover:border-accent/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-medium leading-snug flex-1">
                      {lead.title}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {lead.createdAt ? timeAgo(lead.createdAt) : "recent"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs border-accent/40 text-accent">
                      {lead.source?.replace("_", " ")}
                    </Badge>
                    {lead.budget && (
                      <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">
                        ${lead.budget.toLocaleString()}
                      </Badge>
                    )}
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> view
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {lead.deliverable && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{lead.deliverable}</p>
                  )}
                  <div className="flex gap-2">
                    {(["bronze", "silver", "gold"] as const).map((tier) => {
                      const t = TIERS[tier];
                      const id = `${lead.id}-${tier}`;
                      const loading = buyingId === id;
                      return (
                        <Button
                          key={tier}
                          onClick={() => handleBuy(lead.id, tier)}
                          disabled={!!buyingId}
                          size="sm"
                          variant="outline"
                          className={`text-xs flex-1 ${t.color} hover:opacity-80`}
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                            <><span className="font-bold mr-1">{t.label}</span>{t.price}</>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
