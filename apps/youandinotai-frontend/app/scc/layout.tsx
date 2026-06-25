import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internal Workspace Boundary — ANTIGRAVITY',
  description: 'Non-indexed public note explaining that internal workflow tooling is not exposed on this dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SccLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
