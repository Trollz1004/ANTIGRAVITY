# Cross-listing Review Package

**Prepared by Manus AI**

This package converts the supplied UPC inventory file into a **review-first, Google Sheets-compatible workflow**. It does not create, revise, publish, or delete eBay listings. Product information extracted from a source URL is only a starting point: you must verify every listing field, use only images and copy you are permitted to use, and choose the correct item condition, category, price, quantity, and policies.

| File | Purpose |
|---|---|
| `Crosslisting_Review_Template.xlsx` | Google Sheets-compatible workbook containing 185 source UPC rows, review controls, and listing-preparation columns. |
| `Code.gs` | Google Apps Script that enriches selected rows from publicly exposed JSON-LD and Open Graph metadata at an HTTP(S) source URL. It does not interact with an eBay seller account. |
| `README.md` | Installation and operational guide. |

## What the template does

The **Listings** sheet carries forward the supplied UPCs as text and assigns each product a distinct SKU. It intentionally leaves the listing title and image fields empty rather than promoting the source file’s placeholder values to listing content. It also includes all the seller-controlled fields needed for a thorough pre-publication review: condition, category, quantity, price, description, images, and business-policy identifiers.

The **Ready Check** column becomes `READY` only after the row is marked **Approved** and contains the core fields necessary for a later publishing workflow. This is a completeness signal rather than confirmation that a row satisfies every marketplace or category rule. eBay’s API guidance states that fields can be optional when an offer is created yet required when an offer is published, and that active offers require a seller inventory location and payment, fulfillment, and return policies.[1]

> **Do not use `eBay Upload Review` as an unmodified upload file.** eBay’s requirements are category- and marketplace-specific. First download the current Seller Hub template for the relevant marketplace/category and copy mapped, approved values into that template.

## Install in Google Sheets

First, upload `Crosslisting_Review_Template.xlsx` to Google Drive and open it using Google Sheets. Confirm that the **UPC** and **SKU** columns remain formatted as plain text; this preserves leading zeroes. Then open **Extensions → Apps Script**, delete the initial sample function, paste the entire contents of `Code.gs`, and save the project. Reload the spreadsheet. A **Cross-listing** menu will appear.

After adding a product URL in **Source URL**, select one or more matching data rows and choose **Cross-listing → Enrich selected rows**. The script is deliberately capped at 15 rows per run so that results remain reviewable and failures are easier to diagnose. It reads Product JSON-LD, Open Graph tags, and limited generic page metadata. It only writes metadata into the matching spreadsheet row; it does not use browser automation, place an order, or perform any action in an eBay account.

The script may be unable to extract data from a source because the source does not expose structured product metadata, blocks automated requests, requires login, or returns an access error. In that event, the row is marked **Research Needed** and no invented data is supplied. You should instead enter verified information from a permitted source.

## Review and approval procedure

Review each enriched row before setting **Review Status** to `Approved`. In particular, verify that the title precisely identifies the product; confirm the disc format, edition, region, and condition; use accurate, permitted images; write a truthful description; and set an independent price and quantity. Source prices are retained in notes only for reference because they are not a reliable selling-price recommendation.

| Review area | What to confirm |
|---|---|
| Product identity | UPC, title, format, edition, region code, studio/brand, and any item specifics match the physical item. |
| Condition | The selected condition and condition description accurately disclose wear, packaging state, and missing or included inserts. |
| Assets | Every image URL is publicly reachable, represents the actual item where appropriate, and may lawfully be used in the listing. |
| Commercial details | Price, quantity, description, shipping, returns, and item location are your own verified seller inputs. |
| eBay setup | Category, merchant location, and payment, fulfillment, and return-policy IDs are valid for the intended eBay marketplace. |

eBay explains that its Inventory API associates each live offer with an inventory item, marketplace, inventory location, category, price, description, and business policies.[2] This is why the template keeps those fields in the review queue even though it does not publish anything.

## Ways to take approved rows live

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| **Spreadsheet review, then Seller Hub upload** | Uses a human approval gate and eBay’s current seller-provided spreadsheet template; manual field mapping is required and marketplace/category requirements can change. | No additional software cost beyond the seller account. | Low to moderate. |
| **Spreadsheet review, then a dedicated eBay API integration** | Can automate inventory and offer creation after review, but needs application credentials, seller authorization, an inventory location, and business policies. Publishing makes listings active, so approval controls are essential. | Developer and implementation effort; any third-party hosting/integration costs depend on the chosen service. | Moderate to high. |

Seller Hub Reports supports inventory management through CSV or XLS uploads, providing the lighter-weight route for bulk listing work.[3] The official Inventory API is appropriate only when you want a credentialed application to create inventory and offer records; its `publishOffer` actions create active listings rather than a traditional seller-draft stage.[1][2]

## Known source-data limitations

The original `crosslistebay` file has 185 structurally valid rows but only three fields: UPC, a generic placeholder title, and a placeholder image URL. The template therefore does not treat its titles or `example.com` URLs as usable product metadata. The final source row also lacks an image URL. These limitations are intentional blockers until each row is enriched and reviewed.

## References

[1]: https://developer.ebay.com/api-docs/sell/static/inventory/publishing-offers.html "eBay Developers Program — Required fields for publishing an offer"
[2]: https://developer.ebay.com/api-docs/sell/inventory/static/overview.html "eBay Developers Program — Inventory API overview"
[3]: https://www.ebay.com/sellercenter/listings/ebay-bulk-listing-tools "eBay Seller Center — eBay bulk listing tools"
