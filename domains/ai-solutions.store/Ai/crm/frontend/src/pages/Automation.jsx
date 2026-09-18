import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Zap, 
  Plus, 
  Play,
  Pause,
  Bell,
  Tag,
  Mail,
  Globe,
  ArrowRight,
  Loader2,
  Brain,
  AlertCircle
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

const TRIGGER_TYPES = [
  { value: "new_lead", label: "New Lead Created", icon: Plus },
  { value: "score_threshold", label: "Score Reaches Threshold", icon: Zap },
  { value: "status_change", label: "Status Changes", icon: ArrowRight },
  { value: "tag_added", label: "Tag Added", icon: Tag },
  { value: "inactivity", label: "Lead Inactive", icon: AlertCircle },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "tag_add", label: "Add Tag", icon: Tag },
  { value: "change_status", label: "Change Status", icon: ArrowRight },
  { value: "webhook", label: "Send Webhook", icon: Globe },
  { value: "notify", label: "Send Notification", icon: Bell },
];

export default function Automation() {
  const [rules, setRules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    trigger_type: "new_lead",
    trigger_value: "",
    action_type: "send_email",
    action_value: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, notifRes, templatesRes] = await Promise.all([
        axios.get(`${API}/automation/rules`),
        axios.get(`${API}/notifications`),
        axios.get(`${API}/templates`),
      ]);
      setRules(rulesRes.data);
      setNotifications(notifRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load automation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.action_value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/automation/rules`, newRule);
      toast.success("Automation rule created!");
      setDialogOpen(false);
      setNewRule({
        name: "",
        trigger_type: "new_lead",
        trigger_value: "",
        action_type: "send_email",
        action_value: "",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRule = async (ruleId) => {
    try {
      const res = await axios.patch(`${API}/automation/rules/${ruleId}/toggle`);
      toast.success(`Rule ${res.data.active ? "activated" : "paused"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to toggle rule");
    }
  };

  const activeRules = rules.filter(r => r.active).length;
  const totalExecutions = rules.reduce((sum, r) => sum + (r.executions || 0), 0);

  return (
    <div className="space-y-8" data-testid="automation-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Automation Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Set up rules to automate your lead management
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="create-rule-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-testid="create-rule-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Automation Rule</DialogTitle>
              <DialogDescription>Define triggers and actions for automated workflows</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Welcome new high-value leads"
                  data-testid="rule-name-input"
                />
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> When this happens...
                </h4>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={newRule.trigger_type}
                    onValueChange={(value) => setNewRule({ ...newRule, trigger_type: value })}
                  >
                    <SelectTrigger data-testid="trigger-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newRule.trigger_type === "score_threshold" || newRule.trigger_type === "status_change") && (
                  <div className="space-y-2">
                    <Label>Trigger Value</Label>
                    <Input
                      value={newRule.trigger_value}
                      onChange={(e) => setNewRule({ ...newRule, trigger_value: e.target.value })}
                      placeholder={newRule.trigger_type === "score_threshold" ? "70" : "qualified"}
                      data-testid="trigger-value-input"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-accent/10 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-accent" /> Do this action...
                </h4>
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <Select
                    value={newRule.action_type}
                    onValueChange={(value) => setNewRule({ ...newRule, action_type: value })}
                  >
                    <SelectTrigger data-testid="action-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action Value *</Label>
                  {newRule.action_type === "send_email" ? (
                    <Select
                      value={newRule.action_value}
                      onValueChange={(value) => setNewRule({ ...newRule, action_value: value })}
                    >
                      <SelectTrigger data-testid="action-value-select">
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
                  ) : (
                    <Input
                      value={newRule.action_value}
                      onChange={(e) => setNewRule({ ...newRule, action_value: e.target.value })}
                      placeholder={
                        newRule.action_type === "tag_add" ? "hot-lead" :
                        newRule.action_type === "change_status" ? "qualified" :
                        newRule.action_type === "webhook" ? "https://hooks.zapier.com/..." :
                        "Value"
                      }
                      data-testid="action-value-input"
                    />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateRule}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
                data-testid="submit-rule-btn"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card" data-testid="stat-total-rules">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold">{rules.length}</p>
                <p className="text-sm text-muted-foreground">Total Rules</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-active-rules">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-green-600">{activeRules}</p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card" data-testid="stat-executions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-heading font-semibold text-accent">{totalExecutions}</p>
                <p className="text-sm text-muted-foreground">Total Executions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="rules" data-testid="tab-rules">
            <Zap className="w-4 h-4 mr-2" /> Automation Rules
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" /> Smart Alerts
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : rules.length === 0 ? (
            <Card className="content-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No automation rules yet. Create your first rule to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => {
                const TriggerIcon = TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.icon || Zap;
                const ActionIcon = ACTION_TYPES.find(a => a.value === rule.action_type)?.icon || ArrowRight;
                
                return (
                  <Card key={rule.id} className="content-card" data-testid={`rule-card-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Zap className={`w-6 h-6 ${rule.active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <h3 className="font-heading font-medium">{rule.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <TriggerIcon className="w-4 h-4" />
                              <span>{TRIGGER_TYPES.find(t => t.value === rule.trigger_type)?.label}</span>
                              {rule.trigger_value && <Badge variant="outline" className="text-xs">{rule.trigger_value}</Badge>}
                              <ArrowRight className="w-4 h-4" />
                              <ActionIcon className="w-4 h-4" />
                              <span>{ACTION_TYPES.find(a => a.value === rule.action_type)?.label}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <p className="text-lg font-semibold">{rule.executions || 0}</p>
                            <p className="text-xs text-muted-foreground">executions</p>
                          </div>
                          <Button
                            variant={rule.active ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleRule(rule.id)}
                            data-testid={`toggle-rule-${index}-btn`}
                          >
                            {rule.active ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                            {rule.active ? "Pause" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="content-card">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No smart alerts at the moment. Seed sample data to generate alerts!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <Card 
                  key={index} 
                  className={`content-card border-l-4 ${
                    notif.priority === 'high' ? 'border-l-red-500' :
                    notif.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                  }`}
                  data-testid={`notification-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          notif.type === 'hot_lead' ? 'bg-red-100' :
                          notif.type === 'stale_lead' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          {notif.type === 'hot_lead' ? <Brain className="w-4 h-4 text-red-600" /> :
                           notif.type === 'stale_lead' ? <AlertCircle className="w-4 h-4 text-yellow-600" /> :
                           <Bell className="w-4 h-4 text-green-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{notif.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{notif.action}</Badge>
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
