import type { Metadata } from 'next';
import './globals.css'; // Global styles
import PublicBanner from '../components/PublicBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://youandinotai.com'),
  applicationName: 'YouAndINotAI',
  title: {
    default: 'YouAndINotAI — Human-first social platform',
    template: '%s · YouAndINotAI',
  },
  description:
    'YouAndINotAI is a human-verified, real-people-only social platform. Bot-shielded by design. Become a founding member.',
  alternates: { canonical: 'https://youandinotai.com' },
  openGraph: {
    type: 'website',
    url: 'https://youandinotai.com',
    siteName: 'YouAndINotAI',
    title: 'YouAndINotAI — Human-first social platform',
    description:
      'A human-verified, real-people-only social platform. Bot-shielded by design. Become a founding member.',
  },
  twitter: {
    card: 'summary',
    title: 'YouAndINotAI — Human-first social platform',
    description: 'A human-verified, real-people-only social platform. Bot-shielded by design.',
  },
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
