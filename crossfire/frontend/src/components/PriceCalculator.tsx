import { useState } from 'react'
import { calcPrices } from '../api'

interface FeeBreakdown {
  platform: string
  list_price: number
  platform_fee: number
  processing_fee: number
  total_fees: number
  net_payout: number
  profit: number
  profit_margin: number
}

interface PriceResult {
  ebay: FeeBreakdown
  mercari: FeeBreakdown
  poshmark: FeeBreakdown
  fbmp: FeeBreakdown
  etsy: FeeBreakdown
  square: FeeBreakdown
}

const PLATFORM_COLORS: Record<string, string> = {
  ebay: 'from-yellow-500 to-blue-600',
  square: 'from-green-500 to-emerald-700',
  mercari: 'from-red-500 to-red-700',
  poshmark: 'from-pink-500 to-rose-600',
  fbmp: 'from-blue-500 to-blue-700',
  etsy: 'from-orange-500 to-orange-700',
}

const PLATFORM_LABELS: Record<string, string> = {
  ebay: 'eBay',
  square: 'Square',
  mercari: 'Mercari',
  poshmark: 'Poshmark',
  fbmp: 'FB Marketplace',
  etsy: 'Etsy',
}

export default function PriceCalculator() {
  const [ebayPrice, setEbayPrice] = useState('')
  const [costBasis, setCostBasis] = useState('')
  const [shippingCost, setShippingCost] = useState('6.50')
  const [materialsCost, setMaterialsCost] = useState('1.50')
  const [result, setResult] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    const price = parseFloat(ebayPrice)
    if (!price || price <= 0) return
    setLoading(true)
    try {
      const data = await calcPrices(
        price,
        parseFloat(costBasis) || 0,
        parseFloat(shippingCost) || 6.50,
        parseFloat(materialsCost) || 1.50,
      ) as PriceResult
      setResult(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const shipping = parseFloat(shippingCost) || 0
  const materials = parseFloat(materialsCost) || 0
  const totalShipping = shipping + materials

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Price Calculator</h2>
      <p className="text-white/50 text-sm mb-6">
        Enter your eBay price. eBay = buyer pays shipping. Other platforms = FREE SHIPPING baked in.
        Other platform prices adjusted so you net the same profit as eBay after shipping + materials.
      </p>

      {/* Input row */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-xs text-white/40 mb-1">eBay Price</label>
          <div className="flex items-center gap-1">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={ebayPrice}
              onChange={e => setEbayPrice(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              placeholder="49.99"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-32 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Cost Basis</label>
          <div className="flex items-center gap-1">
            <span className="text-white/40">$</span>
            <input
              type="number"
              value={costBasis}
              onChange={e => setCostBasis(e.target.value)}
              placeholder="10.00"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-32 text-white outline-none focus:border-orange-500"
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
              onChange={e => setShippingCost(e.target.value)}
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
              onChange={e => setMaterialsCost(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-28 text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={calculate}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-6 py-2 rounded-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(result).map(([key, breakdown]) => {
            const b = breakdown as FeeBreakdown

            return (
              <div
                key={key}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition"
              >
                {/* Platform header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded bg-gradient-to-br ${PLATFORM_COLORS[key]} flex items-center justify-center text-[10px] font-bold`}>
                    {key[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{PLATFORM_LABELS[key]}</span>
                  {key === 'ebay' ? (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-auto">
                      BUYER SHIPS
                    </span>
                  ) : (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded ml-auto">
                      FREE SHIP
                    </span>
                  )}
                </div>

                {/* List price */}
                <div className="text-3xl font-black text-white mb-2">
                  ${b.list_price.toFixed(2)}
                </div>

                {/* Fee breakdown */}
                <div className="space-y-1 text-xs text-white/50">
                  <div className="flex justify-between">
                    <span>Platform fee</span>
                    <span className="text-red-400">-${b.platform_fee.toFixed(2)}</span>
                  </div>
                  {b.processing_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Processing</span>
                      <span className="text-red-400">-${b.processing_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {key !== 'ebay' && (
                    <div className="flex justify-between">
                      <span>Ship + materials</span>
                      <span className="text-red-400">-${totalShipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-1 flex justify-between">
                    <span>Total cost</span>
                    <span className="text-red-400">
                      -${key === 'ebay' ? b.total_fees.toFixed(2) : (b.total_fees + totalShipping).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Net / Profit */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Net payout</span>
                    <span className="text-green-400 font-bold">${b.net_payout.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/60">Profit</span>
                    <span className={`font-bold ${b.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${b.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-white/40">Margin</span>
                    <span className="text-white/40">{b.profit_margin}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
