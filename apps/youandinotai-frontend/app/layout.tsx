import type { Metadata } from 'next';
import './globals.css'; // Global styles
import PublicBanner from '../components/PublicBanner';
import CookieConsentBanner from '../components/CookieConsentBanner';

export const metadata: Metadata = {
  metadataBase: new URL('https://youandinotai.com'),
  applicationName: 'YouAndINotAI',
  title: {
    default: 'YouAndINotAI - Human-first social platform',
    template: '%s · YouAndINotAI',
  },
  description:
    'YouAndINotAI is a human-verified, real-people-only social platform. Bot-shielded by design. Become a founding member.',
  alternates: { canonical: 'https://youandinotai.com' },
  openGraph: {
    type: 'website',
    url: 'https://youandinotai.com',
    siteName: 'YouAndINotAI',
    title: 'YouAndINotAI - Human-first social platform',
    description:
      'A human-verified, real-people-only social platform. Bot-shielded by design. Become a founding member.',
  },
  twitter: {
    card: 'summary',
    title: 'YouAndINotAI - Human-first social platform',
    description: 'A human-verified, real-people-only social platform. Bot-shielded by design.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var key = 'youandinotai_theme_v1';
                var theme;
                try { theme = localStorage.getItem(key); } catch(e) {}
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <PublicBanner />
        <div id="main-content">{children}</div>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
