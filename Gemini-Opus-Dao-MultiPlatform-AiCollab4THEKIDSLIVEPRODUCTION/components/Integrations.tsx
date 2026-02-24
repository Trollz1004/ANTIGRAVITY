import React from 'react';
import { CreditCard, Wallet, DollarSign, Building2, CheckCircle2 } from 'lucide-react';

export default function Integrations({ isDarkMode }: { isDarkMode: boolean }) {
  const integrations = [
    {
      name: "Stripe",
      icon: <CreditCard className="w-8 h-8 text-indigo-500" />,
      description: "Primary payment gateway for subscriptions and marketplace transactions.",
      status: "Connected",
      color: "indigo"
    },
    {
      name: "Plaid",
      icon: <Building2 className="w-8 h-8 text-emerald-500" />,
      description: "Bank account linking for direct ACH transfers and identity verification.",
      status: "Configured",
      color: "emerald"
    },
    {
      name: "Google Pay",
      icon: <Wallet className="w-8 h-8 text-blue-500" />,
      description: "One-click checkout enabled for mobile and web users.",
      status: "Active",
      color: "blue"
    },
    {
      name: "Square",
      icon: <DollarSign className="w-8 h-8 text-slate-500" />,
      description: "Point of sale and alternative payment processing backup.",
      status: "Connected",
      color: "slate"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Payment Integrations</h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          V8 Cloud financial infrastructure setups for seamless global transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((int, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                {int.icon}
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`}>
                <CheckCircle2 className="w-3 h-3" />
                {int.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">{int.name}</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{int.description}</p>
            
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
                Manage Configuration
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
