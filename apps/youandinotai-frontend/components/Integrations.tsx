import React from 'react';
import { DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Integrations({ isDarkMode }: { isDarkMode: boolean }) {
  const integrations = [
    {
      name: 'Square',
      icon: <DollarSign className="w-8 h-8 text-emerald-500" />,
      description:
        'The payment processor for YouAndINotAI. Memberships and Bot-Shield verification check out through a secure Square-hosted page.',
      status: 'Connected',
      detail: 'Hosted checkout • PCI-compliant • cards & digital wallets',
    },
    {
      name: 'Bot-Shield Verification',
      icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
      description: 'A one-time human verification, processed through Square, that keeps the platform real-people-only.',
      status: 'Connected',
      detail: 'One-time $1 verification via Square',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Payment Integrations</h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Secure, Square-powered checkout for memberships and verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((int, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border transition-all hover:shadow-md ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>{int.icon}</div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {int.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">{int.name}</h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{int.description}</p>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{int.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
