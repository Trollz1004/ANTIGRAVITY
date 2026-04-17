const BASE = '/api';

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Price calc
export const calcPrices = (
  ebay_price: number,
  cost_basis: number = 0,
  shipping_cost: number = 6.5,
  materials_cost: number = 1.5,
) =>
  fetchJson('/platforms/price-calc', {
    method: 'POST',
    body: JSON.stringify({ ebay_price, cost_basis, shipping_cost, materials_cost }),
  });

export const getPlatforms = () => fetchJson('/platforms/');

// Listings
export const getListings = () => fetchJson('/listings/');
export const createListing = (data: any) => fetchJson('/listings/', { method: 'POST', body: JSON.stringify(data) });
export const deleteListing = (id: number) => fetchJson(`/listings/${id}`, { method: 'DELETE' });

// Shipping
export const calcShipping = (weight_oz: number, dest_zip: string = '90210') =>
  fetchJson('/shipping/calc', {
    method: 'POST',
    body: JSON.stringify({ weight_oz, dest_zip }),
  });
export const bestRate = (weight_oz: number) => fetchJson(`/shipping/best-rate/${weight_oz}`);

// Sync
export const getSyncStats = () => fetchJson('/sync/stats');
export const getSyncEvents = () => fetchJson('/sync/events');

// CSV Import/Export
export const importCsvFile = async (file: File, costBasis = 0, shippingCost = 6.5, materialsCost = 1.5) => {
  const form = new FormData();
  form.append('file', file);
  const params = new URLSearchParams({
    cost_basis: String(costBasis),
    shipping_cost: String(shippingCost),
    materials_cost: String(materialsCost),
  });
  const res = await fetch(`${BASE}/csv/import?${params}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const importCsvText = (csvText: string, costBasis = 0, shippingCost = 6.5, materialsCost = 1.5) =>
  fetchJson('/csv/import-text', {
    method: 'POST',
    body: JSON.stringify({
      csv_text: csvText,
      cost_basis: costBasis,
      shipping_cost: shippingCost,
      materials_cost: materialsCost,
    }),
  });

export const getCurrentCsv = () => fetchJson('/csv/current');

export const downloadCrossfireCsv = () => window.open(`${BASE}/csv/export/crossfire`, '_blank');

export const downloadEbayReviseCsv = (priceAdjustment = 0) =>
  window.open(`${BASE}/csv/export/ebay-revise?price_adjustment=${priceAdjustment}`, '_blank');

export const downloadSquareCsv = () => window.open(`${BASE}/csv/export/square`, '_blank');
