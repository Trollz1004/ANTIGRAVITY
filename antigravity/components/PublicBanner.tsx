'use client';

import { usePathname } from 'next/navigation';

export default function PublicBanner() {
  const pathname = usePathname();
  if (pathname.startsWith('/scc')) return null;
  return (
    <div className="bg-emerald-500 text-black text-center py-2 px-4 font-bold text-xs md:text-sm relative z-[100]">
      Public status board: verified links and tracked updates only. Internal workflow tools are not exposed here.
    </div>
  );
}
