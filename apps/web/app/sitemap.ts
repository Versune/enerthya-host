import type { MetadataRoute } from "next";

/**
 * The panel is private — robots.txt disallows everything — so this sitemap is
 * informational until a public site exists. It lists only the routes that
 * render without a session; dashboard routes require one and are never public.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return [
    { url: new URL("/", base).toString(), priority: 1 },
    { url: new URL("/sign-in", base).toString(), priority: 0.5 },
    { url: new URL("/sign-up", base).toString(), priority: 0.5 },
  ].map((entry) => ({
    ...entry,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));
}
