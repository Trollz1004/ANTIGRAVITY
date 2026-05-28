import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Zap, Filter, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Leads() {
  const [budgetFilter, setBudgetFilter] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: leads, refetch: refetchLeads, isLoading } = trpc.fetcher.getLeads.useQuery({});
  const scanMutation = trpc.fetcher.scanForLeads.useMutation({
    onSuccess: (result) => {
      refetchLeads();
      toast.success(`Scan complete: ${result.leadsFound} leads found`);
    },
    onError: (error) => {
      toast.error(error.message || "Scan failed");
    },
  });

  const handleScan = async () => {
    await scanMutation.mutateAsync();
  };

  const filteredLeads = leads?.filter((lead) => {
    const budgetNum = lead.budget ? Number(lead.budget) : 0;
    const budgetMatch = !budgetFilter || budgetNum >= budgetFilter;
    const sourceMatch = sourceFilter === "all" || lead.source === sourceFilter;
    return budgetMatch && sourceMatch;
  });

  const sources = Array.from(new Set(leads?.map((l) => l.source) || []));

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">FETCHER LEAD SCANNER</h1>
            <p className="text-muted-foreground">
              Scan Reddit, Upwork, and Fiverr for qualified leads with real-time filtering.
            </p>
          </div>

          {/* Scan Controls */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>Scan Configuration</CardTitle>
              <CardDescription>
                Trigger a scan across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Min Budget ($)</label>
                  <input
                    type="number"
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(Number(e.target.value))}
                    className="cyber-input w-full mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="cyber-input w-full mt-1"
                  >
                    <option value="all">All Sources</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    className="cyber-button w-full"
                  >
                    <Zap size={16} className="mr-2" />
                    {scanMutation.isPending ? "Scanning..." : "Scan Now"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {filteredLeads?.length || 0} Leads Found
              </h2>
              <div className="text-sm text-muted-foreground">
                {leads?.length || 0} total
              </div>
            </div>

            {filteredLeads && filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredLeads.map((lead, idx) => (
                  <Card key={idx} className="cyber-panel">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <h3 className="font-bold text-lg mb-2 line-clamp-2">
                            {lead.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {lead.deliverable}
                          </p>
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors"
                          >
                            <ExternalLink size={14} />
                            View on {lead.source}
                          </a>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            Budget
                          </div>
                          <div className="text-2xl font-bold text-accent">
                            ${lead.budget ? Number(lead.budget).toFixed(2) : "N/A"}
                          </div>
                          {lead.estimatedHourlyRate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ~${lead.estimatedHourlyRate}/hr
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            Posted
                          </div>
                          <div className="text-sm">
                            {lead.postedAt
                              ? new Date(lead.postedAt).toLocaleDateString()
                              : "Recently"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="inline-block px-2 py-1 bg-primary/20 text-primary rounded">
                              {lead.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="cyber-panel flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                  {isLoading ? "Loading leads..." : "No leads found. Try scanning."}
                </div>
              </Card>
            )}
          </div>

          {/* Qualification Info */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>Lead Qualification Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Budget: $50 or higher</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Posted within last 4 hours</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Clear project description</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Verified client account</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
