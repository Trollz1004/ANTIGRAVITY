import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TaskAssignmentPanelProps {
  onTaskCreated?: (taskId: string) => void;
}

export function TaskAssignmentPanel({ onTaskCreated }: TaskAssignmentPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [status, setStatus] = useState<"todo" | "in_progress" | "backlog">("todo");
  const [assigneeId, setAssigneeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createIssueMutation = trpc.paperclip.createIssue.useMutation();
  const listIssuesMutation = trpc.paperclip.listIssues.useQuery({});

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Task description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createIssueMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assigneeAgentId: assigneeId || undefined,
      });

      toast.success(`Task "${result.title}" created successfully!`);
      onTaskCreated?.(result.id);

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("todo");
      setAssigneeId("");
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task. Make sure Paperclip is configured.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Task */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-accent" />
            Create Paperclip Task
          </CardTitle>
          <CardDescription>
            Assign work directly to Paperclip agents from ManusClaw
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTask} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task Title *
              </label>
              <Input
                placeholder="e.g., Implement user authentication"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="bg-background border-border"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <Textarea
                placeholder="Detailed description of the task, requirements, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="bg-background border-border resize-none"
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Assign to Agent (Optional)
              </label>
              <Input
                placeholder="Agent ID or name"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={isSubmitting}
                className="bg-background border-border"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="w-full bg-accent text-black hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Task in Paperclip
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task List */}
      {listIssuesMutation.data && listIssuesMutation.data.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              Recent Tasks ({listIssuesMutation.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listIssuesMutation.data.map((issue: any) => (
                <div
                  key={issue.id}
                  className="p-3 bg-background border border-border rounded-lg hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{issue.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            issue.priority === "critical"
                              ? "bg-red-500/20 text-red-300 border-red-500/50"
                              : issue.priority === "high"
                                ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/50"
                          }`}
                        >
                          {issue.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs bg-accent/20 text-accent border-accent/50"
                        >
                          {issue.status}
                        </Badge>
                        {issue.assigneeAgentId && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-500/20 text-green-300 border-green-500/50"
                          >
                            {issue.assigneeAgentId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Configuration Warning */}
      {!listIssuesMutation.data && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-300 mb-1">Paperclip Not Connected</h4>
                <p className="text-sm text-yellow-200">
                  Configure your Paperclip instance in Settings to start creating and assigning
                  tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
