import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Globe, 
  Plus, 
  Copy,
  Check,
  Key,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PlatformHub() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    name: "",
    webhook_url: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/platforms`);
      setPlatforms(res.data);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      toast.error("Failed to load platforms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPlatformStats = async (platformId) => {
    setLoadingStats(true);
    setSelectedPlatform(platformId);
    try {
      const res = await axios.get(`${API}/platforms/${platformId}/stats`);
      setPlatformStats(res.data);
    } catch (error) {
      toast.error("Failed to load platform stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreatePlatform = async () => {
    if (!newPlatform.name) {
      toast.error("Please enter a platform name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/platforms`, newPlatform);
      toast.success(`Platform created! API Key: ${res.data.api_key}`);
      setDialogOpen(false);
      setNewPlatform({ name: "", webhook_url: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to create platform");
    } finally {
      setSubmitting(false);
    }
  };

  const copyApiKey = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("API key copied!");
  };

  const totalLeads = platforms.reduce((sum, p) => sum + p.leads_sent, 0);
  const activePlatforms = platforms.filter(p => p.active).length;

  const chartData = platforms.map(p => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
    leads: p.leads_sent
  }));

  return (
    <div className="space-y-8" data-testid="platform-hub-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Multi-Platform Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect all your apps to feed leads into this central CRM
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="connect-platform-btn">
                <Plus className="w-4 h-4 mr-2" />
                Connect Platform
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="connect-platform-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading">Connect a Platform</DialogTitle>
                <DialogDescription>Register a new app to send leads to this CRM</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Platform Name *</Label>
                  <Input
                    value={newPlatform.name}
                    onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                    placeholder="My App Name"
                    data-testid="platform-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL (Optional)</Label>
                  <Input
                    value={newPlatform.webhook_url}
                    onChange={(e) => setNewPlatform({ ...newPlatform, webhook_url: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                    data-testid="platform-webhook-input"
                  />
                  <p className="text-xs text-muted-foreground">Receive updates when leads are processed</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreatePlatform}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="submit-platform-btn"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card" data-testid="stat-total-platforms">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold">{platforms.length}</p>
                <p className="text-sm text-muted-foreground">Connected Platforms</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-active-platforms">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-green-600">{activePlatforms}</p>
                <p className="text-sm text-muted-foreground">Active Platforms</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-total-leads">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-accent">{totalLeads.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Leads Received</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {platforms.length > 0 && (
        <Card className="content-card" data-testid="leads-chart">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Leads by Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(145, 26%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platforms List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : platforms.length === 0 ? (
        <Card className="content-card">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No platforms connected yet. Connect your first platform!</p>
            <p className="text-sm">Your apps can send leads to this CRM using the API.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform, index) => (
            <Card key={platform.id} className="content-card" data-testid={`platform-card-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-heading text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.leads_sent.toLocaleString()} leads sent</CardDescription>
                    </div>
                  </div>
                  <Badge className={platform.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {platform.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <Key className="w-3 h-3" /> API Key
                    </Label>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-background p-2 rounded truncate font-mono">
                        {platform.api_key}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyApiKey(platform.api_key, platform.id)}
                        data-testid={`copy-key-${index}`}
                      >
                        {copiedId === platform.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fetchPlatformStats(platform.id)}
                    data-testid={`view-stats-${index}`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Detailed Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Platform Stats Dialog */}
      {platformStats && (
        <Dialog open={!!platformStats} onOpenChange={() => setPlatformStats(null)}>
          <DialogContent data-testid="platform-stats-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading">{platformStats.platform} - Analytics</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {loadingStats ? (
                <Skeleton className="h-32" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-heading font-semibold">{platformStats.total_leads}</p>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-heading font-semibold text-green-600">{platformStats.conversion_rate}%</p>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lead Status Breakdown</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(platformStats.status_breakdown || {}).map(([status, count]) => (
                        <div key={status} className="p-2 rounded bg-muted/50 text-center">
                          <p className="font-semibold">{count}</p>
                          <p className="text-xs text-muted-foreground capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm font-medium">Average Lead Score</p>
                    <p className="text-2xl font-heading font-semibold text-primary">
                      {Math.round(platformStats.avg_score || 0)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Integration Guide */}
      <Card className="content-card" data-testid="integration-guide">
        <CardHeader>
          <CardTitle className="font-heading text-lg">API Integration Guide</CardTitle>
          <CardDescription>Send leads from your apps to this CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium mb-2 block">Endpoint</Label>
              <code className="text-sm bg-background p-2 rounded block">
                POST {API}/platforms/ingest
              </code>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Label className="text-sm font-medium mb-2 block">Example Request</Label>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`curl -X POST "${API}/platforms/ingest?api_key=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "city": "New York",
    "interests": ["Environmental", "Education"]
  }'`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
