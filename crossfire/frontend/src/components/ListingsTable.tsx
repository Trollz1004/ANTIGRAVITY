import { useState, useEffect } from 'react';
import { getListings, createListing, deleteListing } from '../api';

interface Listing {
  id: number;
  title: string;
  ebay_price: number;
  cost_basis: number;
  condition: string;
  quantity: number;
  quantity_sold: number;
  status: string;
  sku: string | null;
  platform_listings: { platform: string; listed_price: number; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  sold: 'bg-blue-500/20 text-blue-400',
  ended: 'bg-white/10 text-white/40',
  draft: 'bg-yellow-500/20 text-yellow-400',
};

export default function ListingsTable() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '',
    ebay_price: '',
    cost_basis: '',
    condition: 'Used',
    quantity: '1',
    sku: '',
  });

  const load = async () => {
    try {
      setListings((await getListings()) as Listing[]);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.title || !form.ebay_price) return;
    await createListing({
      title: form.title,
      ebay_price: parseFloat(form.ebay_price),
      cost_basis: parseFloat(form.cost_basis) || 0,
      condition: form.condition,
      quantity: parseInt(form.quantity) || 1,
      sku: form.sku || null,
    });
    setForm({ title: '', ebay_price: '', cost_basis: '', condition: 'Used', quantity: '1', sku: '' });
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteListing(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Listings</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 cursor-pointer"
        >
          {showAdd ? 'Cancel' : '+ Add Listing'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 col-span-2"
          />
          <input
            placeholder="eBay Price"
            type="number"
            value={form.ebay_price}
            onChange={(e) => setForm({ ...form, ebay_price: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <input
            placeholder="Cost Basis"
            type="number"
            value={form.cost_basis}
            onChange={(e) => setForm({ ...form, cost_basis: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <select
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Used">Used</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
          <input
            placeholder="Qty"
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <input
            placeholder="SKU (optional)"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
          />
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer"
          >
            Save
          </button>
        </div>
      )}

      {/* Table */}
      {listings.length === 0 ? (
        <div className="text-center text-white/30 py-16">
          No listings yet. Add one manually or connect eBay to import.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-right py-3 px-2">eBay Price</th>
                <th className="text-right py-3 px-2">Cost</th>
                <th className="text-right py-3 px-2">Profit</th>
                <th className="text-center py-3 px-2">Qty</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-center py-3 px-2">Platforms</th>
                <th className="text-right py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-3 px-2 font-medium max-w-xs truncate">{l.title}</td>
                  <td className="py-3 px-2 text-right text-green-400">${l.ebay_price.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-white/50">${l.cost_basis.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={l.ebay_price - l.cost_basis >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${(l.ebay_price - l.cost_basis).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">{l.quantity}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        STATUS_COLORS[l.status] || 'bg-white/10 text-white/40'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {l.platform_listings.length > 0 ? (
                      <div className="flex gap-1 justify-center">
                        {l.platform_listings.map((pl) => (
                          <span key={pl.platform} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                            {pl.platform}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/20 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-red-400/50 hover:text-red-400 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
