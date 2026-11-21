import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./panel.css";

export const metadata: Metadata = {
  title: {
    default: "Sign in — Enerthya Host",
    template: "%s",
  },
  description:
    "The Enerthya Host panel runs on this machine. Local accounts, local Postgres, no telemetry.",
  applicationName: "Enerthya Host panel",
  // Static files in public/ rather than the app/ metadata convention: they are
  // assets, not routes, and the standalone bundle copies public/ verbatim.
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0e100f",
};

/**
 * Applies a stored theme before first paint. Without it the default dark
 * document flashes light for anyone who chose light and vice versa.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* beforeInteractive runs the theme before paint and keeps React from
            warning about a raw script tag inside a component tree. */}
        <Script id="theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
      </head>
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
