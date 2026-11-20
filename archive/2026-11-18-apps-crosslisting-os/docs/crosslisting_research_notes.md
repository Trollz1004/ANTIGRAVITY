# Cross-listing research notes

## Sources reviewed

- https://developer.ebay.com/develop/guides-v2/listing-creation — unavailable through the browser at review time (returned an eBay error page).
- https://developer.ebay.com/api-docs/sell/inventory/static/overview.html — official Inventory API overview, accessed 2026-08-26.

## Confirmed findings

The official Inventory API workflow is:

1. Create an **inventory item** containing product information, condition, available quantity, and a seller-defined SKU unique across the seller inventory.
2. Create an **offer** associated with a marketplace, inventory item, inventory location, and category. The offer includes price, listing description, and available quantity.
3. Set the seller’s payment, fulfillment, and return business policies on the offer.
4. Publish the offer to create an active listing.

The eBay documentation notes that some values may be optional during intermediate API calls but become required when publishing an offer.

## Implication for supplied files

The uploaded CSV’s UPCs and placeholder titles/URLs are insufficient to publish listings. A reliable source for verified product attributes and valid image assets is required, along with seller-specific category, condition, pricing, quantity, and policy information.

The supplied notebook is incomplete/truncated: it stops in the middle of a code string at 20,002 bytes and does not parse as valid Jupyter/Colab JSON. The visible portions propose scraping eBay item and search-result pages with requests/BeautifulSoup. That technique is brittle against page structure changes and does not establish a supported eBay draft-creation path.

## Recommended direction

Use a Google Sheet as an internal review/template layer and an API or Seller Hub CSV upload for the listing stage. Treat a “draft” as a human-review stage in the sheet, because the official Inventory API uses inventory items and offers and publishes offers to make listings active.

## Additional official findings

- eBay Seller Hub Reports supports uploading and managing inventory through CSV or XLS files. This offers a seller-controlled bulk-import route after a human reviews the enriched product data. Source: https://www.ebay.com/sellercenter/listings/ebay-bulk-listing-tools
- To create live listings through the Inventory API, eBay requires sellers to opt into business policies and reference a fulfillment, return, and payment policy. It also requires an inventory location, a unique SKU, quantity, condition, product title, description, aspects, and image URLs. Source: https://developer.ebay.com/api-docs/sell/static/inventory/publishing-offers.html
- Creating inventory items/offers and publishing them are distinct. Publishing makes offers live, so a review sheet should remain the primary approval/draft stage unless the seller deliberately chooses a bulk-upload or API-publish action.

