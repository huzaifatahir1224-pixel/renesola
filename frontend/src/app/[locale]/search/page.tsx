import type { Metadata } from "next";
import Link from "next/link";

import { AiSearchBox } from "@/components/AiSearchBox";
import { groupedSearch } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale, SearchResult } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search products, blog articles, projects, and application scenarios.",
};

const GROUP_LABELS: Record<string, string> = {
  product: "Products",
  post: "Blog",
  "case-study": "Projects",
  scenario: "Scenarios",
  download: "Downloads",
  page: "Pages",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";

  let groups: Record<string, SearchResult[]> = {};
  let failed = false;
  if (q) {
    try {
      const result = await groupedSearch(q, locale, 6);
      groups = result.groups;
    } catch {
      failed = true;
    }
  }

  const total = Object.values(groups).reduce((sum, list) => sum + list.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.ai.title}</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Ask a question in your own words, or use the keyword search below.
        </p>
      </header>

      <AiSearchBox locale={locale} dict={dict} />

      <form action={`${base}/search`} method="get" className="mt-10 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Keyword search — model number, topic, city…"
          aria-label={dict.nav.search}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--surface-muted)]"
        >
          {dict.nav.search}
        </button>
      </form>

      {q && (
        <div className="mt-8">
          {failed ? (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600" role="alert">
              Search is unavailable right now. Please try again.
            </p>
          ) : total === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-14 text-center text-sm text-[var(--text-muted)]">
              {dict.common.noResults}
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-[var(--text-muted)]">
                {total} results for <span className="font-medium text-[var(--text)]">{q}</span>
              </p>

              <div className="space-y-8">
                {Object.entries(groups).map(([type, results]) => (
                  <section key={type}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      {GROUP_LABELS[type] ?? type}
                    </h2>
                    <ul className="space-y-2">
                      {results.map((item) => (
                        <li key={item.source_id}>
                          <Link
                            href={`${base}${item.url_path}`}
                            className="block rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4 transition hover:border-brand-400 hover:shadow-[var(--shadow-card)]"
                          >
                            <h3 className="font-medium text-brand-600">{item.title}</h3>
                            {item.summary && (
                              <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                                {item.summary}
                              </p>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
