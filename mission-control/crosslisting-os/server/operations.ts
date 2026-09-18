export const channelBlueprint = [
  {
    code: "ebay",
    displayName: "eBay",
    capability: "api" as const,
    initialMode: "review" as const,
    requiredSecrets: ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REFRESH_TOKEN"],
  },
  {
    code: "google_merchant",
    displayName: "Google Merchant",
    capability: "api" as const,
    initialMode: "review" as const,
    requiredSecrets: ["GOOGLE_MERCHANT_CLIENT_ID", "GOOGLE_MERCHANT_CLIENT_SECRET", "GOOGLE_MERCHANT_REFRESH_TOKEN", "GOOGLE_MERCHANT_ACCOUNT_ID"],
  },
  {
    code: "facebook_marketplace",
    displayName: "Facebook Marketplace",
    capability: "conditional" as const,
    initialMode: "review" as const,
    requiredSecrets: ["FACEBOOK_MARKETPLACE_ACCESS_TOKEN"],
  },
  {
    code: "mercari",
    displayName: "Mercari",
    capability: "conditional" as const,
    initialMode: "review" as const,
    requiredSecrets: ["MERCARI_API_ACCESS_TOKEN"],
  },
  {
    code: "poshmark",
    displayName: "Poshmark",
    capability: "prepared" as const,
    initialMode: "review" as const,
    requiredSecrets: ["POSHMARK_ACCESS_TOKEN"],
  },
] as const;

export type ChannelCode = (typeof channelBlueprint)[number]["code"];
export type ChannelCapability = (typeof channelBlueprint)[number]["capability"];

export type ListingPreflightInput = {
  verificationStatus: "needs_review" | "verified" | "blocked";
  title?: string | null;
  description?: string | null;
  price?: number | null;
  availableQuantity?: number | null;
  imageCount?: number | null;
  approvalStatus: "pending" | "approved" | "rejected";
  capability: ChannelCapability;
  channelEnabled: boolean;
};

export function validateListingPreflight(input: ListingPreflightInput) {
  const errors: string[] = [];
  if (input.verificationStatus !== "verified") errors.push("Catalog record requires factual verification.");
  if (!input.title?.trim()) errors.push("Listing title is required.");
  if (!input.description?.trim()) errors.push("Listing description is required.");
  if (!input.price || input.price <= 0) errors.push("A positive listing price is required.");
  if (!input.availableQuantity || input.availableQuantity <= 0) errors.push("Available inventory is required.");
  if (!input.imageCount || input.imageCount < 1) errors.push("At least one verified image is required.");
  if (input.approvalStatus !== "approved") errors.push("An approved request is required before submission.");
  if (!input.channelEnabled) errors.push("The channel is disabled by LLC configuration.");
  if (input.capability !== "api") errors.push("This channel is limited to a prepared review workflow.");
  return { ready: errors.length === 0, errors };
}

export function getSafeCredentialState(requiredSecrets: readonly string[]) {
  const configuredCount = requiredSecrets.filter(key => Boolean(process.env[key]?.trim())).length;
  return {
    configured: configuredCount === requiredSecrets.length,
    configuredCount,
    requiredCount: requiredSecrets.length,
  };
}

export function buildSafeChannelStatus() {
  return channelBlueprint.map(channel => ({
    code: channel.code,
    displayName: channel.displayName,
    capability: channel.capability,
    operationMode: channel.initialMode,
    enabled: false,
    credentialState: getSafeCredentialState(channel.requiredSecrets),
  }));
}

export type InventoryMovementType = "receive" | "reserve" | "release" | "sale";

export function canApplyInventoryMovement(input: { onHand: number; reserved: number; quantity: number; movementType: InventoryMovementType }) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) return false;
  if (input.movementType === "receive") return true;
  if (input.movementType === "reserve") return input.onHand - input.reserved >= input.quantity;
  if (input.movementType === "release") return input.reserved >= input.quantity;
  return input.onHand >= input.quantity && input.reserved >= input.quantity;
}

export function buildChannelPayload(input: {
  sku: string;
  upc: string | null;
  title: string;
  description: string | null;
  condition: string;
  format: string | null;
  brandOrStudio: string | null;
  price: number;
  quantity: number;
  imageUrls: string[];
  channelCode: ChannelCode;
}) {
  return {
    channel: input.channelCode,
    sku: input.sku,
    upc: input.upc,
    title: input.title,
    description: input.description,
    condition: input.condition,
    format: input.format,
    brandOrStudio: input.brandOrStudio,
    price: input.price,
    quantity: input.quantity,
    imageUrls: input.imageUrls,
  };
}

export function decideChannelSaleReconciliation(input: { eventAlreadyRecorded: boolean; onHand: number; reserved: number; quantity: number }) {
  if (input.eventAlreadyRecorded) return "duplicate" as const;
  return canApplyInventoryMovement({ onHand: input.onHand, reserved: input.reserved, quantity: input.quantity, movementType: "sale" })
    ? "apply" as const
    : "block" as const;
}

export function synchronizePayloadQuantity(payload: Record<string, unknown> | null, availableQuantity: number) {
  return { ...(payload ?? {}), quantity: Math.max(0, availableQuantity) };
}
