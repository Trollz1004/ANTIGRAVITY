import { OperationsPage } from "@/components/OperationsPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const preflightCards = [
  {
    label: "Verified catalog facts",
    matchErrors: ["Catalog record requires factual verification."],
  },
  {
    label: "Required channel fields",
    matchErrors: [
      "Listing title is required.",
      "Listing description is required.",
      "A positive listing price is required.",
      "At least one verified image is required.",
    ],
  },
  {
    label: "Inventory available to reserve",
    matchErrors: ["Available inventory is required."],
  },
  {
    label: "Approval request granted",
    matchErrors: ["An approved request is required before submission."],
  },
  {
    label: "Channel enabled by LLC control",
    matchErrors: [
      "The channel is disabled by LLC configuration.",
      "This channel is limited to a prepared review workflow.",
    ],
  },
] as const;

export default function ListingDesk() {
  const [facts, setFacts] = useState("");
  const [kind, setKind] = useState<
    "title" | "description" | "category_attributes"
  >("title");
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [selectedChannel, setSelectedChannel] = useState<
    "ebay" | "google_merchant" | "facebook_marketplace" | "mercari" | "poshmark"
  >("ebay");
  const [price, setPrice] = useState(1);
  const draft = trpc.drafts.create.useMutation();
  const utils = trpc.useUtils();
  const catalog = trpc.catalog.list.useQuery();
  const preview = trpc.listings.preview.useMutation({
    onSuccess: () => {
      utils.exceptions.listOpen.invalidate();
      utils.operations.overview.invalidate();
    },
  });
  const approval = trpc.approvals.requestListing.useMutation({
    onSuccess: () => {
      utils.operations.ledger.invalidate();
      utils.operations.overview.invalidate();
    },
  });
  const publish = trpc.listings.publish.useMutation({
    onSuccess: () => {
      utils.operations.ledger.invalidate();
      utils.operations.overview.invalidate();
      utils.exceptions.listOpen.invalidate();
      utils.inventory.list.invalidate();
    },
  });
  const applyDraft = trpc.operations.applyDraftToCatalog.useMutation({
    onSuccess: () => {
      utils.catalog.list.invalidate();
      utils.operations.overview.invalidate();
      utils.operations.ledger.invalidate();
    },
  });

  const activePreflight = preview.data?.preflight;

  return (
    <OperationsPage
      eyebrow="Controlled marketplace workflows"
      title="Listing desk"
      description="Generate, validate, review, and submit channel-specific payloads only through explicit approval-controlled rules."
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Submission preflight</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A channel payload remains in review until every guardrail passes.
            </p>
          </div>
          {activePreflight ? (
            <Badge
              variant={activePreflight.ready ? "default" : "outline"}
              className={
                activePreflight.ready
                  ? "bg-emerald-600 text-white"
                  : "border-amber-300 bg-amber-50 text-amber-800"
              }
            >
              {activePreflight.ready
                ? "Preflight ready"
                : `${activePreflight.errors.length} blocking check${activePreflight.errors.length === 1 ? "" : "s"}`}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              No listing selected
            </Badge>
          )}
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {preflightCards.map((card, index) => {
            const cardErrors = activePreflight
              ? activePreflight.errors.filter(err =>
                  (card.matchErrors as readonly string[]).includes(err)
                )
              : [];
            const cardPassed =
              Boolean(activePreflight) && cardErrors.length === 0;
            return (
              <div
                key={card.label}
                data-testid={`preflight-card-${index + 1}`}
                className={`rounded-xl border p-4 ${
                  !activePreflight
                    ? "border-border bg-muted/30"
                    : cardPassed
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-amber-300 bg-amber-50/50"
                }`}
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  0{index + 1}
                </span>
                {!activePreflight ? (
                  <ClipboardCheck className="my-4 h-5 w-5 text-primary" />
                ) : cardPassed ? (
                  <CheckCircle2 className="my-4 h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="my-4 h-5 w-5 text-amber-600" />
                )}
                <p className="text-sm font-medium leading-5">{card.label}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {!activePreflight
                    ? "Pending source record"
                    : cardPassed
                      ? "Passed"
                      : cardErrors.join(" ")}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="mt-4 text-lg font-semibold">
          Default submission policy
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Create and revise actions remain blocked until the catalog is
          verified, a channel-specific payload validates, available quantity is
          positive, and a recorded approval is granted.
        </p>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Review-only assistant
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Draft from verified facts
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Uses the server-side `gpt-5-mini` model to suggest copy. The
                assistant cannot publish and must not add product facts.
              </p>
            </div>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(["title", "description", "category_attributes"] as const).map(
              option => (
                <Button
                  key={option}
                  size="sm"
                  variant={kind === option ? "default" : "outline"}
                  onClick={() => setKind(option)}
                >
                  {option === "category_attributes"
                    ? "Category & attributes"
                    : option}
                </Button>
              )
            )}
          </div>
          <textarea
            value={facts}
            onChange={event => setFacts(event.target.value)}
            placeholder="Paste only verified product facts: identity, condition, edition, format, included items, and media details."
            className="mt-4 min-h-36 w-full rounded-xl border border-input bg-background p-3 text-sm leading-6"
          />
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs leading-5 text-muted-foreground">
              Submitting creates a logged draft event. Review is mandatory.
            </p>
            <Button
              disabled={facts.trim().length < 10 || draft.isPending}
              onClick={() =>
                draft.mutate({
                  kind,
                  factualRecord: facts,
                  reviewAcknowledgement: true,
                })
              }
              className="gap-2"
            >
              {draft.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}{" "}
              Create draft
            </Button>
          </div>
          {draft.error ? (
            <p className="mt-3 text-sm text-destructive">
              {draft.error.message}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Draft output
          </p>
          {draft.data ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  TITLE
                </p>
                <p className="mt-1 font-medium">
                  {draft.data.title || "No title suggested"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  DESCRIPTION
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {draft.data.description || "No description suggested"}
                </p>
              </div>
              {draft.data.categoryHint ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    CATEGORY HINT
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {draft.data.categoryHint}
                  </p>
                </div>
              ) : null}
              {draft.data.attributes?.length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    ATTRIBUTES
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                    {draft.data.attributes.map(attr => (
                      <li key={`${attr.name}-${attr.value}`}>
                        <span className="font-medium text-foreground">
                          {attr.name}:
                        </span>{" "}
                        {attr.value}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  WARNINGS
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-700">
                  {draft.data.warnings.length ? (
                    draft.data.warnings.map(warning => (
                      <li key={warning}>{warning}</li>
                    ))
                  ) : (
                    <li>Review all output before use.</li>
                  )}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Badge variant="outline">Review required</Badge>
                <Button
                  size="sm"
                  data-testid="apply-draft-to-catalog"
                  disabled={!selectedProductId || applyDraft.isPending}
                  onClick={() =>
                    selectedProductId &&
                    draft.data &&
                    applyDraft.mutate({
                      productId: Number(selectedProductId),
                      title: draft.data.title || undefined,
                      description: draft.data.description || undefined,
                      categoryHint: draft.data.categoryHint || undefined,
                      attributes: draft.data.attributes,
                    })
                  }
                  className="gap-1.5"
                >
                  {applyDraft.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileCheck2 className="h-3.5 w-3.5" />
                  )}
                  Apply draft to catalog
                </Button>
              </div>
              {applyDraft.data ? (
                <p className="text-sm text-emerald-700">
                  Reviewed draft applied to catalog record.
                </p>
              ) : null}
              {applyDraft.error ? (
                <p className="text-sm text-destructive">
                  {applyDraft.error.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
              Draft suggestions appear here after verified facts are supplied.
              They remain separate from any marketplace payload until a user
              reviews them and applies them to the selected catalog record.
            </div>
          )}
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Persisted payload preview
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            Validate a channel payload
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A preview is saved to the channel listing record. If it is
            incomplete or the channel is not enabled, it is also routed to the
            exception queue.
          </p>
          <div className="mt-5 grid min-w-0 gap-3">
            <select
              value={selectedProductId}
              onChange={event =>
                setSelectedProductId(
                  event.target.value ? Number(event.target.value) : ""
                )
              }
              className="h-10 w-full min-w-0 truncate rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a catalog record</option>
              {(catalog.data ?? []).map(product => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.title}
                </option>
              ))}
            </select>
            <select
              value={selectedChannel}
              onChange={event =>
                setSelectedChannel(event.target.value as typeof selectedChannel)
              }
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="ebay">eBay</option>
              <option value="google_merchant">Google Merchant</option>
              <option value="facebook_marketplace">Facebook Marketplace</option>
              <option value="mercari">Mercari</option>
              <option value="poshmark">Poshmark</option>
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={event => setPrice(Number(event.target.value))}
              className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <Button
              disabled={!selectedProductId || preview.isPending}
              onClick={() =>
                selectedProductId &&
                preview.mutate({
                  productId: selectedProductId,
                  channelCode: selectedChannel,
                  price,
                })
              }
              className="gap-2"
            >
              {preview.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}{" "}
              Save preview & run preflight
            </Button>
            {preview.error ? (
              <p className="text-sm text-destructive">
                {preview.error.message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Preflight result
          </p>
          {preview.data ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">
                  {preview.data.channel.displayName} payload
                </p>
                <Badge
                  variant={
                    preview.data.preflight.ready ? "default" : "secondary"
                  }
                >
                  {preview.data.state}
                </Badge>
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(preview.data.payload, null, 2)}
              </pre>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  VALIDATION
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-700">
                  {preview.data.preflight.errors.length ? (
                    preview.data.preflight.errors.map(error => (
                      <li key={error}>{error}</li>
                    ))
                  ) : (
                    <li>Preflight passed; listing is approved and ready.</li>
                  )}
                </ul>
              </div>
              <Button
                variant="outline"
                disabled={approval.isPending}
                onClick={() =>
                  approval.mutate({ listingId: preview.data.listingId })
                }
                className="gap-2"
              >
                {approval.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}{" "}
                Request recorded approval
              </Button>
              {approval.data ? (
                <p className="text-sm text-emerald-700">
                  Approval request recorded for review.
                </p>
              ) : null}
              {approval.error ? (
                <p className="text-sm text-destructive">
                  {approval.error.message}
                </p>
              ) : null}
              {preview.data.channel.code === "ebay" ? (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <Button
                    size="lg"
                    data-testid="publish-to-ebay"
                    disabled={
                      preview.data.state !== "approved" ||
                      publish.isPending ||
                      publish.data?.published === true
                    }
                    onClick={() => {
                      if (
                        window.confirm(
                          "Publish this listing live on eBay now? Your stock will be held for it."
                        )
                      ) {
                        publish.mutate({ listingId: preview.data.listingId });
                      }
                    }}
                    className="w-full gap-2 text-base"
                  >
                    {publish.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}{" "}
                    Publish to eBay
                  </Button>
                  {preview.data.state !== "approved" &&
                  publish.data?.published !== true ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      This unlocks once the listing is approved. After you
                      approve it on the Activity ledger, save the preview again
                      here.
                    </p>
                  ) : null}
                  {publish.data?.published ? (
                    <p
                      data-testid="publish-result"
                      className="text-base font-medium text-emerald-800"
                    >
                      Live on eBay. Listing {publish.data.externalListingId},
                      offer {publish.data.externalOfferId}.
                    </p>
                  ) : null}
                  {publish.data && !publish.data.published ? (
                    <p
                      role="alert"
                      data-testid="publish-error"
                      className="text-base font-medium text-destructive"
                    >
                      Not published. {publish.data.error} The listing is still
                      approved.
                    </p>
                  ) : null}
                  {publish.error ? (
                    <p role="alert" className="text-base text-destructive">
                      {publish.error.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
              Choose a catalog record and channel to create a stored payload
              preview and see every blocking validation rule.
            </div>
          )}
        </div>
      </section>
    </OperationsPage>
  );
}
