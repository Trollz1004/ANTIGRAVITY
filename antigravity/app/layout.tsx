import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Antigravity Dashboard — #ForTheKids | AI-Powered Ecosystem',
  description: 'Antigravity ecosystem dashboard — platforms, metrics, and mission control for YouAndINotAI, OnlineRecycle, and AI-Solutions.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
