/**
 * Publish an approved eBay listing: reserve stock, then run the three Sell
 * Inventory calls (item upsert, offer create, offer publish) through an
 * injected client, and record the result on the listing.
 *
 * Rules this file keeps:
 *   - The eBay client is injected. server/ebayClient.ts (ticket e2) is not
 *     imported here, so this ticket does not depend on it. Until a client is
 *     wired in, every publish stops before it reserves stock or mints a token,
 *     records a plain error on the listing, and leaves it approved.
 *   - A listing is claimed with one conditional update (approved to
 *     submitted), so two clicks cannot publish the same listing twice.
 *   - Any eBay failure releases the reservation, puts the listing back to
 *     approved, and shows the error on the listing. An offer that eBay already
 *     created is remembered, so a retry publishes that offer instead of making
 *     a second one.
 *   - Errors shown or stored are plain sentences. The access token is never
 *     logged, stored or returned.
 */
import { and, eq } from "drizzle-orm";
import {
  activityLogs,
  channelListings,
  marketplaceChannels,
} from "../drizzle/schema";
import { getAffectedRows, getDb, moveInventory } from "./db";
import { getEbayUserAccessToken, type EbayUserAccessToken } from "./ebayOAuth";

/** What the client reports when eBay (or the network) says no. */
export type EbayPublishFailure = {
  ok: false;
  message: string;
  status?: number | null;
  retryable?: boolean;
};

/**
 * The three calls from ticket e2's server/ebayClient.ts, without its optional
 * `deps` argument. The real client is assignable to this as it stands.
 */
export type EbayPublishClient = {
  upsertEbayInventoryItem(
    sku: string,
    payload: unknown,
    token: string
  ): Promise<{ ok: true } | EbayPublishFailure>;
  createEbayOffer(
    payload: unknown,
    token: string
  ): Promise<{ ok: true; offerId: string } | EbayPublishFailure>;
  publishEbayOffer(
    offerId: string,
    token: string
  ): Promise<{ ok: true; listingId: string } | EbayPublishFailure>;
};

export type PublishListingDeps = {
  /** Leave out until ticket e2's client is wired in. */
  client?: EbayPublishClient;
  getAccessToken: () => Promise<EbayUserAccessToken>;
};

export type PublishListingResult =
  | {
      published: true;
      state: "active";
      listingId: number;
      externalOfferId: string;
      externalListingId: string;
    }
  | {
      published: false;
      state: "approved";
      listingId: number;
      error: string;
      externalOfferId: string | null;
    };

/**
 * Deps the router uses. No client yet: when ticket e2 lands, set `client` here
 * to { upsertEbayInventoryItem, createEbayOffer, publishEbayOffer }.
 */
export function getDefaultPublishDeps(): PublishListingDeps {
  return { client: undefined, getAccessToken: () => getEbayUserAccessToken() };
}

const NO_CLIENT_MESSAGE =
  "The eBay publish client is not connected yet, so nothing was sent to eBay.";
const GENERIC_FAILURE_MESSAGE = "The eBay publish step could not be completed.";

type ListingPayload = {
  workflowCorrelationId?: string;
  ebayInventoryItem?: { sku?: unknown } & Record<string, unknown>;
  ebayOffer?: { sku?: unknown; availableQuantity?: unknown } & Record<
    string,
    unknown
  >;
};

/** A short plain sentence for the listing. Never anything token-shaped. */
function safeMessage(error: unknown, token = ""): string {
  const raw =
    error instanceof Error && error.message
      ? error.message
      : typeof error === "string" && error
        ? error
        : GENERIC_FAILURE_MESSAGE;
  const scrubbed = token ? raw.split(token).join("[REDACTED]") : raw;
  return scrubbed.slice(0, 300);
}

export async function publishListing(
  input: { listingId: number; actorUserId: number },
  deps: PublishListingDeps = getDefaultPublishDeps()
): Promise<PublishListingResult> {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");

  const [listing] = await db
    .select()
    .from(channelListings)
    .where(eq(channelListings.id, input.listingId))
    .limit(1);
  if (!listing) throw new Error("The selected listing is unavailable.");
  if (listing.state !== "approved") {
    throw new Error(
      "Only an approved listing can be published. Request and grant approval first."
    );
  }
  if (listing.externalListingId) {
    throw new Error("This listing is already live on eBay.");
  }
  const [channel] = await db
    .select()
    .from(marketplaceChannels)
    .where(eq(marketplaceChannels.id, listing.channelId))
    .limit(1);
  if (channel?.code !== "ebay") {
    throw new Error("Publish is only available for eBay listings.");
  }
  const payload = (listing.payload ?? {}) as ListingPayload;
  const item = payload.ebayInventoryItem;
  const offer = payload.ebayOffer;
  const sku = typeof item?.sku === "string" ? item.sku : "";
  const quantity = Number(offer?.availableQuantity);
  if (!item || !offer || !sku || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error(
      "The saved listing payload is incomplete. Save the preview again before publishing."
    );
  }

  const correlationId =
    payload.workflowCorrelationId ??
    `publish-listing-${listing.id}-${Date.now()}`;
  const priorOfferId = listing.externalOfferId ?? null;

  async function log(
    action: string,
    outcome: "succeeded" | "failed" | "blocked",
    details: Record<string, unknown>
  ) {
    await db!.insert(activityLogs).values({
      category: "listing",
      action,
      subjectType: "listing",
      subjectId: listing!.id,
      actorUserId: input.actorUserId,
      correlationId,
      outcome,
      details,
    });
  }

  async function fail(
    message: string,
    options: { offerId: string | null; reserved: boolean }
  ): Promise<PublishListingResult> {
    let released = !options.reserved;
    if (options.reserved) {
      try {
        await moveInventory({
          productId: listing!.productId,
          movementType: "release",
          quantity,
          actorUserId: input.actorUserId,
        });
        released = true;
      } catch {
        released = false;
      }
    }
    const shown = released
      ? message
      : `${message} The stock reservation could not be released; check Inventory.`;
    await db!
      .update(channelListings)
      .set({
        state: "approved",
        externalOfferId: options.offerId,
        validationErrors: [shown],
      })
      .where(eq(channelListings.id, listing!.id));
    await log("listing_publish_failed", "failed", {
      error: shown,
      reservationReleased: released,
    });
    return {
      published: false,
      state: "approved",
      listingId: listing!.id,
      error: shown,
      externalOfferId: options.offerId,
    };
  }

  // Claim the listing. Only one caller can move it from approved to submitted.
  const claim = await db
    .update(channelListings)
    .set({ state: "submitted" })
    .where(
      and(
        eq(channelListings.id, listing.id),
        eq(channelListings.state, "approved")
      )
    );
  if (getAffectedRows(claim) !== 1) {
    throw new Error(
      "Only an approved listing can be published. This listing is already being published."
    );
  }

  const client = deps.client;
  if (!client) {
    return fail(NO_CLIENT_MESSAGE, { offerId: priorOfferId, reserved: false });
  }

  let token = "";
  try {
    token = (await deps.getAccessToken()).accessToken;
  } catch (error) {
    return fail(safeMessage(error), { offerId: priorOfferId, reserved: false });
  }

  try {
    await moveInventory({
      productId: listing.productId,
      movementType: "reserve",
      quantity,
      actorUserId: input.actorUserId,
    });
  } catch (error) {
    return fail(safeMessage(error, token), {
      offerId: priorOfferId,
      reserved: false,
    });
  }

  let offerId = priorOfferId;
  try {
    const upserted = await client.upsertEbayInventoryItem(sku, item, token);
    if (!upserted.ok) {
      return fail(safeMessage(upserted.message, token), {
        offerId,
        reserved: true,
      });
    }
    if (!offerId) {
      const created = await client.createEbayOffer(offer, token);
      if (!created.ok) {
        return fail(safeMessage(created.message, token), {
          offerId,
          reserved: true,
        });
      }
      offerId = created.offerId;
      // Remember the offer now: if publish fails, a retry reuses it.
      await db
        .update(channelListings)
        .set({ externalOfferId: offerId })
        .where(eq(channelListings.id, listing.id));
    }
    const published = await client.publishEbayOffer(offerId, token);
    if (!published.ok) {
      return fail(safeMessage(published.message, token), {
        offerId,
        reserved: true,
      });
    }
    await db
      .update(channelListings)
      .set({
        state: "active",
        externalOfferId: offerId,
        externalListingId: published.listingId,
        validationErrors: [],
        lastSubmittedAt: new Date(),
      })
      .where(eq(channelListings.id, listing.id));
    await log("listing_published", "succeeded", {
      channel: "ebay",
      externalOfferId: offerId,
      externalListingId: published.listingId,
      reservedQuantity: quantity,
    });
    return {
      published: true,
      state: "active",
      listingId: listing.id,
      externalOfferId: offerId,
      externalListingId: published.listingId,
    };
  } catch (error) {
    return fail(safeMessage(error, token), { offerId, reserved: true });
  }
}
