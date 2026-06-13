"use client";

import dynamic from "next/dynamic";
import "../globals.css";

// Lazy-load the sentry dashboard so the home tab isn't penalised when
// this page is just a kiosk URL.
const SentryDashboard = dynamic(
  () => import("@/app/_components/SentryDashboard"),
  { ssr: false, loading: () => <SentryBoot /> }
);

function SentryBoot() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Booting Sentry…
        </p>
      </div>
    </div>
  );
}

export default function SentryPage() {
  return <SentryDashboard mode="kiosk" />;
}
