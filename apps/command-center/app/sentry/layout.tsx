import type { Metadata } from "next";

// Sentry /sentry page — runs full-screen, no command-center chrome.
// The /sentry URL is meant to be opened on a kiosk / wall display or
// a dedicated sentry tab in a second monitor.
export const metadata: Metadata = {
  title: "ANTIGRAVITY Sentry — Watchdog",
  description: "Green/red watchdog sentry with one-click repair.",
};

export default function SentryLayout({ children }: { children: React.ReactNode }) {
  // No shared command-center UI here — sentry runs in kiosk mode and
  // renders its own header / grid. We just hand off the page body.
  return <>{children}</>;
}
