import type { MetadataRoute } from "next";

import { getCases, getCategoryTree, getPosts, getProducts, getScenarios } from "@/lib/api";
import { LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Alternate-language URLs for one path, so Google indexes each locale separately. */
function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((l) => [l.code, `${SITE}/${l.code}${path}`]),
    ) as Record<string, string>,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const STATIC_PATHS = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/scenarios", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/cases", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/downloads", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/honors", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/service", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" as const },
  ];

  for (const locale of LOCALES) {
    for (const item of STATIC_PATHS) {
      entries.push({
        url: `${SITE}/${locale.code}${item.path}`,
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: alternates(item.path),
      });
    }
  }

  // Dynamic content is enumerated once in the default locale, then emitted per locale.
  const defaultLocale = "en" as Locale;
  const [products, posts, cases, scenarios, categories] = await Promise.all([
    getProducts({ per_page: 100 }, defaultLocale),
    getPosts(defaultLocale, { per_page: 100 }),
    getCases(defaultLocale, { per_page: 100 }),
    getScenarios(defaultLocale),
    getCategoryTree(defaultLocale),
  ]);

  const dynamicPaths: { path: string; priority: number }[] = [
    ...products.items.map((p) => ({ path: `/products/${p.slug}`, priority: 0.8 })),
    ...posts.items.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.7 })),
    ...cases.items.map((c) => ({ path: `/cases/${c.slug}`, priority: 0.6 })),
    ...scenarios.flatMap((s) => [
      { path: `/scenarios/${s.slug}`, priority: 0.7 },
      ...(s.children ?? []).map((child) => ({
        path: `/scenarios/${child.slug}`,
        priority: 0.7,
      })),
    ]),
    ...categories.flatMap((c) => [
      { path: `/products?category=${c.slug}`, priority: 0.6 },
      ...(c.children ?? []).map((child) => ({
        path: `/products?category=${child.slug}`,
        priority: 0.5,
      })),
    ]),
  ];

  for (const locale of LOCALES) {
    for (const item of dynamicPaths) {
      entries.push({
        url: `${SITE}/${locale.code}${item.path}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: item.priority,
        alternates: alternates(item.path),
      });
    }
  }

  return entries;
}
