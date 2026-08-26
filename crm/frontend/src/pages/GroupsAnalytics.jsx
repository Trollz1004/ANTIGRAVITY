import { useState, useEffect } from "react";
import axios from "axios";
import { 
  UsersRound, 
  Search, 
  Filter, 
  Plus,
  TrendingUp,
  MessageSquare,
  Activity,
  Loader2,
  Flame
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VOLUNTEER_IMAGE = "https://images.unsplash.com/photo-1758599668547-2b1192c10abb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHx2b2x1bnRlZXIlMjBncm91cCUyMGRpdmVyc2V8ZW58MHx8fHwxNzc3NTk2MzUxfDA&ixlib=rb-4.1.0&q=85";

export default function GroupsAnalytics() {
  const [groups, setGroups] = useState([]);
  const [trendingGroups, setTrendingGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("members");

  // New group form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    city: "",
    category: "",
    members: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, trendingRes, catRes, cityRes] = await Promise.all([
        axios.get(`${API}/groups`, { params: { sort_by: sortBy } }),
        axios.get(`${API}/groups/trending`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/cities`, { params: { limit: 20 } }),
      ]);
      setGroups(groupsRes.data);
      setTrendingGroups(trendingRes.data);
      setCategories(catRes.data.categories);
      setCities(cityRes.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || group.category === categoryFilter;
    const matchesCity = cityFilter === "all" || group.city === cityFilter;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.city || !newGroup.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/groups`, newGroup);
      toast.success("Group created successfully!");
      setDialogOpen(false);
      setNewGroup({
        name: "",
        city: "",
        category: "",
        members: 0,
      });
      fetchData();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare chart data
  const categoryData = categories
    .map((cat) => ({
      name: cat.length > 12 ? cat.substring(0, 12) + "..." : cat,
      groups: groups.filter((g) => g.category === cat).length,
    }))
    .filter((d) => d.groups > 0)
    .sort((a, b) => b.groups - a.groups)
    .slice(0, 8);

  const uniqueCities = [...new Set(groups.map((g) => g.city))].filter(Boolean);

  // Stats
  const totalMembers = groups.reduce((sum, g) => sum + g.members, 0);
  const totalPosts = groups.reduce((sum, g) => sum + g.posts, 0);
  const avgEngagement =
    groups.length > 0
      ? (groups.reduce((sum, g) => sum + g.engagement_rate, 0) / groups.length).toFixed(1)
      : 0;

  return (
    <div className="space-y-8" data-testid="groups-analytics-page">
      {/* Header with Hero */}
      <div className="relative rounded-2xl overflow-hidden" data-testid="groups-hero">
        <img
          src={VOLUNTEER_IMAGE}
          alt="Volunteer group"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">
              Groups Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track performance of volunteer groups and threads
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="add-group-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-group-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading">Create New Group</DialogTitle>
                <DialogDescription>
                  Add a new volunteer group to track
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name *</Label>
                  <Input
                    id="group-name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Austin Environmental Volunteers"
                    data-testid="group-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-city">City *</Label>
                  <Select
                    value={newGroup.city}
                    onValueChange={(value) => setNewGroup({ ...newGroup, city: value })}
                  >
                    <SelectTrigger id="group-city" data-testid="group-city-select">
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
                  <Label htmlFor="group-category">Category *</Label>
                  <Select
                    value={newGroup.category}
                    onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}
                  >
                    <SelectTrigger id="group-category" data-testid="group-category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-members">Initial Members</Label>
                  <Input
                    id="group-members"
                    type="number"
                    min={0}
                    value={newGroup.members}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, members: parseInt(e.target.value) || 0 })
                    }
                    data-testid="group-members-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="submit-group-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Groups"
          value={groups.length}
          icon={UsersRound}
          loading={loading}
          testId="stat-total-groups"
        />
        <StatCard
          label="Total Members"
          value={totalMembers.toLocaleString()}
          icon={UsersRound}
          loading={loading}
          testId="stat-total-members"
        />
        <StatCard
          label="Total Posts"
          value={totalPosts.toLocaleString()}
          icon={MessageSquare}
          loading={loading}
          testId="stat-total-posts"
        />
        <StatCard
          label="Avg Engagement"
          value={`${avgEngagement}%`}
          icon={Activity}
          loading={loading}
          testId="stat-avg-engagement"
        />
      </div>

      {/* Trending Groups */}
      <Card className="content-card" data-testid="trending-groups-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            Trending Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : trendingGroups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No trending groups yet. Seed sample data from the dashboard.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {trendingGroups.slice(0, 5).map((group, index) => (
                <div
                  key={group.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
                  data-testid={`trending-group-${index}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-heading font-semibold text-primary">
                      #{index + 1}
                    </span>
                    <Badge variant="outline" className="badge-muted text-xs">
                      {group.category}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{group.name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{group.members.toLocaleString()} members</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      {group.trending_score.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="content-card" data-testid="category-chart-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg">Groups by Category</CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          {loading ? (
            <Skeleton className="w-full h-64" />
          ) : categoryData.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No groups data available
            </p>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="groups" fill="hsl(145, 26%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="group-search-input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="category-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="city-filter">
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-40" data-testid="sort-by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="members">Members</SelectItem>
            <SelectItem value="posts">Posts</SelectItem>
            <SelectItem value="engagement_rate">Engagement</SelectItem>
            <SelectItem value="trending_score">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Groups Table */}
      <Card className="content-card" data-testid="groups-table-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-primary" />
            All Groups ({filteredGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No groups found. Try adjusting your filters or add a new group.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead className="text-right">Trending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group, index) => (
                    <TableRow key={group.id} data-testid={`group-row-${index}`}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {group.name}
                      </TableCell>
                      <TableCell>{group.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="badge-muted">
                          {group.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {group.members.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{group.posts}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            group.engagement_rate > 5
                              ? "text-green-600"
                              : group.engagement_rate > 2
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {group.engagement_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          {group.trending_score.toFixed(0)}
                        </div>
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

function StatCard({ label, value, icon: Icon, loading, testId }) {
  return (
    <Card className="stat-card" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <p className="text-2xl font-heading font-semibold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
