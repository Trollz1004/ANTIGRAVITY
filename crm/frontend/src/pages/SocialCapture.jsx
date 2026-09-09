import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Share2, 
  Plus, 
  Copy, 
  Check,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Users,
  ExternalLink,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const PLATFORM_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

const PLATFORM_COLORS = {
  facebook: "bg-blue-100 text-blue-700 border-blue-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  twitter: "bg-sky-100 text-sky-700 border-sky-200",
  linkedin: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function SocialCapture() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCapture, setNewCapture] = useState({
    platform: "facebook",
    campaign_name: "",
    form_fields: ["name", "email"],
    redirect_url: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/social-capture`);
      setCaptures(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load social captures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCapture = async () => {
    if (!newCapture.campaign_name) {
      toast.error("Please enter a campaign name");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/social-capture`, newCapture);
      toast.success("Social capture created successfully!");
      setDialogOpen(false);
      setNewCapture({
        platform: "facebook",
        campaign_name: "",
        form_fields: ["name", "email"],
        redirect_url: "",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create social capture");
    } finally {
      setSubmitting(false);
    }
  };

  const copyFormUrl = (captureId) => {
    const url = `${API}/social-capture/${captureId}/submit`;
    navigator.clipboard.writeText(url);
    setCopiedId(captureId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Form URL copied to clipboard!");
  };

  const toggleField = (field) => {
    const fields = newCapture.form_fields;
    if (fields.includes(field)) {
      if (field === "email") return; // Email is required
      setNewCapture({
        ...newCapture,
        form_fields: fields.filter((f) => f !== field),
      });
    } else {
      setNewCapture({
        ...newCapture,
        form_fields: [...fields, field],
      });
    }
  };

  const totalLeads = captures.reduce((sum, c) => sum + c.leads_captured, 0);
  const activeCaptures = captures.filter((c) => c.active).length;

  return (
    <div className="space-y-8" data-testid="social-capture-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Social Lead Capture
          </h1>
          <p className="text-muted-foreground mt-1">
            Capture leads from social media campaigns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-capture-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Capture Form
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-capture-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Social Capture</DialogTitle>
              <DialogDescription>Set up a lead capture form for social media</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={newCapture.platform}
                  onValueChange={(value) => setNewCapture({ ...newCapture, platform: value })}
                >
                  <SelectTrigger data-testid="capture-platform-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">
                      <div className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" /> Facebook
                      </div>
                    </SelectItem>
                    <SelectItem value="instagram">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" /> Instagram
                      </div>
                    </SelectItem>
                    <SelectItem value="twitter">
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4" /> Twitter/X
                      </div>
                    </SelectItem>
                    <SelectItem value="linkedin">
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input
                  value={newCapture.campaign_name}
                  onChange={(e) => setNewCapture({ ...newCapture, campaign_name: e.target.value })}
                  placeholder="Spring Volunteer Drive"
                  data-testid="capture-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Form Fields</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["name", "email", "phone", "city"].map((field) => (
                    <div
                      key={field}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <span className="capitalize">{field}</span>
                      <Switch
                        checked={newCapture.form_fields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                        disabled={field === "email"}
                        data-testid={`field-toggle-${field}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Redirect URL (Optional)</Label>
                <Input
                  value={newCapture.redirect_url}
                  onChange={(e) => setNewCapture({ ...newCapture, redirect_url: e.target.value })}
                  placeholder="https://youandinotai.com/thank-you"
                  data-testid="capture-redirect-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCapture}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
                data-testid="submit-capture-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card" data-testid="stat-total-captures">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold">{captures.length}</p>
                <p className="text-sm text-muted-foreground">Total Captures</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-active-captures">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-green-600">{activeCaptures}</p>
                <p className="text-sm text-muted-foreground">Active Captures</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-total-leads">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-accent">{totalLeads}</p>
                <p className="text-sm text-muted-foreground">Leads Captured</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capture Forms */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : captures.length === 0 ? (
        <Card className="content-card">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No social captures yet. Create your first capture form!</p>
            <p className="text-sm mt-2">Connect your social media ads to capture leads automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {captures.map((capture, index) => {
            const PlatformIcon = PLATFORM_ICONS[capture.platform] || Share2;
            return (
              <Card 
                key={capture.id} 
                className="content-card hover:-translate-y-0.5 transition-all"
                data-testid={`capture-card-${index}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${PLATFORM_COLORS[capture.platform]}`}>
                      <PlatformIcon className="w-5 h-5" />
                    </div>
                    <Badge className={capture.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {capture.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-lg mt-3">{capture.campaign_name}</CardTitle>
                  <CardDescription className="capitalize">{capture.platform}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Leads Captured</span>
                      <span className="font-semibold text-lg">{capture.leads_captured}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {capture.form_fields.map((field) => (
                        <Badge key={field} variant="outline" className="badge-muted text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <Label className="text-xs text-muted-foreground mb-2 block">Form Endpoint</Label>
                      <div className="flex gap-2">
                        <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                          /api/social-capture/{capture.id}/submit
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyFormUrl(capture.id)}
                          data-testid={`copy-url-${index}`}
                        >
                          {copiedId === capture.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {capture.redirect_url && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{capture.redirect_url}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Integration Guide */}
      <Card className="content-card" data-testid="integration-guide">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Integration Guide</CardTitle>
          <CardDescription>How to use social capture forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">1</div>
              <h4 className="font-medium">Create Capture Form</h4>
              <p className="text-sm text-muted-foreground">
                Click "Create Capture Form" and select your platform and fields.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">2</div>
              <h4 className="font-medium">Connect to Ads</h4>
              <p className="text-sm text-muted-foreground">
                Use the form endpoint URL in your Facebook/Instagram lead ads webhook.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">3</div>
              <h4 className="font-medium">Auto-Capture Leads</h4>
              <p className="text-sm text-muted-foreground">
                Leads are automatically added to your CRM with source tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
