import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, 
  UsersRound, 
  FileText, 
  MapPin,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Mail,
  Flame,
  Target,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHART_COLORS = [
  "hsl(145, 26%, 39%)",
  "hsl(16, 66%, 60%)",
  "hsl(210, 65%, 60%)",
  "hsl(43, 74%, 49%)",
  "hsl(280, 60%, 55%)",
];

const FUNNEL_COLORS = ["#4A7B59", "#5C9A6E", "#7AB889", "#A8D5BA", "#D4EFE0"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cityStats, setCityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, cityRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/cities/stats`),
      ]);
      setStats(dashboardRes.data);
      setCityStats(cityRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      const res = await axios.post(`${API}/seed`);
      toast.success(`Seeded ${res.data.groups_created} groups and ${res.data.leads_created} leads`);
      fetchData();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const regionData = cityStats?.regions
    ? Object.entries(cityStats.regions).map(([name, data]) => ({
        name,
        cities: data.count,
        population: Math.round(data.population / 1000000),
      }))
    : [];

  const topCitiesData = cityStats?.top_5?.map((city) => ({
    name: city.name,
    population: Math.round(city.population / 1000000),
  })) || [];

  const funnelData = stats?.lead_funnel
    ? Object.entries(stats.lead_funnel).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Lead Generation CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate outreach, track conversions, grow your community
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={seedData}
            disabled={seeding}
            className="bg-primary hover:bg-primary/90"
            data-testid="seed-data-btn"
          >
            <Sparkles className={`w-4 h-4 mr-2 ${seeding ? "animate-pulse" : ""}`} />
            Seed Sample Data
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={Users}
          loading={loading}
          testId="stat-total-leads"
        />
        <StatCard
          title="Hot Leads"
          value={stats?.hot_leads || 0}
          icon={Flame}
          color="accent"
          loading={loading}
          testId="stat-hot-leads"
        />
        <StatCard
          title="Email Campaigns"
          value={stats?.total_campaigns || 0}
          icon={Mail}
          loading={loading}
          testId="stat-campaigns"
        />
        <StatCard
          title="Drip Sequences"
          value={stats?.total_sequences || 0}
          icon={Target}
          loading={loading}
          testId="stat-sequences"
        />
      </div>

      {/* Email Stats */}
      {stats?.email_stats && (
        <Card className="content-card" data-testid="email-stats-card">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-heading font-semibold">{stats.email_stats.sent}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-heading font-semibold text-green-600">{stats.email_stats.opened}</p>
                <p className="text-sm text-muted-foreground">Opened</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-heading font-semibold text-primary">{stats.email_stats.open_rate}%</p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Funnel & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel */}
        <Card className="content-card" data-testid="lead-funnel-card">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg">Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : funnelData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No lead data yet. Seed sample data to see the funnel.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funnelData.map((item, index) => (
                  <div key={item.name} className="relative">
                    <div 
                      className="h-10 rounded-lg flex items-center px-4 text-white font-medium"
                      style={{ 
                        backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                        width: `${Math.max(20, 100 - index * 15)}%`
                      }}
                    >
                      {item.name}: {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Distribution */}
        <Card className="content-card" data-testid="region-chart-card">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg">Cities by Region</CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="cities" 
                      fill="hsl(145, 26%, 39%)" 
                      radius={[4, 4, 0, 0]}
                      name="Number of Cities"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="content-card" data-testid="quick-actions-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <QuickActionCard
              title="Manage Leads"
              description="View & score leads"
              href="/leads"
              icon={Users}
              testId="quick-action-leads"
            />
            <QuickActionCard
              title="Email Campaigns"
              description="Create & send emails"
              href="/campaigns"
              icon={Mail}
              testId="quick-action-campaigns"
            />
            <QuickActionCard
              title="Social Capture"
              description="Lead capture forms"
              href="/social"
              icon={Target}
              testId="quick-action-social"
            />
            <QuickActionCard
              title="AI Content"
              description="Generate posts"
              href="/content"
              icon={Sparkles}
              testId="quick-action-content"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, testId, color = "primary" }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  };
  
  return (
    <Card className="stat-card" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                <p className="stat-label">{title}</p>
              </>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ title, description, href, icon: Icon, testId }) {
  return (
    <a 
      href={href}
      className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:-translate-y-0.5 transition-all duration-200"
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </a>
  );
}
