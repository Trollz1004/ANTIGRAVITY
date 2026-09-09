import { useState, useEffect } from "react";
import axios from "axios";
import { 
  FileText, 
  Plus, 
  Eye,
  MousePointer,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Palette,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPage, setNewPage] = useState({
    name: "",
    slug: "",
    headline: "",
    subheadline: "",
    cta_text: "Sign Up",
    form_fields: ["name", "email"],
    background_color: "#4A7B59",
    text_color: "#FFFFFF",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/landing-pages`);
      setPages(res.data);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to load landing pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePage = async () => {
    if (!newPage.name || !newPage.slug || !newPage.headline) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/landing-pages`, newPage);
      toast.success("Landing page created!");
      setDialogOpen(false);
      setNewPage({
        name: "",
        slug: "",
        headline: "",
        subheadline: "",
        cta_text: "Sign Up",
        form_fields: ["name", "email"],
        background_color: "#4A7B59",
        text_color: "#FFFFFF",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create page");
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = (slug) => {
    const url = `${API}/landing-pages/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Page URL copied!");
  };

  const toggleField = (field) => {
    const fields = newPage.form_fields;
    if (fields.includes(field)) {
      if (field === "email") return;
      setNewPage({ ...newPage, form_fields: fields.filter((f) => f !== field) });
    } else {
      setNewPage({ ...newPage, form_fields: [...fields, field] });
    }
  };

  const totalVisits = pages.reduce((sum, p) => sum + p.visits, 0);
  const totalConversions = pages.reduce((sum, p) => sum + p.conversions, 0);
  const avgConversionRate = totalVisits > 0 ? (totalConversions / totalVisits * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8" data-testid="landing-pages-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Landing Pages
          </h1>
          <p className="text-muted-foreground mt-1">
            Create lead capture pages for your campaigns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-page-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-testid="create-page-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Landing Page</DialogTitle>
              <DialogDescription>Design a lead capture page</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Name *</Label>
                  <Input
                    value={newPage.name}
                    onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                    placeholder="Volunteer Sign Up"
                    data-testid="page-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="volunteer-signup"
                    data-testid="page-slug-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Headline *</Label>
                <Input
                  value={newPage.headline}
                  onChange={(e) => setNewPage({ ...newPage, headline: e.target.value })}
                  placeholder="Make a Difference Today"
                  data-testid="page-headline-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  value={newPage.subheadline}
                  onChange={(e) => setNewPage({ ...newPage, subheadline: e.target.value })}
                  placeholder="Join thousands of volunteers..."
                  data-testid="page-subheadline-input"
                />
              </div>

              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input
                  value={newPage.cta_text}
                  onChange={(e) => setNewPage({ ...newPage, cta_text: e.target.value })}
                  placeholder="Sign Up Now"
                  data-testid="page-cta-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Form Fields</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["name", "email", "phone", "city", "interests"].map((field) => (
                    <div key={field} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span className="capitalize text-sm">{field}</span>
                      <Switch
                        checked={newPage.form_fields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                        disabled={field === "email"}
                        data-testid={`field-toggle-${field}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Background Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newPage.background_color}
                      onChange={(e) => setNewPage({ ...newPage, background_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={newPage.background_color}
                      onChange={(e) => setNewPage({ ...newPage, background_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Text Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newPage.text_color}
                      onChange={(e) => setNewPage({ ...newPage, text_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={newPage.text_color}
                      onChange={(e) => setNewPage({ ...newPage, text_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="p-6 rounded-lg text-center"
                  style={{ backgroundColor: newPage.background_color, color: newPage.text_color }}
                >
                  <h3 className="text-xl font-bold">{newPage.headline || "Your Headline"}</h3>
                  <p className="text-sm opacity-80 mt-1">{newPage.subheadline || "Your subheadline"}</p>
                  <button 
                    className="mt-4 px-4 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: newPage.text_color, color: newPage.background_color }}
                  >
                    {newPage.cta_text || "Sign Up"}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreatePage}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
                data-testid="submit-page-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Page"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card" data-testid="stat-total-pages">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold">{pages.length}</p>
                <p className="text-sm text-muted-foreground">Landing Pages</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-total-visits">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold">{totalVisits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-total-conversions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-green-600">{totalConversions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-conversion-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-accent">{avgConversionRate}%</p>
                <p className="text-sm text-muted-foreground">Avg Conv. Rate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : pages.length === 0 ? (
        <Card className="content-card">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No landing pages yet. Create your first page to start capturing leads!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page, index) => {
            const conversionRate = page.visits > 0 ? (page.conversions / page.visits * 100).toFixed(1) : 0;
            return (
              <Card key={page.id} className="content-card overflow-hidden" data-testid={`page-card-${index}`}>
                {/* Preview Header */}
                <div 
                  className="p-6 text-center"
                  style={{ backgroundColor: page.background_color, color: page.text_color }}
                >
                  <h3 className="text-lg font-bold line-clamp-1">{page.headline}</h3>
                  {page.subheadline && (
                    <p className="text-sm opacity-80 mt-1 line-clamp-1">{page.subheadline}</p>
                  )}
                  <button 
                    className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: page.text_color, color: page.background_color }}
                  >
                    {page.cta_text}
                  </button>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{page.name}</h4>
                      <p className="text-xs text-muted-foreground">/{page.slug}</p>
                    </div>
                    <Badge className={page.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {page.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-lg font-semibold">{page.visits.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Visits</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-lg font-semibold">{page.conversions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-lg font-semibold">{conversionRate}%</p>
                      <p className="text-xs text-muted-foreground">Conv.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyUrl(page.slug)}
                      data-testid={`copy-url-${index}`}
                    >
                      {copiedId === page.slug ? (
                        <Check className="w-4 h-4 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={`${API}/landing-pages/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
