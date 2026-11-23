import { OperationsPage } from "@/components/OperationsPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, LockKeyhole, Power, SlidersHorizontal } from "lucide-react";

export default function Controls() {
  const utils = trpc.useUtils();
  const channels = trpc.operations.channels.useQuery();
  const toggleChannel =
    trpc.operations.setMarketplaceChannelEnabled.useMutation({
      onSuccess: () => {
        utils.operations.channels.invalidate();
        utils.operations.overview.invalidate();
        utils.operations.ledger.invalidate();
      },
    });

  return (
    <OperationsPage
      eyebrow="LLC-owned configuration"
      title="Channel controls"
      description="Connection status, fulfillment defaults, policy mappings, listing rules, and channel enablement are managed here. Secret values remain server-side and are never displayed."
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Marketplace connections</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each channel starts disabled and in review mode until an explicit
              LLC control decision enables it.
            </p>
          </div>
          <LockKeyhole className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-6 divide-y divide-border">
          {(channels.data ?? []).map(channel => (
            <div
              key={channel.code}
              data-testid={`channel-control-${channel.code}`}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{channel.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {channel.capability === "api"
                    ? "API-capable after authorized configuration"
                    : channel.capability === "conditional"
                      ? "Review-only until eligible access is confirmed"
                      : "Prepared workflow only"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{channel.operationMode}</Badge>
                <Badge variant={channel.enabled ? "default" : "secondary"}>
                  {channel.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Badge
                  variant={
                    channel.credentialState.configured ? "default" : "secondary"
                  }
                >
                  {channel.credentialState.configured
                    ? "Configured"
                    : `Not configured (${channel.credentialState.configuredCount}/${channel.credentialState.requiredCount})`}
                </Badge>
                <Button
                  size="sm"
                  variant={channel.enabled ? "outline" : "default"}
                  data-testid={`toggle-channel-${channel.code}`}
                  disabled={toggleChannel.isPending}
                  onClick={() =>
                    toggleChannel.mutate({
                      channelCode: channel.code,
                      enabled: !channel.enabled,
                      operationMode: !channel.enabled ? "enabled" : "review",
                    })
                  }
                  className="gap-1.5"
                >
                  {toggleChannel.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                  {channel.enabled ? "Disable channel" : "Enable channel"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {toggleChannel.error ? (
          <p className="mt-3 text-sm text-destructive">
            {toggleChannel.error.message}
          </p>
        ) : null}
      </section>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SlidersHorizontal className="h-6 w-6 text-primary" />
        <h2 className="mt-4 text-lg font-semibold">Operational defaults</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Fulfillment, return, location, category, and listing rules will be
          stored as non-secret mappings. Changing a channel to enabled remains
          an explicit, audited decision.
        </p>
      </section>
    </OperationsPage>
  );
}
