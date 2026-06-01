import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Zap, Users, Target, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PaperclipIntegration() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [paperclipApiUrl, setPaperclipApiUrl] = useState("");
  const [paperclipApiKey, setPaperclipApiKey] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Add tRPC procedures for Paperclip integration
  // const connectPaperclipMutation = trpc.paperclip.connect.useMutation();
  // const getAgentsMutation = trpc.paperclip.getAgents.useMutation();
  // const getTasksMutation = trpc.paperclip.getTasks.useMutation();

  const handleConnect = async () => {
    if (!paperclipApiUrl || !paperclipApiKey || !companyId) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call tRPC mutation to connect to Paperclip
      // await connectPaperclipMutation.mutateAsync({
      //   apiUrl: paperclipApiUrl,
      //   apiKey: paperclipApiKey,
      //   companyId,
      // });
      setIsConnected(true);
      toast.success("Connected to Paperclip!");
    } catch (error) {
      toast.error("Failed to connect to Paperclip");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadAgents = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC mutation to load agents
      // const result = await getAgentsMutation.mutateAsync({ companyId });
      // setAgents(result);
      toast.success("Agents loaded");
    } catch (error) {
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTasks = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC mutation to load tasks
      // const result = await getTasksMutation.mutateAsync({ companyId });
      // setTasks(result);
      toast.success("Tasks loaded");
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="text-accent hover:bg-accent/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-accent neon-glow" />
            <h1 className="text-3xl font-bold neon-glow">Paperclip Integration</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Connection Status */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Connection Status
              </h2>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isConnected
                    ? "bg-accent/20 text-accent border border-accent"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </div>
            </div>

            {!isConnected ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paperclip-url" className="text-foreground">
                    Paperclip API URL
                  </Label>
                  <Input
                    id="paperclip-url"
                    value={paperclipApiUrl}
                    onChange={(e) => setPaperclipApiUrl(e.target.value)}
                    placeholder="https://your-paperclip-instance.com/api"
                    className="bg-input border-border mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="paperclip-key" className="text-foreground">
                    API Key
                  </Label>
                  <Input
                    id="paperclip-key"
                    value={paperclipApiKey}
                    onChange={(e) => setPaperclipApiKey(e.target.value)}
                    type="password"
                    placeholder="pk_..."
                    className="bg-input border-border mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="company-id" className="text-foreground">
                    Company ID
                  </Label>
                  <Input
                    id="company-id"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="comp_..."
                    className="bg-input border-border mt-2"
                  />
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Connect to Paperclip
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Connected to Paperclip instance
                </p>
                <p className="text-muted-foreground">Company ID: {companyId}</p>
                <Button
                  onClick={() => setIsConnected(false)}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </Card>

          {isConnected && (
            <>
              {/* Agents Section */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Agents ({agents.length})
                  </h2>
                  <Button
                    onClick={handleLoadAgents}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="sm"
                  >
                    Refresh
                  </Button>
                </div>

                {agents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No agents found</p>
                ) : (
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="p-3 bg-muted/50 rounded border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-xs text-muted-foreground">{agent.role}</p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              agent.status === "active"
                                ? "bg-accent/20 text-accent"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {agent.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Budget: ${agent.budget} | Spent: ${agent.spent}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Tasks Section */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Tasks ({tasks.length})
                  </h2>
                  <Button
                    onClick={handleLoadTasks}
                    disabled={isLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="sm"
                  >
                    Refresh
                  </Button>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tasks found</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-muted/50 rounded border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                              task.status === "completed"
                                ? "bg-accent/20 text-accent"
                                : task.status === "in_progress"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                          <span>Assigned to: {task.assignedTo}</span>
                          <span>Budget: ${task.budget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Company Goals Section */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  Company Goals
                </h2>
                <div className="p-4 bg-muted/50 rounded border border-border text-sm text-muted-foreground">
                  <p>Goal alignment and tracking coming soon...</p>
                </div>
              </Card>

              {/* Org Chart Section */}
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-accent" />
                  Organization Chart
                </h2>
                <div className="p-4 bg-muted/50 rounded border border-border text-sm text-muted-foreground">
                  <p>Organization hierarchy visualization coming soon...</p>
                </div>
              </Card>
            </>
          )}

          {/* Info Section */}
          <Card className="p-6 bg-muted/50 border-border">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">About Paperclip Integration</p>
                <p>
                  OpenClaw integrates with Paperclip to enable seamless agent coordination,
                  task delegation, budget tracking, and company goal alignment. Connect your
                  Paperclip instance to manage your autonomous team directly from OpenClaw.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
