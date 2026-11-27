import { OperationsPage } from "@/components/OperationsPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Edit3,
  FileCheck2,
  ImagePlus,
  Loader2,
  PackagePlus,
  Search,
} from "lucide-react";
import { FormEvent, useState } from "react";

type EditFormState = {
  productId: number;
  title: string;
  upc: string;
  condition: string;
  conditionNotes: string;
  brandOrStudio: string;
  format: string;
  description: string;
  attributesText: string;
};

type MediaFormState = {
  url: string;
  altText: string;
  isPrimary: boolean;
};

function parseAttributesInput(
  raw: string
): Record<string, unknown> | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Attributes must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

export default function Catalog() {
  const utils = trpc.useUtils();
  const catalog = trpc.catalog.list.useQuery();
  const [form, setForm] = useState({
    sku: "",
    upc: "",
    title: "",
    condition: "Good",
    brandOrStudio: "",
    format: "DVD",
    description: "",
  });
  const [editing, setEditing] = useState<EditFormState | null>(null);
  const [editAttrError, setEditAttrError] = useState<string | null>(null);
  const [activeMediaProductId, setActiveMediaProductId] = useState<
    number | null
  >(null);
  const [mediaForms, setMediaForms] = useState<Record<number, MediaFormState>>(
    {}
  );

  const invalidateCatalog = () => {
    utils.catalog.list.invalidate();
    utils.operations.overview.invalidate();
  };

  const create = trpc.catalog.create.useMutation({
    onSuccess: () => {
      invalidateCatalog();
      setForm({
        sku: "",
        upc: "",
        title: "",
        condition: "Good",
        brandOrStudio: "",
        format: "DVD",
        description: "",
      });
    },
  });
  const update = trpc.catalog.update.useMutation({
    onSuccess: () => {
      invalidateCatalog();
      setEditing(null);
      setEditAttrError(null);
    },
  });
  const verify = trpc.catalog.verify.useMutation({
    onSuccess: () => {
      invalidateCatalog();
    },
  });
  const addMedia = trpc.catalog.addMedia.useMutation({
    onSuccess: (_data, variables) => {
      invalidateCatalog();
      setMediaForms(prev => ({
        ...prev,
        [variables.productId]: { url: "", altText: "", isPrimary: false },
      }));
    },
  });
  const verifyMedia = trpc.catalog.verifyMedia.useMutation({
    onSuccess: () => {
      invalidateCatalog();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({
      ...form,
      upc: form.upc || undefined,
      brandOrStudio: form.brandOrStudio || undefined,
      format: form.format || undefined,
      description: form.description || undefined,
    });
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setEditAttrError(null);
    let attributes: Record<string, unknown> | null | undefined;
    try {
      attributes = parseAttributesInput(editing.attributesText);
    } catch (err) {
      setEditAttrError(
        err instanceof Error ? err.message : "Invalid JSON attributes."
      );
      return;
    }
    update.mutate({
      productId: editing.productId,
      title: editing.title,
      upc: editing.upc || null,
      condition: editing.condition,
      conditionNotes: editing.conditionNotes || null,
      brandOrStudio: editing.brandOrStudio || null,
      format: editing.format || null,
      description: editing.description || null,
      attributes,
    });
  };

  const getMediaForm = (productId: number): MediaFormState =>
    mediaForms[productId] ?? { url: "", altText: "", isPrimary: false };

  const setMediaForm = (productId: number, next: MediaFormState) => {
    setMediaForms(prev => ({ ...prev, [productId]: next }));
  };

  const submitMedia = (event: FormEvent, productId: number) => {
    event.preventDefault();
    const current = getMediaForm(productId);
    if (!current.url.trim()) return;
    addMedia.mutate({
      productId,
      url: current.url.trim(),
      altText: current.altText.trim() || undefined,
      mediaType: "image",
      isPrimary: current.isPrimary,
    });
  };

  return (
    <OperationsPage
      eyebrow="Canonical records"
      title="Catalog control"
      description="Create, edit, attach media to, and verify the product records that drive every channel payload. Unverified records or records without a verified image cannot pass listing preflight."
    >
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">New catalog record</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter confirmed information only. Inventory begins at zero until
              it is received through the ledger.
            </p>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.sku}
              onChange={event => setForm({ ...form, sku: event.target.value })}
              placeholder="SKU"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <input
              value={form.upc}
              onChange={event => setForm({ ...form, upc: event.target.value })}
              placeholder="UPC (optional)"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <input
              required
              value={form.title}
              onChange={event =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Verified product title"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:col-span-2"
            />
            <select
              value={form.condition}
              onChange={event =>
                setForm({ ...form, condition: event.target.value })
              }
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option>New</option>
              <option>Like New</option>
              <option>Very Good</option>
              <option>Good</option>
              <option>Acceptable</option>
            </select>
            <input
              value={form.format}
              onChange={event =>
                setForm({ ...form, format: event.target.value })
              }
              placeholder="Format"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <input
              value={form.brandOrStudio}
              onChange={event =>
                setForm({ ...form, brandOrStudio: event.target.value })
              }
              placeholder="Brand or studio"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={event =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Factual description (optional)"
              className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Button disabled={create.isPending} className="gap-2">
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackagePlus className="h-4 w-4" />
                )}{" "}
                Create record
              </Button>
              {create.error ? (
                <p className="mt-2 text-sm text-destructive">
                  {create.error.message}
                </p>
              ) : null}
            </div>
          </form>
        </section>
        <aside className="rounded-2xl bg-slate-950 p-6 text-slate-50 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Verification rule
          </p>
          <FileCheck2 className="mt-6 h-9 w-9 text-emerald-300" />
          <h2 className="mt-5 text-xl font-semibold">
            Facts before draft copy
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Titles, condition, item specifics, media, and descriptions must be
            supported by the catalog record. Attach and verify at least one
            product image so listing preflight passes imageCount &gt;= 1.
          </p>
          <Badge className="mt-6 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15">
            Review required
          </Badge>
        </aside>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Catalog queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit canonical facts, attach and verify image URLs, and verify
              records before sending them to the listing desk.
            </p>
          </div>
          <Badge variant="outline">{catalog.data?.length ?? 0} records</Badge>
        </div>

        {catalog.isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog
          </div>
        ) : catalog.data?.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Condition</th>
                  <th className="pb-3 font-medium">Media</th>
                  <th className="pb-3 font-medium">Verification</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalog.data.map(product => {
                  const mediaList = product.media ?? [];
                  const verifiedImageCount = mediaList.filter(
                    item => item.mediaType === "image" && item.verified
                  ).length;
                  const isEditingThis = editing?.productId === product.id;
                  const isManagingMedia = activeMediaProductId === product.id;
                  const mediaForm = getMediaForm(product.id);

                  return (
                    <tr
                      key={product.id}
                      data-testid={`catalog-row-${product.sku}`}
                      className="border-b border-border/70 align-top last:border-0"
                    >
                      <td className="py-4 font-mono text-xs">{product.sku}</td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">{product.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.upc || "No UPC"} ·{" "}
                          {product.format || "No format"} ·{" "}
                          {product.brandOrStudio || "No brand/studio"}
                        </p>
                        {product.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.description}
                          </p>
                        ) : null}
                        {product.conditionNotes ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Condition notes: {product.conditionNotes}
                          </p>
                        ) : null}

                        {isEditingThis && editing ? (
                          <form
                            onSubmit={submitEdit}
                            data-testid={`catalog-edit-form-${product.id}`}
                            className="mt-4 grid gap-2 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2"
                          >
                            <input
                              required
                              value={editing.title}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  title: event.target.value,
                                })
                              }
                              placeholder="Verified product title"
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs sm:col-span-2"
                            />
                            <input
                              value={editing.upc}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  upc: event.target.value,
                                })
                              }
                              placeholder="UPC"
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                            />
                            <select
                              value={editing.condition}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  condition: event.target.value,
                                })
                              }
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                            >
                              <option>New</option>
                              <option>Like New</option>
                              <option>Very Good</option>
                              <option>Good</option>
                              <option>Acceptable</option>
                            </select>
                            <input
                              value={editing.format}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  format: event.target.value,
                                })
                              }
                              placeholder="Format"
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                            />
                            <input
                              value={editing.brandOrStudio}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  brandOrStudio: event.target.value,
                                })
                              }
                              placeholder="Brand or studio"
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                            />
                            <input
                              value={editing.conditionNotes}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  conditionNotes: event.target.value,
                                })
                              }
                              placeholder="Condition notes (optional)"
                              className="h-9 rounded-lg border border-input bg-background px-3 text-xs sm:col-span-2"
                            />
                            <textarea
                              value={editing.description}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  description: event.target.value,
                                })
                              }
                              placeholder="Factual description"
                              className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-xs sm:col-span-2"
                            />
                            <textarea
                              value={editing.attributesText}
                              onChange={event =>
                                setEditing({
                                  ...editing,
                                  attributesText: event.target.value,
                                })
                              }
                              placeholder='Attributes JSON (optional, e.g. {"edition":"Collector"})'
                              className="min-h-16 rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs sm:col-span-2"
                            />
                            {editAttrError ? (
                              <p className="text-xs text-destructive sm:col-span-2">
                                {editAttrError}
                              </p>
                            ) : null}
                            {update.error ? (
                              <p className="text-xs text-destructive sm:col-span-2">
                                {update.error.message}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <Button
                                type="submit"
                                size="sm"
                                disabled={update.isPending}
                              >
                                Save facts
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditing(null);
                                  setEditAttrError(null);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : null}

                        {isManagingMedia ? (
                          <div
                            data-testid={`catalog-media-panel-${product.id}`}
                            className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              Product media ({verifiedImageCount} verified of{" "}
                              {mediaList.length})
                            </p>
                            {mediaList.length ? (
                              <ul className="space-y-2">
                                {mediaList.map(media => (
                                  <li
                                    key={media.id}
                                    data-testid={`catalog-media-item-${media.id}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-mono">
                                        {media.url}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {media.altText || "No alt text"} ·{" "}
                                        {media.mediaType}
                                        {media.isPrimary ? " · Primary" : ""}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          media.verified
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {media.verified
                                          ? "Verified media"
                                          : "Unverified"}
                                      </Badge>
                                      {!media.verified ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          disabled={verifyMedia.isPending}
                                          onClick={() =>
                                            verifyMedia.mutate({
                                              mediaId: media.id,
                                              productId: product.id,
                                            })
                                          }
                                        >
                                          Verify media
                                        </Button>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No media attached yet. Attach and verify at
                                least one image URL.
                              </p>
                            )}

                            <form
                              onSubmit={event => submitMedia(event, product.id)}
                              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                            >
                              <input
                                required
                                type="url"
                                value={mediaForm.url}
                                onChange={event =>
                                  setMediaForm(product.id, {
                                    ...mediaForm,
                                    url: event.target.value,
                                  })
                                }
                                placeholder="https://... image URL"
                                className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                              />
                              <input
                                value={mediaForm.altText}
                                onChange={event =>
                                  setMediaForm(product.id, {
                                    ...mediaForm,
                                    altText: event.target.value,
                                  })
                                }
                                placeholder="Alt text (optional)"
                                className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={addMedia.isPending}
                                className="gap-1"
                              >
                                <ImagePlus className="h-3.5 w-3.5" /> Attach
                                image
                              </Button>
                            </form>
                            {addMedia.error ? (
                              <p className="text-xs text-destructive">
                                {addMedia.error.message}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-4">{product.condition}</td>
                      <td className="py-4">
                        <Badge
                          variant={
                            verifiedImageCount >= 1 ? "default" : "secondary"
                          }
                        >
                          {verifiedImageCount} verified / {mediaList.length}{" "}
                          total
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            product.verificationStatus === "verified"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {product.verificationStatus === "verified"
                            ? "Verified"
                            : "Needs review"}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditAttrError(null);
                              setEditing(
                                isEditingThis
                                  ? null
                                  : {
                                      productId: product.id,
                                      title: product.title,
                                      upc: product.upc ?? "",
                                      condition: product.condition,
                                      conditionNotes:
                                        product.conditionNotes ?? "",
                                      brandOrStudio:
                                        product.brandOrStudio ?? "",
                                      format: product.format ?? "",
                                      description: product.description ?? "",
                                      attributesText: product.attributes
                                        ? JSON.stringify(product.attributes)
                                        : "",
                                    }
                              );
                            }}
                            className="gap-1"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit facts
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setActiveMediaProductId(
                                isManagingMedia ? null : product.id
                              )
                            }
                            className="gap-1"
                          >
                            <ImagePlus className="h-3.5 w-3.5" /> Media (
                            {mediaList.length})
                          </Button>
                          {product.verificationStatus !== "verified" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={verify.isPending}
                              onClick={() =>
                                verify.mutate({ productId: product.id })
                              }
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground/70" />
            <h3 className="mt-4 font-medium">No catalog records yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Create a verified product record to begin a controlled marketplace
              workflow.
            </p>
          </div>
        )}
      </section>
    </OperationsPage>
  );
}
