import { describe, expect, it } from "vitest";
import {
  buildChannelPayload,
  canApplyInventoryMovement,
  decideChannelSaleReconciliation,
  getSafeCredentialState,
  synchronizePayloadQuantity,
  validateListingPreflight,
} from "./operations";

describe("operations guardrails", () => {
  it("prevents reservations that would make available inventory negative", () => {
    expect(
      canApplyInventoryMovement({
        onHand: 3,
        reserved: 1,
        quantity: 2,
        movementType: "reserve",
      })
    ).toBe(true);
    expect(
      canApplyInventoryMovement({
        onHand: 3,
        reserved: 1,
        quantity: 3,
        movementType: "reserve",
      })
    ).toBe(false);
    expect(
      canApplyInventoryMovement({
        onHand: 3,
        reserved: 1,
        quantity: 2,
        movementType: "sale",
      })
    ).toBe(false);
    expect(
      canApplyInventoryMovement({
        onHand: 3,
        reserved: 2,
        quantity: 2,
        movementType: "sale",
      })
    ).toBe(true);
  });

  it("blocks listing submission until API capability, approval, and validation all pass", () => {
    const ready = validateListingPreflight({
      verificationStatus: "verified",
      title: "Verified title",
      description: "Verified description",
      price: 12,
      availableQuantity: 1,
      imageCount: 1,
      approvalStatus: "approved",
      capability: "api",
      channelEnabled: true,
    });
    expect(ready.ready).toBe(true);
    expect(
      validateListingPreflight({
        verificationStatus: "verified",
        title: "Verified title",
        description: "Verified description",
        price: 12,
        availableQuantity: 1,
        imageCount: 1,
        approvalStatus: "approved",
        capability: "prepared",
        channelEnabled: true,
      }).ready
    ).toBe(false);
    expect(
      validateListingPreflight({
        verificationStatus: "verified",
        title: "Verified title",
        description: "Verified description",
        price: 12,
        availableQuantity: 1,
        imageCount: 1,
        approvalStatus: "pending",
        capability: "api",
        channelEnabled: true,
      }).ready
    ).toBe(false);
  });

  it("exposes credential status without exposing a credential value", () => {
    process.env.TEST_SERVER_ONLY_CREDENTIAL = "server-only-test-value";
    const status = getSafeCredentialState(["TEST_SERVER_ONLY_CREDENTIAL"]);
    expect(status).toEqual({
      configured: true,
      configuredCount: 1,
      requiredCount: 1,
    });
    expect(status).not.toHaveProperty("value");
    expect(JSON.stringify(status)).not.toContain("server-only-test-value");
    delete process.env.TEST_SERVER_ONLY_CREDENTIAL;
  });

  it("keeps a prepared-channel listing ineligible for submission", () => {
    const result = validateListingPreflight({
      verificationStatus: "verified",
      title: "Verified title",
      description: "Verified description",
      price: 12,
      availableQuantity: 1,
      imageCount: 1,
      approvalStatus: "approved",
      capability: "prepared",
      channelEnabled: true,
    });
    expect(result.ready).toBe(false);
    expect(result.errors).toContain(
      "This channel is limited to a prepared review workflow."
    );
  });

  it("creates a channel-specific preview from supplied canonical facts", () => {
    expect(
      buildChannelPayload({
        sku: "SKU-1",
        upc: "012345678901",
        title: "Verified item",
        description: "Verified facts",
        condition: "Good",
        format: "DVD",
        brandOrStudio: "Studio",
        price: 10,
        quantity: 1,
        imageUrls: ["https://example.com/image.jpg"],
        channelCode: "ebay",
      })
    ).toMatchObject({ channel: "ebay", sku: "SKU-1", price: 10, quantity: 1 });
  });

  it("maps catalog conditions to eBay ConditionEnum values and builds ebayInventoryItem and ebayOffer with EBAY_US USD pricingSummary and policy_mappings", () => {
    const conditionExpectations: Array<[string, string]> = [
      ["New", "NEW"],
      ["Like New", "LIKE_NEW"],
      ["Very Good", "USED_VERY_GOOD"],
      ["Used - Very Good", "USED_VERY_GOOD"],
      ["Good", "USED_GOOD"],
      ["Acceptable", "USED_ACCEPTABLE"],
    ];

    for (const [catalogCondition, expectedEnum] of conditionExpectations) {
      const payload = buildChannelPayload({
        sku: "SKU-EBAY-100",
        upc: "012345678905",
        title: "Verified Criterion Blu-ray",
        description: "Disc and booklet verified in person.",
        condition: catalogCondition,
        conditionNotes: "Case has minor shelf wear.",
        format: "Blu-ray",
        brandOrStudio: "Criterion",
        price: 29.95,
        quantity: 3,
        imageUrls: [
          "https://example.com/front.jpg",
          "https://example.com/back.jpg",
        ],
        channelCode: "ebay",
        policyMappings: [
          {
            policyType: "fulfillment",
            policyKey: "default",
            policyValue: "FULFILL-001",
            active: true,
          },
          {
            policyType: "payment",
            policyKey: "default",
            policyValue: "PAY-002",
            active: true,
          },
          {
            policyType: "return",
            policyKey: "default",
            policyValue: "RET-003",
            active: true,
          },
          {
            policyType: "location",
            policyKey: "default",
            policyValue: "LOC-WAREHOUSE-1",
            active: true,
          },
          {
            policyType: "category",
            policyKey: "default",
            policyValue: "617",
            active: true,
          },
        ],
      }) as Record<string, any>;

      expect(payload.ebayInventoryItem).toBeDefined();
      expect(payload.ebayInventoryItem.condition).toBe(expectedEnum);
      expect(payload.ebayInventoryItem.conditionDescription).toBe(
        "Case has minor shelf wear."
      );
      expect(payload.ebayInventoryItem.availability).toEqual({
        shipToLocationAvailability: { quantity: 3 },
      });
      expect(payload.ebayInventoryItem.product).toMatchObject({
        title: "Verified Criterion Blu-ray",
        description: "Disc and booklet verified in person.",
        imageUrls: [
          "https://example.com/front.jpg",
          "https://example.com/back.jpg",
        ],
        brand: "Criterion",
        upc: ["012345678905"],
        aspects: {
          Brand: ["Criterion"],
          Format: ["Blu-ray"],
        },
      });

      expect(payload.ebayOffer).toEqual({
        sku: "SKU-EBAY-100",
        marketplaceId: "EBAY_US",
        format: "FIXED_PRICE",
        availableQuantity: 3,
        categoryId: "617",
        merchantLocationKey: "LOC-WAREHOUSE-1",
        listingDescription: "Disc and booklet verified in person.",
        pricingSummary: {
          price: {
            value: "29.95",
            currency: "USD",
          },
        },
        listingPolicies: {
          fulfillmentPolicyId: "FULFILL-001",
          paymentPolicyId: "PAY-002",
          returnPolicyId: "RET-003",
        },
      });

      expect(payload.policy_mappings).toEqual({
        fulfillmentPolicyId: "FULFILL-001",
        paymentPolicyId: "PAY-002",
        returnPolicyId: "RET-003",
        merchantLocationKey: "LOC-WAREHOUSE-1",
        categoryId: "617",
      });
    }
  });

  it("makes channel sale ingestion idempotent and blocks an unreserved sale", () => {
    expect(
      decideChannelSaleReconciliation({
        eventAlreadyRecorded: true,
        onHand: 4,
        reserved: 4,
        quantity: 1,
      })
    ).toBe("duplicate");
    expect(
      decideChannelSaleReconciliation({
        eventAlreadyRecorded: false,
        onHand: 4,
        reserved: 4,
        quantity: 1,
      })
    ).toBe("apply");
    expect(
      decideChannelSaleReconciliation({
        eventAlreadyRecorded: false,
        onHand: 4,
        reserved: 0,
        quantity: 1,
      })
    ).toBe("block");
  });

  it("updates a related channel payload quantity after a reconciled sale", () => {
    expect(
      synchronizePayloadQuantity({ channel: "ebay", quantity: 4 }, 1)
    ).toEqual({ channel: "ebay", quantity: 1 });
    expect(
      synchronizePayloadQuantity({ channel: "ebay", quantity: 4 }, -2)
    ).toEqual({ channel: "ebay", quantity: 0 });
  });
});
