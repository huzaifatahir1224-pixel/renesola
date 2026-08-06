import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { ProductFilterBar } from "@/components/ProductFilterBar";
import { getCategoryTree, getProducts } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { CellTechnology, Locale, ProductType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Photovoltaic modules and energy storage — filter by power, efficiency, and cell technology.",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const sp = await searchParams;
  const page = Number(first(sp.page) ?? 1) || 1;
  const category = first(sp.category);

  const filters = {
    category,
    product_type: first(sp.product_type) as ProductType | undefined,
    cell_technology: first(sp.cell_technology) as CellTechnology | undefined,
    power_gte: first(sp.power_gte) ? Number(first(sp.power_gte)) : undefined,
    power_lte: first(sp.power_lte) ? Number(first(sp.power_lte)) : undefined,
    search: first(sp.search),
    page,
    per_page: 12,
  };

  const [products, categories] = await Promise.all([
    getProducts(filters, locale),
    getCategoryTree(locale),
  ]);

  const activeCategory =
    categories.flatMap((c) => [c, ...(c.children ?? [])]).find((c) => c.slug === category) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-[var(--text-muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={base} className="hover:text-brand-600">
              {dict.nav.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`${base}/products`} className="hover:text-brand-600">
              {dict.nav.products}
            </Link>
          </li>
          {activeCategory && (
            <>
              <li aria-hidden>/</li>
              <li className="text-[var(--text)]">{activeCategory.name}</li>
            </>
          )}
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {activeCategory?.name ?? dict.nav.products}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {products.total} {dict.product.productsFound}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Category sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold">{dict.product.allCategories}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href={`${base}/products`}
                className={`block rounded-md px-3 py-2 transition hover:bg-[var(--surface-muted)] ${
                  !category ? "bg-brand-50 font-medium text-brand-700" : "text-[var(--text-muted)]"
                }`}
              >
                {dict.product.allCategories}
              </Link>
            </li>
            {categories.map((parent) => (
              <li key={parent.id}>
                <Link
                  href={`${base}/products?category=${parent.slug}`}
                  className={`block rounded-md px-3 py-2 transition hover:bg-[var(--surface-muted)] ${
                    category === parent.slug
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "font-medium text-[var(--text)]"
                  }`}
                >
                  {parent.name}
                </Link>
                {parent.children && parent.children.length > 0 && (
                  <ul className="ms-3 mt-0.5 space-y-0.5 border-s border-[var(--border)] ps-2">
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`${base}/products?category=${child.slug}`}
                          className={`block rounded-md px-3 py-1.5 transition hover:bg-[var(--surface-muted)] ${
                            category === child.slug
                              ? "bg-brand-50 font-medium text-brand-700"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <div>
          <ProductFilterBar locale={locale} dict={dict} />

          {products.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
              {dict.common.noResults}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}

          {products.pages > 1 && (
            <Pagination
              current={products.page}
              pages={products.pages}
              basePath={`${base}/products`}
              query={sp}
              dict={dict}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  current,
  pages,
  basePath,
  query,
  dict,
}: {
  current: number;
  pages: number;
  basePath: string;
  query: Record<string, string | string[] | undefined>;
  dict: ReturnType<typeof getDictionary>;
}) {
  const href = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const v = Array.isArray(value) ? value[0] : value;
      if (v && key !== "page") params.set(key, v);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {current > 1 && (
        <Link
          href={href(current - 1)}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-[var(--surface-muted)]"
        >
          ‹
        </Link>
      )}
      <span className="px-3 py-2 text-sm text-[var(--text-muted)]">
        {dict.common.page} {current} {dict.common.of} {pages}
      </span>
      {current < pages && (
        <Link
          href={href(current + 1)}
          className="rounded-md border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-[var(--surface-muted)]"
        >
          ›
        </Link>
      )}
    </nav>
  );
}
