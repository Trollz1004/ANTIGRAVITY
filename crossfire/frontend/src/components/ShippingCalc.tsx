import { useState } from 'react';
import { bestRate } from '../api';

interface RateOption {
  service: string;
  cost: number;
}

interface BestRateResult {
  cheapest: RateOption;
  all_options: RateOption[];
}

export default function ShippingCalc() {
  const [weightOz, setWeightOz] = useState('');
  const [result, setResult] = useState<BestRateResult | null>(null);

  const calculate = async () => {
    const w = parseFloat(weightOz);
    if (!w || w <= 0) return;
    try {
      const data = (await bestRate(w)) as BestRateResult;
      setResult(data);
    } catch {}
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Shipping Calculator</h2>
      <p className="text-white/50 text-sm mb-6">
        USPS Ground Advantage from 32776 (FL) to 90210 (CA) — worst-case rate so you never lose money.
      </p>

      <div className="flex gap-4 mb-8 items-end">
        <div>
          <label className="block text-xs text-white/40 mb-1">Weight (oz)</label>
          <input
            type="number"
            value={weightOz}
            onChange={(e) => setWeightOz(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculate()}
            placeholder="16"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-28 text-white outline-none focus:border-orange-500"
          />
        </div>
        <div className="text-xs text-white/30">
          <div>1 lb = 16 oz</div>
          <div>5 lb = 80 oz</div>
        </div>
        <button
          onClick={calculate}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-6 py-2 rounded-lg hover:opacity-90 cursor-pointer"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div>
          {/* Best rate highlight */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="text-xs text-green-400 uppercase tracking-wider mb-1">Cheapest Option</div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-green-400">${result.cheapest.cost.toFixed(2)}</span>
              <span className="text-white/60">{result.cheapest.service}</span>
            </div>
          </div>

          {/* All options */}
          <h3 className="text-sm font-semibold text-white/60 mb-3">All Options (cheapest first)</h3>
          <div className="space-y-2">
            {result.all_options.map((opt, i) => (
              <div
                key={opt.service}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  i === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                <span className="text-sm">{opt.service}</span>
                <span className={`font-bold ${i === 0 ? 'text-green-400' : 'text-white/60'}`}>
                  ${opt.cost.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Quick reference */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white/60 mb-2">Quick Reference</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
              <div>Origin: 32776 (FL)</div>
              <div>Dest: 90210 (CA) — worst case</div>
              <div>Carrier: USPS</div>
              <div>Service: Ground Advantage</div>
              <div>Delivery: 2-5 business days</div>
              <div>Max weight: 70 lbs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
