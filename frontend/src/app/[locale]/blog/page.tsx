import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPosts } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale, PostCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description: "Company news, solar industry analysis, and exhibition updates.",
};

const CATEGORIES: { value: PostCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "company-news", label: "Company News" },
  { value: "industry-news", label: "Industry News" },
  { value: "exhibitions", label: "Exhibitions" },
];

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const sp = await searchParams;
  const category = first(sp.category) as PostCategory | undefined;
  const tag = first(sp.tag);
  const page = Number(first(sp.page) ?? 1) || 1;

  const posts = await getPosts(locale, { category, tag, page, per_page: 9 });
  const [lead, ...rest] = posts.items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.blog}</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Company news, industry analysis, and exhibition updates.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Blog categories">
        {CATEGORIES.map((item) => {
          const active = (category ?? "") === item.value;
          return (
            <Link
              key={item.label}
              href={item.value ? `${base}/blog?category=${item.value}` : `${base}/blog`}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {tag && (
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Tagged <span className="font-medium text-[var(--text)]">#{tag}</span> ·{" "}
          <Link href={`${base}/blog`} className="text-brand-600 hover:underline">
            clear
          </Link>
        </p>
      )}

      {posts.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          {dict.common.noResults}
        </p>
      ) : (
        <>
          {/* Lead article gets a wider treatment */}
          {lead && page === 1 && (
            <Link
              href={`${base}/blog/${lead.slug}`}
              className="group mb-8 grid gap-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] md:grid-cols-2"
            >
              {lead.cover_image?.url && (
                <div className="relative aspect-video md:aspect-auto md:min-h-64">
                  <Image
                    src={lead.cover_image.url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div className="flex flex-col justify-center p-6 md:pe-8">
                <span className="mb-2 inline-block w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {lead.category.replace("-", " ")}
                </span>
                <h2 className="text-2xl font-bold leading-snug group-hover:text-brand-600">
                  {lead.title}
                </h2>
                {lead.excerpt && (
                  <p className="mt-3 text-[var(--text-muted)]">{lead.excerpt}</p>
                )}
                {lead.published_at && (
                  <time className="mt-4 text-xs text-[var(--text-muted)]" dateTime={lead.published_at}>
                    {new Date(lead.published_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
            </Link>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(page === 1 ? rest : posts.items).map((post) => (
              <Link
                key={post.id}
                href={`${base}/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
              >
                {post.cover_image?.url && (
                  <div className="relative aspect-video bg-[var(--surface-muted)]">
                    <Image
                      src={post.cover_image.url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-600">
                    {post.category.replace("-", " ")}
                  </span>
                  <h3 className="font-semibold leading-snug group-hover:text-brand-600">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--text-muted)]">
                      {post.excerpt}
                    </p>
                  )}
                  {post.published_at && (
                    <time
                      className="mt-3 text-xs text-[var(--text-muted)]"
                      dateTime={post.published_at}
                    >
                      {new Date(post.published_at).toLocaleDateString(locale)}
                    </time>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {posts.pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`${base}/blog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page - 1) })}`}
                  className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                >
                  ‹
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-[var(--text-muted)]">
                {dict.common.page} {page} {dict.common.of} {posts.pages}
              </span>
              {page < posts.pages && (
                <Link
                  href={`${base}/blog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page + 1) })}`}
                  className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                >
                  ›
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
