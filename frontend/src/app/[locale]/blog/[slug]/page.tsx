import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPost, getPosts } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const post = await getPost(slug, locale);
    return {
      title: post.seo_title ?? post.title ?? "Article",
      description: post.seo_description ?? post.excerpt ?? undefined,
      openGraph: {
        type: "article",
        publishedTime: post.published_at ?? undefined,
        images: post.cover_image?.url ? [post.cover_image.url] : undefined,
      },
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function PostPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  let post;
  try {
    post = await getPost(slug, locale);
  } catch {
    notFound();
  }

  const related = await getPosts(locale, { category: post.category, per_page: 4 });
  const others = related.items.filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    image: post.cover_image?.url,
    author: { "@type": "Organization", name: "ReneSola Pakistan" },
    publisher: { "@type": "Organization", name: "ReneSola Pakistan" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
          <Link href={`${base}/blog`} className="hover:text-brand-600">
            ← {dict.nav.blog}
          </Link>
        </nav>

        <span className="inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {post.category.replace("-", " ")}
        </span>

        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {typeof post.view_count === "number" && post.view_count > 0 && (
            <span>· {post.view_count} views</span>
          )}
        </div>

        {post.cover_image?.url && (
          <div className="relative mt-7 aspect-video overflow-hidden rounded-2xl bg-[var(--surface-muted)]">
            <Image
              src={post.cover_image.url}
              alt={post.cover_image.alt ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {post.excerpt && (
          <p className="mt-7 text-lg leading-relaxed text-[var(--text-muted)]">{post.excerpt}</p>
        )}

        {post.body && (
          <div
            className="prose-cms mt-7"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-[var(--border)] pt-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`${base}/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:border-brand-400 hover:text-brand-600"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </article>

      {others.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--surface-muted)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-bold">More from this category</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {others.map((item) => (
                <Link
                  key={item.id}
                  href={`${base}/blog/${item.slug}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 transition hover:shadow-[var(--shadow-card-hover)]"
                >
                  <h3 className="font-semibold leading-snug group-hover:text-brand-600">
                    {item.title}
                  </h3>
                  {item.published_at && (
                    <time className="mt-2 block text-xs text-[var(--text-muted)]">
                      {new Date(item.published_at).toLocaleDateString(locale)}
                    </time>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
