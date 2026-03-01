import { useState } from 'react'
import './index.css'
import PriceCalculator from './components/PriceCalculator'
import ListingsTable from './components/ListingsTable'
import ShippingCalc from './components/ShippingCalc'
import CsvImport from './components/CsvImport'

const tabs = ['CSV Import', 'Price Calculator', 'Listings', 'Shipping'] as const
type Tab = typeof tabs[number]

function App() {
  const [tab, setTab] = useState<Tab>('CSV Import')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-black">
            CF
          </div>
          <h1 className="text-xl font-bold tracking-tight">CROSSFIRE</h1>
          <span className="text-xs text-white/40 ml-2">eBay Crosslister</span>
        </div>
        <span className="text-xs text-white/30">Trash Or Treasure Online Recycler LLC</span>
      </header>

      {/* Tabs */}
      <nav className="border-b border-white/10 px-6 flex gap-1">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {tab === 'CSV Import' && <CsvImport />}
        {tab === 'Price Calculator' && <PriceCalculator />}
        {tab === 'Listings' && <ListingsTable />}
        {tab === 'Shipping' && <ShippingCalc />}
      </main>
    </div>
  )
}

export default App
