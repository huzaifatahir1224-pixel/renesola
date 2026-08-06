import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin panel and search result pages have nothing to index.
        disallow: ["/admin", "/admin/", "/*/search"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
