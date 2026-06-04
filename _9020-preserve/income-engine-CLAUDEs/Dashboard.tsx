import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, Zap, AlertCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: sessions } = trpc.chat.listSessions.useQuery(undefined);
  const { data: tasks } = trpc.manus.listTasks.useQuery(undefined);
  const { data: leads } = trpc.fetcher.getLeads.useQuery({});

  const stats = [
    {
      title: "Active Sessions",
      value: sessions?.length || 0,
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Manus Tasks",
      value: tasks?.length || 0,
      icon: Zap,
      color: "text-secondary",
    },
    {
      title: "Qualified Leads",
      value: leads?.length || 0,
      icon: AlertCircle,
      color: "text-accent",
    },
    {
      title: "Last Activity",
      value: "Now",
      icon: Clock,
      color: "text-primary",
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">
              OPENCLAW COMMAND CENTER
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || "Agent"}. Your AI operations hub is online.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} className="cyber-panel">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="cyber-panel lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Launch your AI operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setLocation("/chat")}
                  className="cyber-button w-full"
                >
                  Start Chat Session
                </Button>
                <Button
                  onClick={() => setLocation("/agents")}
                  className="cyber-button-secondary w-full"
                >
                  Launch Agents
                </Button>
                <Button
                  onClick={() => setLocation("/leads")}
                  className="cyber-button w-full"
                >
                  Scan for Leads
                </Button>
              </CardContent>
            </Card>

            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-bold text-primary">ONLINE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <span className="text-sm font-bold text-secondary">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-bold text-accent">100%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          {sessions && sessions.length > 0 && (
            <Card className="cyber-panel">
              <CardHeader>
                <CardTitle>Recent Chat Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-input rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                      onClick={() => setLocation("/chat")}
                    >
                      <span className="text-sm">{session.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
