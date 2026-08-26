# Multi-marketplace automation research notes

## Google Merchant Center

Official Merchant API documentation confirms that the Merchant API supports automated account, product, inventory, and report management. It can create and manage data sources and product data, complementing other input methods. Source: https://developers.google.com/merchant/api/overview

## Facebook Marketplace

Meta’s official Marketplace Partner Item API documentation exposes batch item operations against a partner product catalog. The visible request documentation identifies `CREATE`, `UPDATE`, and `DELETE` actions and recommends use of a unique content ID/SKU. This is a marketplace-partner capability, so eligibility and account authorization must be confirmed before it is treated as an available channel. Source: https://developers.facebook.com/docs/marketplace/partnerships/itemAPI/

## Implications

Google Merchant is a clear official API channel once the LLC’s Merchant Center account and authorization are in place. Facebook Marketplace should be modeled as conditional: the system can prepare its inventory payload, but it must not claim automatic publishing until Meta partnership eligibility and credentials are confirmed.
## Mercari

The official Mercari Shops API reference documents a GraphQL API with authentication, product creation/deletion, product variants, orders, webhooks, rate limits, and sandbox references. Its branding and documentation scope are Mercari Shops, which should not be assumed to grant access to a separate Mercari seller account without the LLC confirming its exact account/product eligibility. Source: https://api.mercari-shops.com/docs/index.html

## Poshmark

The official Poshmark seller resource presents consumer-facing seller workflows such as listing, bulk upload, inventory and sales reports, and advanced seller tools. The reviewed public resource does not document a standard seller listing API. Therefore, the automation design should keep Poshmark as an approval/manual-upload channel unless the LLC has written access to a supported partner or enterprise integration. Source: https://blog.poshmark.com/poshmark-community-toolkit/

## Updated implication

The system should support a unified catalog and inventory ledger, but channel actions must be gated. eBay and Google Merchant can use official authenticated APIs; Facebook Marketplace depends on accepted partner access; Mercari availability depends on the exact Mercari product/account; Poshmark should remain manual unless an authorized integration is supplied.

