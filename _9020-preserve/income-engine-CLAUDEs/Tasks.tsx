import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Tasks() {
  const [promptInput, setPromptInput] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasks, refetch: refetchTasks } = trpc.manus.listTasks.useQuery(undefined);
  const { data: selectedTask } = trpc.manus.getTask.useQuery(
    selectedTaskId ? { taskId: selectedTaskId } : { taskId: "" },
    { enabled: !!selectedTaskId }
  );

  const createTaskMutation = trpc.manus.createTask.useMutation({
    onSuccess: () => {
      refetchTasks();
      setPromptInput("");
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const updateTaskMutation = trpc.manus.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetchTasks();
      toast.success("Task updated");
    },
  });

  const handleCreateTask = async () => {
    if (!promptInput.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const taskId = `task-${Date.now()}`;
    await createTaskMutation.mutateAsync({
      taskId,
      prompt: promptInput,
    });
  };

  const getStatusColor = (status: string | undefined | null) => {
    switch (status) {
      case "completed":
        return "text-primary";
      case "running":
        return "text-secondary";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold glow-cyan">TASK MANAGER</h1>
            <p className="text-muted-foreground">
              Create and manage Manus API tasks with real-time status updates.
            </p>
          </div>

          {/* Create Task */}
          <Card className="cyber-panel">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>
                Enter a prompt to create a new Manus API task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                placeholder="Enter your task prompt..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="cyber-input w-full h-24 resize-none"
              />
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                className="cyber-button"
              >
                <Plus size={16} className="mr-2" />
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </CardContent>
          </Card>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task List */}
            <div className="lg:col-span-1">
              <Card className="cyber-panel">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Tasks
                    <button
                      onClick={() => refetchTasks()}
                      className="p-1 hover:bg-border rounded transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks?.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.taskId)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTaskId === task.taskId
                          ? "neon-border bg-primary/10"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="text-sm font-mono truncate">
                        {task.taskId}
                      </div>
                      <div className={`text-xs font-bold mt-1 ${getStatusColor(task.status)}`}>
                        {task.status?.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Task Details */}
            <div className="lg:col-span-2">
              {selectedTask ? (
                <Card className="cyber-panel">
                  <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">ID</label>
                      <div className="font-mono text-sm bg-input p-2 rounded-lg mt-1">
                        {selectedTask.taskId}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Status</label>
                      <div className={`font-bold mt-1 ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status?.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Prompt</label>
                      <div className="bg-input p-3 rounded-lg mt-1 text-sm max-h-32 overflow-y-auto">
                        {selectedTask.prompt}
                      </div>
                    </div>

                    {selectedTask.result && (
                      <div>
                        <label className="text-sm text-muted-foreground">Result</label>
                        <div className="bg-input p-3 rounded-lg mt-1 text-sm max-h-32 overflow-y-auto">
                          {selectedTask.result}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          selectedTaskId &&
                          updateTaskMutation.mutateAsync({
                            taskId: selectedTaskId,
                            status: "running",
                          })
                        }
                        className="cyber-button flex-1"
                        disabled={selectedTask.status === "running"}
                      >
                        Resume
                      </Button>
                      <Button
                        onClick={() =>
                          selectedTaskId &&
                          updateTaskMutation.mutateAsync({
                            taskId: selectedTaskId,
                            status: "stopped",
                          })
                        }
                        className="cyber-button-secondary flex-1"
                      >
                        Stop
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="cyber-panel flex items-center justify-center h-64">
                  <div className="text-center text-muted-foreground">
                    Select a task to view details
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
