import React from 'react';
import { Globe, HeartHandshake, ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: 'Public links',
    body: 'Customer links should be clear, current, and easy to understand.',
    icon: <HeartHandshake className="w-6 h-6 text-rose-500" />,
  },
  {
    title: 'Clear destinations',
    body: 'Dating, support, checkout, and service pages each keep a simple purpose.',
    icon: <Globe className="w-6 h-6 text-blue-500" />,
  },
  {
    title: 'Customer safety',
    body: 'Private account, payment, and support details stay protected.',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
  },
];

export default function Organization({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <HeartHandshake className="w-8 h-8 text-rose-500" />
          Public Link Notes
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Simple notes for customer-facing pages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div
            key={section.title}
            className={`p-8 rounded-3xl border ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            <div className="mb-4">{section.icon}</div>
            <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
            <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
