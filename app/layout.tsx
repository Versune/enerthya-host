import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./panel.css";

export const metadata: Metadata = {
  title: {
    default: "Sign in — Enerthya Host",
    template: "%s",
  },
  description:
    "The Enerthya Host panel runs on this machine. Local account, no cloud, no telemetry.",
  applicationName: "Enerthya Host panel",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <div id="live" className="sr-only" role="status" aria-live="polite" />
      </body>
    </html>
  );
}
