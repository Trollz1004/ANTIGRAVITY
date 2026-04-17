import { useState, useRef, useEffect } from 'react';
import { importCsvFile, getCurrentCsv, downloadCrossfireCsv, downloadEbayReviseCsv, downloadSquareCsv } from '../api';

interface PlatformPrices {
  list_price: number;
  platform_fee: number;
  processing_fee: number;
  total_fees: number;
  net_payout: number;
  profit: number;
  profit_margin: number;
}

interface CsvListing {
  ebay_item_id?: string;
  title: string;
  sku?: string;
  condition?: string;
  quantity?: number;
  ebay_price: number;
  cost_basis?: number;
  platforms: Record<string, PlatformPrices>;
}

const PLATFORM_ORDER = ['ebay', 'square', 'mercari', 'poshmark', 'fbmp', 'etsy'] as const;
const PLATFORM_LABELS: Record<string, string> = {
  ebay: 'eBay',
  square: 'Square',
  mercari: 'Mercari',
  poshmark: 'Poshmark',
  fbmp: 'FB Mkt',
  etsy: 'Etsy',
};
const PLATFORM_COLORS: Record<string, string> = {
  ebay: 'text-yellow-400',
  square: 'text-green-400',
  mercari: 'text-red-400',
  poshmark: 'text-pink-400',
  fbmp: 'text-blue-400',
  etsy: 'text-orange-400',
};

export default function CsvImport() {
  const [listings, setListings] = useState<CsvListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingCost, setShippingCost] = useState('6.50');
  const [materialsCost, setMaterialsCost] = useState('1.50');
  const [costBasis, setCostBasis] = useState('0');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check for pre-loaded data on mount
  useEffect(() => {
    getCurrentCsv()
      .then((data: any) => {
        if (data.count > 0) setListings(data.listings);
      })
      .catch(() => {});
  }, []);

  const handleImport = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      const data = await importCsvFile(
        file,
        parseFloat(costBasis) || 0,
        parseFloat(shippingCost) || 6.5,
        parseFloat(materialsCost) || 1.5,
      );
      if (data.error) {
        setError(data.error);
      } else {
        setListings(data.listings);
      }
    } catch (e: any) {
      setError(e.message || 'Import failed');
    }
    setLoading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleImport(file);
    } else {
      setError('Drop a .csv file');
    }
  };

  const totalShip = (parseFloat(shippingCost) || 0) + (parseFloat(materialsCost) || 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">CSV Import</h2>
      <p className="text-white/50 text-sm mb-6">
        Upload your eBay Seller Hub CSV → instant price breakdown for every platform. All prices include FREE SHIPPING
        (32776→90210 + materials).
      </p>

      {/* Settings row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-white/40 mb-1">Default Cost Basis</label>
          <div className="flex items-center gap-1">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-28 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">USPS Ground (32776→90210)</label>
          <div className="flex items-center gap-1">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-28 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Materials (tape/box)</label>
          <div className="flex items-center gap-1">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={materialsCost}
              onChange={(e) => setMaterialsCost(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-28 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-6 ${
          dragOver ? 'border-orange-500 bg-orange-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        <div className="text-4xl mb-2">{loading ? '...' : '+'}</div>
        <div className="text-white/60">{loading ? 'Processing...' : 'Drop eBay CSV here or click to browse'}</div>
        <div className="text-white/30 text-xs mt-1">Seller Hub Reports or File Exchange format</div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Results */}
      {listings.length > 0 && (
        <>
          {/* Export buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => downloadCrossfireCsv()}
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold px-5 py-2 rounded-lg hover:opacity-90 transition cursor-pointer text-sm"
            >
              Export All Platforms CSV
            </button>
            <button
              onClick={() => downloadSquareCsv()}
              className="bg-gradient-to-r from-emerald-500 to-green-700 text-white font-bold px-5 py-2 rounded-lg hover:opacity-90 transition cursor-pointer text-sm"
            >
              Export Square CSV
            </button>
            <button
              onClick={() => downloadEbayReviseCsv()}
              className="bg-gradient-to-r from-yellow-600 to-amber-700 text-white font-bold px-5 py-2 rounded-lg hover:opacity-90 transition cursor-pointer text-sm"
            >
              Export eBay Revise CSV
            </button>
            <span className="text-white/30 text-xs self-center">
              {listings.length} listing{listings.length !== 1 ? 's' : ''} loaded
            </span>
          </div>

          {/* Pricing table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-2 text-white/40 font-normal">Title</th>
                  <th className="text-center py-2 px-2 text-white/40 font-normal">Qty</th>
                  {PLATFORM_ORDER.map((p) => (
                    <th key={p} className={`text-center py-2 px-2 font-semibold ${PLATFORM_COLORS[p]}`}>
                      {PLATFORM_LABELS[p]}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 text-green-400 font-semibold">Profit</th>
                  <th className="text-center py-2 px-2 text-white/40 font-normal">Margin</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item, i) => {
                  const ebay = item.platforms?.ebay;
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-2 px-2 max-w-[300px] truncate" title={item.title}>
                        <div className="truncate">{item.title}</div>
                        {item.sku && <div className="text-[10px] text-white/30">SKU: {item.sku}</div>}
                      </td>
                      <td className="text-center py-2 px-2 text-white/50">{item.quantity || 1}</td>
                      {PLATFORM_ORDER.map((p) => {
                        const plat = item.platforms?.[p];
                        return (
                          <td key={p} className="text-center py-2 px-2">
                            {plat ? (
                              <div>
                                <div className="font-bold">${plat.list_price.toFixed(2)}</div>
                                <div className="text-[10px] text-red-400/70">-${plat.total_fees.toFixed(2)}</div>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 px-2">
                        {ebay ? (
                          <span className={`font-bold ${ebay.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${ebay.profit.toFixed(2)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-center py-2 px-2 text-white/40">{ebay ? `${ebay.profit_margin}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-white/40 mb-2">SHIPPING BUILT INTO ALL PRICES</div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-white/50">USPS Ground: </span>
                <span className="text-white font-bold">${(parseFloat(shippingCost) || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-white/50">Materials: </span>
                <span className="text-white font-bold">${(parseFloat(materialsCost) || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-white/50">Total ship+materials: </span>
                <span className="text-orange-400 font-bold">${totalShip.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-white/50">Listings: </span>
                <span className="text-white font-bold">{listings.length}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
