import React from 'react';
import { Github, Globe, ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: 'Public repositories',
    body: 'Public repositories should stay technical and avoid reading like marketing decks, governance manifestos, or admin consoles.',
    icon: <Github className="w-6 h-6 text-slate-800 dark:text-white" />,
  },
  {
    title: 'Surface separation',
    body: 'Service sites, storefronts, and dashboards should each keep their own role so search engines and customers are not asked to decode internal architecture.',
    icon: <Globe className="w-6 h-6 text-blue-500" />,
  },
  {
    title: 'Operational safety',
    body: 'Credential entry, node management, and backend configuration belong in private tooling, not on public web pages or public README files.',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
  },
];

export default function Organization({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Github className="w-8 h-8 text-slate-800 dark:text-white" />
          Public Repo Notes
        </h2>
        <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          High-level repository guidance for public-facing surfaces.
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
