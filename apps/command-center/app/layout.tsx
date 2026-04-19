import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center — ANTIGRAVITY",
  description: "AI content approval desk. #ForTheKids",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
