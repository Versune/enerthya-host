import type { MetadataRoute } from "next";

/**
 * The panel is private: loopback by default, accounts created on the install,
 * and no public content. Search engines have nothing to index and should not
 * discover routes by crawling.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
