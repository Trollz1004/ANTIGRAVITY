import { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Search, Filter, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

const CITY_IMAGE = "https://images.unsplash.com/photo-1721322567303-a68c83264858?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxjaXR5JTIwc2t5bGluZSUyMGRheWxpZ2h0fGVufDB8fHx8MTc3NzU5NjM1MXww&ixlib=rb-4.1.0&q=85";

const REGIONS = ["All", "Northeast", "South", "Midwest", "West"];

export default function CityAnalytics() {
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    try {
      const region = selectedRegion === "All" ? "" : selectedRegion;
      const [citiesRes, statsRes] = await Promise.all([
        axios.get(`${API}/cities`, { params: { region: region || undefined } }),
        axios.get(`${API}/cities/stats`),
      ]);
      setCities(citiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load city data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRegion]);

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regionChartData = stats?.regions
    ? Object.entries(stats.regions).map(([name, data]) => ({
        name,
        population: Math.round(data.population / 1000000),
      }))
    : [];

  return (
    <div className="space-y-8" data-testid="city-analytics-page">
      {/* Header with Hero Image */}
      <div className="relative rounded-2xl overflow-hidden" data-testid="city-hero">
        <img 
          src={CITY_IMAGE} 
          alt="City skyline" 
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground">
            City Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore population data for top {stats?.total_cities || 50} US cities
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Population"
          value={stats ? `${Math.round(stats.total_population / 1000000)}M` : "-"}
          loading={loading}
          testId="stat-total-pop"
        />
        <StatCard
          label="Cities Tracked"
          value={stats?.total_cities || 0}
          loading={loading}
          testId="stat-cities-tracked"
        />
        <StatCard
          label="Regions"
          value={Object.keys(stats?.regions || {}).length}
          loading={loading}
          testId="stat-regions"
        />
        <StatCard
          label="Avg Population"
          value={stats ? `${Math.round(stats.total_population / stats.total_cities / 1000)}K` : "-"}
          loading={loading}
          testId="stat-avg-pop"
        />
      </div>

      {/* Region Chart */}
      <Card className="content-card" data-testid="region-pop-chart">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Population by Region (Millions)
          </CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          {loading ? (
            <Skeleton className="w-full h-64" />
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}M`, "Population"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="population" 
                    fill="hsl(16, 66%, 60%)" 
                    radius={[0, 4, 4, 0]}
                  />
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
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="city-search-input"
          />
        </div>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-full md:w-48" data-testid="region-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cities Table */}
      <Card className="content-card" data-testid="cities-table-card">
        <CardHeader className="content-card-header">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Cities ({filteredCities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Population</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.map((city, index) => (
                    <TableRow key={`${city.name}-${city.state}`} data-testid={`city-row-${index}`}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>{city.state}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="badge-muted">
                          {city.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {city.population.toLocaleString()}
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

function StatCard({ label, value, loading, testId }) {
  return (
    <Card className="stat-card" data-testid={testId}>
      <CardContent className="p-4">
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
      </CardContent>
    </Card>
  );
}
