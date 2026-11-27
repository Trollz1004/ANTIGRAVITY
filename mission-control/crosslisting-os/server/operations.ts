export const channelBlueprint = [
  {
    code: "ebay",
    displayName: "eBay",
    capability: "api" as const,
    initialMode: "review" as const,
    requiredSecrets: [
      "EBAY_CLIENT_ID",
      "EBAY_CLIENT_SECRET",
      "EBAY_REFRESH_TOKEN",
    ],
  },
  {
    code: "google_merchant",
    displayName: "Google Merchant",
    capability: "api" as const,
    initialMode: "review" as const,
    requiredSecrets: [
      "GOOGLE_MERCHANT_CLIENT_ID",
      "GOOGLE_MERCHANT_CLIENT_SECRET",
      "GOOGLE_MERCHANT_REFRESH_TOKEN",
      "GOOGLE_MERCHANT_ACCOUNT_ID",
    ],
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
  if (input.verificationStatus !== "verified")
    errors.push("Catalog record requires factual verification.");
  if (!input.title?.trim()) errors.push("Listing title is required.");
  if (!input.description?.trim())
    errors.push("Listing description is required.");
  if (!input.price || input.price <= 0)
    errors.push("A positive listing price is required.");
  if (!input.availableQuantity || input.availableQuantity <= 0)
    errors.push("Available inventory is required.");
  if (!input.imageCount || input.imageCount < 1)
    errors.push("At least one verified image is required.");
  if (input.approvalStatus !== "approved")
    errors.push("An approved request is required before submission.");
  if (!input.channelEnabled)
    errors.push("The channel is disabled by LLC configuration.");
  if (input.capability !== "api")
    errors.push("This channel is limited to a prepared review workflow.");
  return { ready: errors.length === 0, errors };
}

export function getSafeCredentialState(requiredSecrets: readonly string[]) {
  const configuredCount = requiredSecrets.filter(key =>
    Boolean(process.env[key]?.trim())
  ).length;
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

export function canApplyInventoryMovement(input: {
  onHand: number;
  reserved: number;
  quantity: number;
  movementType: InventoryMovementType;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) return false;
  if (input.movementType === "receive") return true;
  if (input.movementType === "reserve")
    return input.onHand - input.reserved >= input.quantity;
  if (input.movementType === "release") return input.reserved >= input.quantity;
  return input.onHand >= input.quantity && input.reserved >= input.quantity;
}

export type EbayConditionEnum =
  | "NEW"
  | "LIKE_NEW"
  | "NEW_OTHER"
  | "NEW_WITH_DEFECTS"
  | "MANUFACTURER_REFURBISHED"
  | "CERTIFIED_REFURBISHED"
  | "EXCELLENT_REFURBISHED"
  | "VERY_GOOD_REFURBISHED"
  | "GOOD_REFURBISHED"
  | "SELLER_REFURBISHED"
  | "USED_EXCELLENT"
  | "USED_VERY_GOOD"
  | "USED_GOOD"
  | "USED_ACCEPTABLE"
  | "FOR_PARTS_OR_NOT_WORKING";

const EBAY_CONDITION_LOOKUP: Record<string, EbayConditionEnum> = {
  new: "NEW",
  "brand new": "NEW",
  "like new": "LIKE_NEW",
  like_new: "LIKE_NEW",
  "used - like new": "LIKE_NEW",
  "new other": "NEW_OTHER",
  new_other: "NEW_OTHER",
  "new with defects": "NEW_WITH_DEFECTS",
  new_with_defects: "NEW_WITH_DEFECTS",
  "manufacturer refurbished": "MANUFACTURER_REFURBISHED",
  manufacturer_refurbished: "MANUFACTURER_REFURBISHED",
  "certified refurbished": "CERTIFIED_REFURBISHED",
  certified_refurbished: "CERTIFIED_REFURBISHED",
  "excellent refurbished": "EXCELLENT_REFURBISHED",
  excellent_refurbished: "EXCELLENT_REFURBISHED",
  "very good refurbished": "VERY_GOOD_REFURBISHED",
  very_good_refurbished: "VERY_GOOD_REFURBISHED",
  "good refurbished": "GOOD_REFURBISHED",
  good_refurbished: "GOOD_REFURBISHED",
  "seller refurbished": "SELLER_REFURBISHED",
  seller_refurbished: "SELLER_REFURBISHED",
  refurbished: "SELLER_REFURBISHED",
  excellent: "USED_EXCELLENT",
  "used - excellent": "USED_EXCELLENT",
  used_excellent: "USED_EXCELLENT",
  used: "USED_EXCELLENT",
  "very good": "USED_VERY_GOOD",
  "used - very good": "USED_VERY_GOOD",
  very_good: "USED_VERY_GOOD",
  used_very_good: "USED_VERY_GOOD",
  good: "USED_GOOD",
  "used - good": "USED_GOOD",
  used_good: "USED_GOOD",
  acceptable: "USED_ACCEPTABLE",
  "used - acceptable": "USED_ACCEPTABLE",
  used_acceptable: "USED_ACCEPTABLE",
  "for parts": "FOR_PARTS_OR_NOT_WORKING",
  "for parts or not working": "FOR_PARTS_OR_NOT_WORKING",
  for_parts_or_not_working: "FOR_PARTS_OR_NOT_WORKING",
};

export function mapCatalogConditionToEbayCondition(
  condition: string
): EbayConditionEnum {
  const normalized = condition.trim().toLowerCase().replace(/\s+/g, " ");
  return EBAY_CONDITION_LOOKUP[normalized] ?? "USED_GOOD";
}

export type PolicyMappingEntry = {
  policyType:
    | "fulfillment"
    | "return"
    | "payment"
    | "location"
    | "category"
    | "listing_rule"
    | string;
  policyKey?: string;
  policyValue: string;
  active?: boolean;
};

export type ResolvedEbayPolicyMappings = {
  fulfillmentPolicyId: string | null;
  paymentPolicyId: string | null;
  returnPolicyId: string | null;
  merchantLocationKey: string | null;
  categoryId: string | null;
};

function resolveEbayPolicyMappings(
  policyInput?:
    | readonly PolicyMappingEntry[]
    | Partial<ResolvedEbayPolicyMappings>
    | Record<string, string | null | undefined>
    | null,
  fallbackLocationKey?: string | null
): ResolvedEbayPolicyMappings {
  const resolved: ResolvedEbayPolicyMappings = {
    fulfillmentPolicyId: null,
    paymentPolicyId: null,
    returnPolicyId: null,
    merchantLocationKey: fallbackLocationKey ?? null,
    categoryId: null,
  };

  if (Array.isArray(policyInput)) {
    for (const entry of policyInput) {
      if (!entry || entry.active === false || !entry.policyValue) continue;
      if (entry.policyType === "fulfillment") {
        resolved.fulfillmentPolicyId = entry.policyValue;
      } else if (entry.policyType === "payment") {
        resolved.paymentPolicyId = entry.policyValue;
      } else if (entry.policyType === "return") {
        resolved.returnPolicyId = entry.policyValue;
      } else if (entry.policyType === "location") {
        resolved.merchantLocationKey = entry.policyValue;
      } else if (entry.policyType === "category") {
        resolved.categoryId = entry.policyValue;
      }
    }
    return resolved;
  }

  if (policyInput && typeof policyInput === "object") {
    const record = policyInput as Record<string, string | null | undefined>;
    resolved.fulfillmentPolicyId =
      record.fulfillmentPolicyId ?? record.fulfillment ?? null;
    resolved.paymentPolicyId = record.paymentPolicyId ?? record.payment ?? null;
    resolved.returnPolicyId = record.returnPolicyId ?? record.return ?? null;
    resolved.merchantLocationKey =
      record.merchantLocationKey ??
      record.location ??
      fallbackLocationKey ??
      null;
    resolved.categoryId = record.categoryId ?? record.category ?? null;
  }

  return resolved;
}

function buildEbayAspects(input: {
  brandOrStudio: string | null;
  format: string | null;
  attributes?: Record<string, unknown> | null;
}): Record<string, string[]> {
  const aspects: Record<string, string[]> = {};
  if (input.brandOrStudio?.trim()) {
    aspects.Brand = [input.brandOrStudio.trim()];
  }
  if (input.format?.trim()) {
    aspects.Format = [input.format.trim()];
  }
  if (input.attributes && typeof input.attributes === "object") {
    for (const [key, rawValue] of Object.entries(input.attributes)) {
      if (rawValue === null || rawValue === undefined) continue;
      if (Array.isArray(rawValue)) {
        const values = rawValue
          .map(item => String(item).trim())
          .filter(Boolean);
        if (values.length > 0) aspects[key] = values;
      } else {
        const value = String(rawValue).trim();
        if (value) aspects[key] = [value];
      }
    }
  }
  return aspects;
}

export function buildChannelPayload(input: {
  sku: string;
  upc: string | null;
  title: string;
  description: string | null;
  condition: string;
  conditionNotes?: string | null;
  format: string | null;
  brandOrStudio: string | null;
  attributes?: Record<string, unknown> | null;
  locationKey?: string | null;
  policyMappings?:
    | readonly PolicyMappingEntry[]
    | Partial<ResolvedEbayPolicyMappings>
    | Record<string, string | null | undefined>
    | null;
  policy_mappings?:
    | readonly PolicyMappingEntry[]
    | Partial<ResolvedEbayPolicyMappings>
    | Record<string, string | null | undefined>
    | null;
  price: number;
  quantity: number;
  imageUrls: string[];
  channelCode: ChannelCode;
}) {
  const basePayload = {
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

  if (input.channelCode !== "ebay") {
    return basePayload;
  }

  const ebayCondition = mapCatalogConditionToEbayCondition(input.condition);
  const availableQuantity = Math.max(0, input.quantity);
  const policyMappings = resolveEbayPolicyMappings(
    input.policyMappings ?? input.policy_mappings,
    input.locationKey
  );
  const aspects = buildEbayAspects({
    brandOrStudio: input.brandOrStudio,
    format: input.format,
    attributes: input.attributes,
  });

  const ebayInventoryItem = {
    sku: input.sku,
    condition: ebayCondition,
    ...(input.conditionNotes
      ? { conditionDescription: input.conditionNotes }
      : {}),
    availability: {
      shipToLocationAvailability: {
        quantity: availableQuantity,
      },
    },
    product: {
      title: input.title,
      description: input.description ?? "",
      imageUrls: input.imageUrls,
      ...(input.brandOrStudio ? { brand: input.brandOrStudio } : {}),
      ...(input.upc ? { upc: [input.upc] } : {}),
      aspects,
    },
  };

  const ebayOffer = {
    sku: input.sku,
    marketplaceId: "EBAY_US" as const,
    format: "FIXED_PRICE" as const,
    availableQuantity,
    categoryId: policyMappings.categoryId,
    merchantLocationKey: policyMappings.merchantLocationKey,
    listingDescription: input.description ?? "",
    pricingSummary: {
      price: {
        value: input.price.toFixed(2),
        currency: "USD" as const,
      },
    },
    listingPolicies: {
      fulfillmentPolicyId: policyMappings.fulfillmentPolicyId,
      paymentPolicyId: policyMappings.paymentPolicyId,
      returnPolicyId: policyMappings.returnPolicyId,
    },
  };

  return {
    ...basePayload,
    policy_mappings: policyMappings,
    ebayInventoryItem,
    ebayOffer,
  };
}

export function decideChannelSaleReconciliation(input: {
  eventAlreadyRecorded: boolean;
  onHand: number;
  reserved: number;
  quantity: number;
}) {
  if (input.eventAlreadyRecorded) return "duplicate" as const;
  return canApplyInventoryMovement({
    onHand: input.onHand,
    reserved: input.reserved,
    quantity: input.quantity,
    movementType: "sale",
  })
    ? ("apply" as const)
    : ("block" as const);
}

export function synchronizePayloadQuantity(
  payload: Record<string, unknown> | null,
  availableQuantity: number
) {
  return { ...(payload ?? {}), quantity: Math.max(0, availableQuantity) };
}
