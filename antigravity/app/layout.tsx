import type { Metadata } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Antigravity Status Dashboard',
  description: 'Public-facing status board for live sites and verified updates only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="bg-emerald-500 text-black text-center py-2 px-4 font-bold text-xs md:text-sm relative z-[100]">
          Public status board: verified links and tracked updates only. Internal admin controls are not exposed here.
        </div>
        {children}
      </body>
    </html>
  );
}
