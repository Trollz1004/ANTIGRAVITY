import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Status - YouAndINotAI',
  description: 'Customer-safe status page with verified links and support information.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SccLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
