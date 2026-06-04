import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AgentWorkloadProps {
  agentId: string;
}

export function AgentWorkload({ agentId }: AgentWorkloadProps) {
  const { data: workload, isLoading } = trpc.paperclip.getAgentWorkload.useQuery({
    agentId,
  });

  if (isLoading) {
    return (
      <Card className="cyber-panel">
        <CardHeader>
          <CardTitle>Agent Workload</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!workload) {
    return null;
  }

  const stats = [
    { label: "Total Tasks", value: workload.total, color: "text-primary" },
    { label: "Pending", value: workload.pending, color: "text-yellow-400" },
    { label: "In Progress", value: workload.inProgress, color: "text-cyan-400" },
    { label: "Completed", value: workload.completed, color: "text-green-400" },
    { label: "Failed", value: workload.failed, color: "text-red-400" },
  ];

  return (
    <Card className="cyber-panel">
      <CardHeader>
        <CardTitle>Agent Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="p-3 bg-input rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
