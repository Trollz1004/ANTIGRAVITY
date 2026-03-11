import type { Metadata } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Antigravity Dashboard — #ForTheKids | AI-Powered Ecosystem',
  description: 'Antigravity ecosystem dashboard — platforms, metrics, and mission control for YouAndINotAI, OnlineRecycle, and AI-Solutions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="bg-emerald-500 text-black text-center py-2 px-4 font-bold text-xs md:text-sm relative z-[100]">
          #ForTheKids — ENIGMA routing is locked to 60/30/10 on Base Mainnet. This dashboard shows verified addresses and tracked zeroes only.
        </div>
        {children}
      </body>
    </html>
  );
}
