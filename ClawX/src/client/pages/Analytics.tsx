import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, Sparkles, Search, Zap, Server, TrendingUp, DollarSign, Clock, Hash } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const providerIcons: Record<string, React.ElementType> = {
  manus: Bot,
  claude: Brain,
  gemini: Sparkles,
  perplexity: Search,
  grok: Zap,
  ollama: Server,
};

const providerColors: Record<string, string> = {
  manus: '#6366f1',
  claude: '#d97706',
  gemini: '#4285f4',
  perplexity: '#22c55e',
  grok: '#ef4444',
  ollama: '#8b5cf6',
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.stats.useQuery();
  const { data: timeline } = trpc.analytics.timeline.useQuery({ days: 7 });

  const totalRequests = stats?.reduce((sum, s) => sum + Number(s.totalRequests ?? 0), 0) ?? 0;
  const totalTokens =
    stats?.reduce((sum, s) => sum + Number(s.totalInputTokens ?? 0) + Number(s.totalOutputTokens ?? 0), 0) ?? 0;
  const totalCost = stats?.reduce((sum, s) => sum + Number(s.totalCost ?? 0), 0) ?? 0;
  const avgResponseTime = stats?.length
    ? stats.reduce((sum, s) => sum + Number(s.avgResponseTime ?? 0), 0) / stats.length
    : 0;

  // Prepare pie chart data
  const pieData =
    stats?.map((s) => ({
      name: s.providerSlug,
      value: Number(s.totalRequests ?? 0),
      color: providerColors[s.providerSlug ?? ''] ?? '#6366f1',
    })) ?? [];

  // Prepare bar chart data from timeline
  const barData =
    timeline?.reduce((acc: any[], item) => {
      const existing = acc.find((d) => d.date === item.date);
      if (existing) {
        existing[item.providerSlug ?? 'unknown'] = Number(item.totalTokens ?? 0);
      } else {
        acc.push({
          date: item.date,
          [item.providerSlug ?? 'unknown']: Number(item.totalTokens ?? 0),
        });
      }
      return acc;
    }, []) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track token usage, response times, and costs across all AI providers.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
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
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{(avgResponseTime / 1000).toFixed(1)}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Usage Over Time */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Token Usage (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0 0)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'oklch(0.6 0 0)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'oklch(0.6 0 0)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.178 0 0)',
                      border: '1px solid oklch(0.28 0 0)',
                      borderRadius: '8px',
                      color: 'oklch(0.95 0 0)',
                    }}
                  />
                  {Object.keys(providerColors).map((slug) => (
                    <Bar key={slug} dataKey={slug} fill={providerColors[slug]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                No usage data yet. Start chatting to see analytics.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests by Provider */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Requests by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.178 0 0)',
                      border: '1px solid oklch(0.28 0 0)',
                      borderRadius: '8px',
                      color: 'oklch(0.95 0 0)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                No usage data yet. Start chatting to see analytics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provider Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && stats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Provider</th>
                    <th className="text-right py-3 px-2 font-medium">Requests</th>
                    <th className="text-right py-3 px-2 font-medium">Input Tokens</th>
                    <th className="text-right py-3 px-2 font-medium">Output Tokens</th>
                    <th className="text-right py-3 px-2 font-medium">Avg Time</th>
                    <th className="text-right py-3 px-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => {
                    const Icon = providerIcons[stat.providerSlug ?? ''] ?? Bot;
                    const color = providerColors[stat.providerSlug ?? ''] ?? '#6366f1';
                    return (
                      <tr
                        key={stat.providerSlug}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color }} />
                            <span className="capitalize font-medium">{stat.providerSlug}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{Number(stat.totalRequests ?? 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{Number(stat.totalInputTokens ?? 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{Number(stat.totalOutputTokens ?? 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-2">
                          {(Number(stat.avgResponseTime ?? 0) / 1000).toFixed(1)}s
                        </td>
                        <td className="text-right py-3 px-2">${Number(stat.totalCost ?? 0).toFixed(4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No usage data yet. Start chatting to see provider breakdown.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
