import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";

interface DelegationHistoryProps {
  agentId?: string;
}

const statusColors: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={16} />, color: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
  assigned: { icon: <Zap size={16} />, color: "bg-blue-500/20 text-blue-400", label: "Assigned" },
  in_progress: { icon: <Loader2 size={16} className="animate-spin" />, color: "bg-cyan-500/20 text-cyan-400", label: "In Progress" },
  completed: { icon: <CheckCircle size={16} />, color: "bg-green-500/20 text-green-400", label: "Completed" },
  failed: { icon: <AlertCircle size={16} />, color: "bg-red-500/20 text-red-400", label: "Failed" },
};

export function DelegationHistory({ agentId }: DelegationHistoryProps) {
  const { data: delegations, isLoading } = trpc.paperclip.getDelegationHistory.useQuery({
    agentId,
    limit: 20,
  });

  if (isLoading) {
    return (
      <Card className="cyber-panel">
        <CardHeader>
          <CardTitle>Delegation History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!delegations || delegations.length === 0) {
    return (
      <Card className="cyber-panel">
        <CardHeader>
          <CardTitle>Delegation History</CardTitle>
          <CardDescription>No delegations yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Tasks delegated to agents will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cyber-panel">
      <CardHeader>
        <CardTitle>Delegation History</CardTitle>
        <CardDescription>{delegations.length} delegations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {delegations.map((delegation) => {
            const status = delegation.status || "pending";
            const statusInfo = statusColors[status] || statusColors.pending;
            return (
              <div
                key={delegation.id}
                className="p-3 bg-input rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {delegation.taskDescription}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Agent: {delegation.agentId}
                    </p>
                  </div>
                  <Badge className={`flex items-center gap-1 whitespace-nowrap ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>

                {delegation.result && (
                  <div className="mt-2 p-2 bg-background rounded text-xs text-muted-foreground">
                    <strong>Result:</strong> {delegation.result.substring(0, 100)}
                    {delegation.result.length > 100 ? "..." : ""}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(delegation.delegatedAt).toLocaleString()}
                  </span>
                  {delegation.completedAt && (
                    <span>
                      Completed: {new Date(delegation.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
