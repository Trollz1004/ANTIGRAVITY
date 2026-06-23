'use client';

import { usePathname } from 'next/navigation';

export default function PublicBanner() {
  const pathname = usePathname();
  if (pathname.startsWith('/scc')) return null;
  return (
    <div className="bg-emerald-500 text-black text-center py-2 px-4 font-bold text-xs md:text-sm relative z-[100]">
      Live dating app updates: verified links, membership details, and support status.
    </div>
  );
}
