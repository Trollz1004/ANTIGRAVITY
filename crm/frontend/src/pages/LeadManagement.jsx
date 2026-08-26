import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Download,
  TrendingUp,
  Mail,
  MapPin,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  converted: "bg-purple-100 text-purple-700",
};

const CHART_COLORS = ["#4A7B59", "#D97757", "#4A90E2", "#D4AF37"];

export default function LeadManagement() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  
  // New lead form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    city: "",
    interests: [],
    source: "website",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes, catRes, cityRes] = await Promise.all([
        axios.get(`${API}/leads`),
        axios.get(`${API}/leads/stats/overview`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/cities`, { params: { limit: 20 } }),
      ]);
      setLeads(leadsRes.data);
      setStats(statsRes.data);
      setCategories(catRes.data.categories);
      setCities(cityRes.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesCity = cityFilter === "all" || lead.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const statusChartData = stats?.by_status
    ? Object.entries(stats.by_status).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const cityChartData = stats?.by_city?.slice(0, 5) || [];

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, newLead);
      toast.success("Lead created successfully!");
      setDialogOpen(false);
      setNewLead({
        name: "",
        email: "",
        city: "",
        interests: [],
        source: "website",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const exportLeads = () => {
    const csv = [
      ["Name", "Email", "City", "Interests", "Score", "Status", "Source"].join(","),
      ...filteredLeads.map((lead) =>
        [
          lead.name,
          lead.email,
          lead.city,
          lead.interests.join(";"),
          lead.score,
          lead.status,
          lead.source,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_export.csv";
    a.click();
    toast.success("Leads exported successfully!");
  };

  const uniqueCities = [...new Set(leads.map((l) => l.city))].filter(Boolean);

  return (
    <div className="space-y-8" data-testid="lead-management-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Lead Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage potential volunteers and supporters
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportLeads} data-testid="export-leads-btn">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="add-lead-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-lead-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Lead</DialogTitle>
                <DialogDescription>
                  Capture a new lead for your volunteer platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Name *</Label>
                  <Input
                    id="lead-name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="John Doe"
                    data-testid="lead-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@example.com"
                    data-testid="lead-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-city">City *</Label>
                  <Select
                    value={newLead.city}
                    onValueChange={(value) => setNewLead({ ...newLead, city: value })}
                  >
                    <SelectTrigger id="lead-city" data-testid="lead-city-select">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}, {c.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-source">Source</Label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  >
                    <SelectTrigger id="lead-source" data-testid="lead-source-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLead}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="submit-lead-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Lead"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={stats?.total || 0}
          icon={Users}
          loading={loading}
          testId="stat-total-leads"
        />
        <StatCard
          label="New"
          value={stats?.by_status?.new || 0}
          icon={Plus}
          color="blue"
          loading={loading}
          testId="stat-new-leads"
        />
        <StatCard
          label="Qualified"
          value={stats?.by_status?.qualified || 0}
          icon={TrendingUp}
          color="green"
          loading={loading}
          testId="stat-qualified-leads"
        />
        <StatCard
          label="Converted"
          value={stats?.by_status?.converted || 0}
          icon={Users}
          color="purple"
          loading={loading}
          testId="stat-converted-leads"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="content-card" data-testid="status-chart-card">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="content-card" data-testid="city-chart-card">
          <CardHeader className="content-card-header">
            <CardTitle className="font-heading text-lg">Top Cities by Leads</CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="city"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(16, 66%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="lead-search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="city-filter">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {uniqueCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card className="content-card" data-testid="leads-table-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leads found. Try adjusting your filters or add a new lead.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead, index) => (
                    <TableRow key={lead.id} data-testid={`lead-row-${index}`}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {lead.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-2 rounded-full bg-muted overflow-hidden"
                            title={`Score: ${lead.score}`}
                          >
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{lead.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[lead.status]}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {lead.source}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, loading, testId, color = "primary" }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Card className="stat-card" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <p className="text-2xl font-heading font-semibold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
