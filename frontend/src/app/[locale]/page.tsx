import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { AiSearchBox } from "@/components/AiSearchBox";
import { getCases, getCategoryTree, getFeaturedProducts, getPosts } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const STATS = [
  { value: "30 GW+", label: "Cumulative shipments" },
  { value: "14 yrs", label: "Consecutive BNEF Tier 1" },
  { value: "25/30", label: "Year linear power warranty" },
  { value: "200+", label: "Quality test items" },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const [featured, categories, cases, posts] = await Promise.all([
    getFeaturedProducts(locale, 8),
    getCategoryTree(locale),
    getCases(locale, { per_page: 6 }),
    getPosts(locale, { per_page: 3 }),
  ]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #1d68f0 0, transparent 45%), radial-gradient(circle at 80% 60%, #f5a623 0, transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="mb-3 text-sm font-medium tracking-wide text-solar-400 uppercase">
            Tier 1 photovoltaic manufacturer
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Solar power for every roof, factory, and grid in Pakistan
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">
            High-efficiency PV modules and energy storage — engineered, certified, and backed
            by a 30-year linear power warranty.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${base}/products`}
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {dict.nav.products}
            </Link>
            <Link
              href={`${base}/contact`}
              className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {dict.common.inquireNow}
            </Link>
          </div>

          <div className="mt-12 max-w-2xl">
            <AiSearchBox locale={locale} dict={dict} variant="hero" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-3xl font-bold text-brand-600">{stat.value}</span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading title={dict.nav.products} href={`${base}/products`} cta={dict.common.viewAll} />
          <div className="grid gap-5 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`${base}/products?category=${category.slug}`}
                className="group relative flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
              >
                {category.banner_image?.url && (
                  <Image
                    src={category.banner_image.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover opacity-25 transition duration-300 group-hover:scale-105"
                  />
                )}
                <div className="relative">
                  <h3 className="text-xl font-semibold group-hover:text-brand-600">{category.name}</h3>
                  {category.children && category.children.length > 0 && (
                    <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                      {category.children.map((c) => c.name).join(" · ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured products ── */}
      {featured.items.length > 0 && (
        <section className="bg-[var(--surface-muted)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading title="Featured Products" href={`${base}/products`} cta={dict.common.viewAll} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.items.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Projects ── */}
      {cases.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading title={dict.nav.cases} href={`${base}/cases`} cta={dict.common.viewAll} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cases.items.map((project) => (
              <Link
                key={project.id}
                href={`${base}/cases/${project.slug}`}
                className="group relative aspect-video overflow-hidden rounded-xl bg-navy-800"
              >
                {project.cover_image?.url && (
                  <Image
                    src={project.cover_image.url}
                    alt={project.project_name ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-85"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                  <p className="text-sm font-semibold">
                    {[project.city, project.country].filter(Boolean).join(", ")}
                  </p>
                  {project.capacity_label && (
                    <p className="text-xs text-white/80">{project.capacity_label}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest news ── */}
      {posts.items.length > 0 && (
        <section className="bg-[var(--surface-muted)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading title={dict.nav.blog} href={`${base}/blog`} cta={dict.common.viewAll} />
            <div className="grid gap-5 md:grid-cols-3">
              {posts.items.map((post) => (
                <Link
                  key={post.id}
                  href={`${base}/blog/${post.slug}`}
                  className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)]"
                >
                  {post.cover_image?.url && (
                    <div className="relative aspect-video bg-[var(--surface-muted)]">
                      <Image
                        src={post.cover_image.url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {post.published_at && (
                      <time className="text-xs text-[var(--text-muted)]" dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString(locale)}
                      </time>
                    )}
                    <h3 className="mt-1.5 font-semibold leading-snug group-hover:text-brand-600">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function SectionHeading({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-medium text-brand-600 hover:underline">
        {cta} →
      </Link>
    </div>
  );
}
