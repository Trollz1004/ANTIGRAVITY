import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-serif',
  weight: ['400'],
  fallback: ['Georgia', 'serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: 'Business Exchange — B2B Marketplace for Founders & Operators',
  description: 'A serious B2B marketplace and deal-management platform for services, projects, referrals, and business acquisitions.',
  keywords: ['marketplace', 'business acquisition', 'services', 'referrals', 'B2B', 'deal flow'],
  authors: [{ name: 'Business Exchange' }],
  creator: 'Business Exchange',
  publisher: 'Business Exchange',
  robots: 'noindex, nofollow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://exchange.youandinotai.com',
    title: 'Business Exchange — B2B Marketplace',
    description: 'A serious B2B marketplace and deal-management platform for founders and operators.',
    siteName: 'Business Exchange',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Exchange — B2B Marketplace',
    description: 'A serious B2B marketplace and deal-management platform for founders and operators.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#111015' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}