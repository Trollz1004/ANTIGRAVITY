import type { Metadata } from 'next';
import './globals.css'; // Global styles
import PublicBanner from '../components/PublicBanner';

export const metadata: Metadata = {
  title: 'Antigravity Status Dashboard',
  description: 'Public-facing status board for live sites and verified updates only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <PublicBanner />
        {children}
      </body>
    </html>
  );
}
