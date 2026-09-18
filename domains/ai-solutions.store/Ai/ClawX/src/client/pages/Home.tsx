import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { Bot, Brain, Sparkles, Search, Zap, Code2, MessageSquare, BarChart3, Radio, Shield, Server } from 'lucide-react';

const providerIcons: Record<string, React.ElementType> = {
  manus: Bot,
  claude: Brain,
  gemini: Sparkles,
  perplexity: Search,
  grok: Zap,
  codex: Code2,
};

const providerColors: Record<string, string> = {
  manus: '#6366f1',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#22c55e',
  grok: '#ef4444',
  codex: '#10b981',
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: providers, isLoading: providersLoading } = trpc.providers.list.useQuery();
  const { data: stats } = trpc.analytics.stats.useQuery();
  const { data: operationalIntegrations } = trpc.operational.status.useQuery(undefined, { refetchInterval: 15_000 });

  const availableCount = providers?.filter((p) => p.isAvailable).length ?? 0;
  const totalRequests = stats?.reduce((sum, s) => sum + Number(s.totalRequests ?? 0), 0) ?? 0;
  const totalTokens =
    stats?.reduce((sum, s) => sum + Number(s.totalInputTokens ?? 0) + Number(s.totalOutputTokens ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your AI fleet from one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">
                  {availableCount}
                  <span className="text-sm text-muted-foreground font-normal">/6</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Iron Wall</p>
                <p className="text-2xl font-bold text-green-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Operational Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {operationalIntegrations?.map((integration) => {
            const connected = integration.status === 'connected';
            const configured = integration.status !== 'not-configured';
            return (
              <Card key={integration.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.detail}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        connected
                          ? 'border-green-500/30 text-green-500'
                          : configured
                            ? 'border-red-500/30 text-red-500'
                            : 'border-amber-500/30 text-amber-500'
                      }
                    >
                      {integration.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last seen:{' '}
                    {integration.lastSeen ? new Date(integration.lastSeen).toLocaleString() : 'No verified response yet'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Provider Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">AI Fleet Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers?.map((provider) => {
            const Icon = providerIcons[provider.slug] ?? Bot;
            const color = providerColors[provider.slug] ?? '#6366f1';
            return (
              <Card key={provider.slug} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.defaultModel}</p>
                      </div>
                    </div>
                    <Badge
                      variant={provider.isAvailable ? 'default' : 'secondary'}
                      className={provider.isAvailable ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                    >
                      {provider.isAvailable ? 'Ready' : 'No Key'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{provider.type}</span>
                    <span>·</span>
                    <span>{provider.costPerInputToken > 0 ? `$${provider.costPerInputToken}/1K in` : 'Free'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setLocation('/chat')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Chat</p>
                <p className="text-xs text-muted-foreground">Start a conversation with any AI</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setLocation('/chat?mode=broadcast')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="font-medium">Broadcast Mode</p>
                <p className="text-xs text-muted-foreground">Send one prompt to all AIs at once</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setLocation('/analytics')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="font-medium">View Analytics</p>
                <p className="text-xs text-muted-foreground">Token usage, costs, and performance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
