import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Mail, 
  Plus, 
  Send, 
  Eye,
  MousePointer,
  FileText,
  Loader2,
  Zap,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  running: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
};

export default function EmailCampaigns() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Template form
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    html_content: "",
    category: "general",
  });
  
  // Campaign form
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    template_id: "",
    target_segment: {},
  });
  
  const [sendingCampaign, setSendingCampaign] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, campaignsRes, sequencesRes, catRes, cityRes] = await Promise.all([
        axios.get(`${API}/templates`),
        axios.get(`${API}/campaigns`),
        axios.get(`${API}/sequences`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/cities`, { params: { limit: 20 } }),
      ]);
      setTemplates(templatesRes.data);
      setCampaigns(campaignsRes.data);
      setSequences(sequencesRes.data);
      setCategories(catRes.data.categories);
      setCities(cityRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.html_content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmittingTemplate(true);
    try {
      await axios.post(`${API}/templates`, newTemplate);
      toast.success("Template created successfully!");
      setTemplateDialogOpen(false);
      setNewTemplate({ name: "", subject: "", html_content: "", category: "general" });
      fetchData();
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.template_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmittingCampaign(true);
    try {
      await axios.post(`${API}/campaigns`, newCampaign);
      toast.success("Campaign created successfully!");
      setCampaignDialogOpen(false);
      setNewCampaign({ name: "", template_id: "", target_segment: {} });
      fetchData();
    } catch (error) {
      toast.error("Failed to create campaign");
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    setSendingCampaign(campaignId);
    try {
      const res = await axios.post(`${API}/campaigns/${campaignId}/send`);
      toast.success(`Campaign sent to ${res.data.sent_count} leads!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send campaign");
    } finally {
      setSendingCampaign(null);
    }
  };

  const toggleSequence = async (sequenceId) => {
    try {
      const res = await axios.patch(`${API}/sequences/${sequenceId}/toggle`);
      toast.success(`Sequence ${res.data.active ? "activated" : "paused"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to toggle sequence");
    }
  };

  return (
    <div className="space-y-8" data-testid="email-campaigns-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Email Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Create templates, campaigns, and automated sequences
          </p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg" data-testid="email-tabs">
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="sequences" data-testid="tab-sequences">
            <Zap className="w-4 h-4 mr-2" />
            Drip Sequences
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="create-campaign-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="create-campaign-dialog">
                <DialogHeader>
                  <DialogTitle className="font-heading">Create Email Campaign</DialogTitle>
                  <DialogDescription>Set up a new email campaign for your leads</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Campaign Name *</Label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="January Newsletter"
                      data-testid="campaign-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Template *</Label>
                    <Select
                      value={newCampaign.template_id}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, template_id: value })}
                    >
                      <SelectTrigger data-testid="campaign-template-select">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target City (Optional)</Label>
                    <Select
                      value={newCampaign.target_segment?.city || ""}
                      onValueChange={(value) => 
                        setNewCampaign({ 
                          ...newCampaign, 
                          target_segment: { ...newCampaign.target_segment, city: value || undefined } 
                        })
                      }
                    >
                      <SelectTrigger data-testid="campaign-city-select">
                        <SelectValue placeholder="All cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cities</SelectItem>
                        {cities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}, {c.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Lead Score</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newCampaign.target_segment?.min_score || ""}
                      onChange={(e) => 
                        setNewCampaign({ 
                          ...newCampaign, 
                          target_segment: { ...newCampaign.target_segment, min_score: parseInt(e.target.value) || undefined } 
                        })
                      }
                      placeholder="0"
                      data-testid="campaign-min-score-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={submittingCampaign}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="submit-campaign-btn"
                  >
                    {submittingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="content-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet. Create your first email campaign!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign, index) => (
                <Card key={campaign.id} className="content-card" data-testid={`campaign-card-${index}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-heading text-lg">{campaign.name}</CardTitle>
                        <CardDescription>
                          Template: {templates.find(t => t.id === campaign.template_id)?.name || "Unknown"}
                        </CardDescription>
                      </div>
                      <Badge className={STATUS_COLORS[campaign.status]}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-heading font-semibold">{campaign.sent_count}</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-heading font-semibold text-green-600">{campaign.open_count}</p>
                        <p className="text-xs text-muted-foreground">Opened</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-heading font-semibold text-blue-600">{campaign.click_count}</p>
                        <p className="text-xs text-muted-foreground">Clicked</p>
                      </div>
                    </div>
                    {campaign.status === "draft" && (
                      <Button
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendingCampaign === campaign.id}
                        className="w-full bg-accent hover:bg-accent/90"
                        data-testid={`send-campaign-${index}-btn`}
                      >
                        {sendingCampaign === campaign.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Campaign
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="create-template-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="create-template-dialog">
                <DialogHeader>
                  <DialogTitle className="font-heading">Create Email Template</DialogTitle>
                  <DialogDescription>Design a reusable email template</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Template Name *</Label>
                      <Input
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="Welcome Email"
                        data-testid="template-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newTemplate.category}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                      >
                        <SelectTrigger data-testid="template-category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="reengagement">Re-engagement</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Line *</Label>
                    <Input
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      placeholder="Welcome to Youandinotai, {{name}}!"
                      data-testid="template-subject-input"
                    />
                    <p className="text-xs text-muted-foreground">Use {"{{name}}"} for personalization</p>
                  </div>
                  <div className="space-y-2">
                    <Label>HTML Content *</Label>
                    <Textarea
                      value={newTemplate.html_content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                      placeholder="<div>Hi {{name}}, welcome to our platform!</div>"
                      className="min-h-48 font-mono text-sm"
                      data-testid="template-content-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={submittingTemplate}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="submit-template-btn"
                  >
                    {submittingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : templates.length === 0 ? (
            <Card className="content-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates yet. Seed sample data or create your first template!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <Card key={template.id} className="content-card hover:-translate-y-0.5 transition-all" data-testid={`template-card-${index}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-heading text-base">{template.name}</CardTitle>
                      <Badge variant="outline" className="badge-muted text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      Subject: {template.subject}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      {template.html_content.length} characters
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="mt-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : sequences.length === 0 ? (
            <Card className="content-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No drip sequences yet. Seed sample data to create automated sequences!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sequences.map((sequence, index) => (
                <Card key={sequence.id} className="content-card" data-testid={`sequence-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sequence.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Zap className={`w-6 h-6 ${sequence.active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-heading font-medium">{sequence.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Trigger: {sequence.trigger.replace("_", " ")} • {sequence.steps.length} steps • {sequence.enrolled_count} enrolled
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={sequence.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {sequence.active ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Paused</>
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSequence(sequence.id)}
                          data-testid={`toggle-sequence-${index}-btn`}
                        >
                          {sequence.active ? "Pause" : "Activate"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                      {sequence.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center">
                          <div className="flex-shrink-0 px-3 py-2 rounded-lg bg-muted text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              Day {step.delay_days}
                            </div>
                          </div>
                          {stepIndex < sequence.steps.length - 1 && (
                            <div className="w-8 h-0.5 bg-border mx-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
