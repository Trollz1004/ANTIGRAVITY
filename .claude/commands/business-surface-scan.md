Scan active customer-facing paths for business-only public-surface drift:

```powershell
python scripts/clawx-control/scan-public-copy-policy.py
```

PASS only when active public UI, API response, ad copy, checkout, and deployment
output stay product-only: membership, verification, safety, support, uptime,
checkout, account access, receipts, and refunds.
