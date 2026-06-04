import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DelegationModalProps {
  agentId: string;
  onSuccess?: () => void;
}

export function DelegationModal({ agentId, onSuccess }: DelegationModalProps) {
  const [open, setOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");

  const delegateMutation = trpc.paperclip.delegateTask.useMutation({
    onSuccess: () => {
      toast.success("Task delegated successfully");
      setTaskDescription("");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delegate task");
    },
  });

  const handleDelegate = async () => {
    if (!taskDescription.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    await delegateMutation.mutateAsync({
      agentId,
      taskDescription: taskDescription.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cyber-button w-full">
          <Send size={16} className="mr-2" />
          Delegate Task
        </Button>
      </DialogTrigger>
      <DialogContent className="cyber-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="glow-cyan">Delegate Task</DialogTitle>
          <DialogDescription>
            Send a task to agent {agentId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Task Description</label>
            <Textarea
              placeholder="Describe the task for the agent..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="cyber-input mt-2 min-h-24"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDelegate}
              disabled={delegateMutation.isPending || !taskDescription.trim()}
              className="cyber-button flex-1"
            >
              {delegateMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Delegating...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Delegate
                </>
              )}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="cyber-button-secondary flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
