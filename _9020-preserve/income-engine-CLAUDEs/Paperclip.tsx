import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Link as LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { DelegationModal } from "@/components/DelegationModal";
import { DelegationHistory } from "@/components/DelegationHistory";
import { AgentWorkload } from "@/components/AgentWorkload";

export default function Paperclip() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: config } = trpc.paperclip.getConfig.useQuery(undefined);
  const connectMutation = trpc.paperclip.connect.useMutation({
    onSuccess: () => {
      toast.success("Connected to Paperclip");
      setApiUrl("");
      setApiKey("");
      setCompanyId("");
    },
    onError: (error) => {
      toast.error(error.message || "Connection failed");
    },
  });

  const updateAgentMutation = trpc.paperclip.updateAgentId.useMutation({
    onSuccess: () => {
      toast.success("Agent updated");
    },
  });

  const handleConnect = async () => {
    if (!apiUrl || !apiKey || !companyId) {
      toast.error("Please fill in all fields");
      return;
    }
    await connectMutation.mutateAsync({
      apiUrl,
      apiKey,
      companyId,
    });
    setRefreshKey((k) => k + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Simulate polling for agent status
  useEffect(() => {
    if (!config?.isConnected) return;

    const pollInterval = setInterval(() => {
      // TODO: Implement actual polling from Paperclip API
      setAgentStatus({
        status: "online",
        lastHeartbeat: new Date(),
        budget: 1250.5,
        tasksCompleted: 42,
      });
    }, 10000); // 10 second intervals

    return () => clearInterval(pollInterval);
  }, [config?.isConnected]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">PAPERCLIP INTEGRATION</h1>
            <p className="text-muted-foreground">
              Connect and manage your Paperclip organization and agents.
            </p>
          </div>

          {/* Connection Status */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              {config?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary rounded-lg">
                    <div>
                      <div className="font-bold text-primary">Connected</div>
                      <div className="text-sm text-muted-foreground">
                        Company: {config.companyId}
                      </div>
                    </div>
                    <div className="text-primary">●</div>
                  </div>

                  {config.agentId && (
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Registered Agent
                      </div>
                      <div className="font-mono text-sm">{config.agentId}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-card border border-border rounded-lg text-center text-muted-foreground">
                  Not connected. Configure below.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Enter your Paperclip API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">API URL</label>
                <Input
                  placeholder="https://api.paperclip.ai"
                  value={apiUrl || config?.apiUrl || ""}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="cyber-input mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">API Key</label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="cyber-input mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Company ID</label>
                <Input
                  placeholder="Your company ID"
                  value={companyId || config?.companyId || ""}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="cyber-input mt-1"
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="cyber-button w-full"
              >
                <LinkIcon size={16} className="mr-2" />
                {connectMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </CardContent>
          </Card>

          {/* Agent Status */}
          {config?.isConnected && agentStatus && (
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Agent Status
                  <button
                    onClick={handleRefresh}
                    className="p-1 hover:bg-border rounded transition-colors"
                  >
                    <RefreshCw size={16} className={isPolling ? "animate-spin" : ""} />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-input rounded-lg">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-bold text-primary mt-1">
                      {agentStatus.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-3 bg-input rounded-lg">
                    <div className="text-xs text-muted-foreground">Budget</div>
                    <div className="font-bold text-secondary mt-1">
                      ${agentStatus.budget?.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-input rounded-lg">
                    <div className="text-xs text-muted-foreground">Tasks Done</div>
                    <div className="font-bold text-accent mt-1">
                      {agentStatus.tasksCompleted}
                    </div>
                  </div>

                  <div className="p-3 bg-input rounded-lg">
                    <div className="text-xs text-muted-foreground">Last Heartbeat</div>
                    <div className="font-bold text-primary mt-1">
                      {agentStatus.lastHeartbeat
                        ? new Date(agentStatus.lastHeartbeat).toLocaleTimeString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Delegation */}
          {config?.isConnected && config.agentId && (
            <>
              <Card className="cyber-panel">
                <CardHeader>
                  <CardTitle>Delegate Task</CardTitle>
                  <CardDescription>
                    Send a task to your connected Paperclip agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DelegationModal agentId={config.agentId} />
                </CardContent>
              </Card>

              {/* Agent Workload */}
              <AgentWorkload agentId={config.agentId} />

              {/* Delegation History */}
              <DelegationHistory agentId={config.agentId} />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
