import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/ProductCard";
import { getScenario } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const scenario = await getScenario(slug, locale);
    return {
      title: scenario.seo_title ?? scenario.name ?? "Scenario",
      description: scenario.seo_description ?? scenario.intro ?? undefined,
    };
  } catch {
    return { title: "Scenario" };
  }
}

export default async function ScenarioDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  let scenario;
  try {
    scenario = await getScenario(slug, locale);
  } catch {
    notFound();
  }

  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        {scenario.hero_image?.url && (
          <Image
            src={scenario.hero_image.url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/70">
            <Link href={`${base}/scenarios`} className="hover:text-white">
              ← {dict.nav.scenarios}
            </Link>
          </nav>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {scenario.name}
          </h1>
          {scenario.intro && (
            <p className="mt-4 max-w-2xl text-lg text-white/80">{scenario.intro}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {scenario.body && (
          <div
            className="prose-cms max-w-3xl"
            dangerouslySetInnerHTML={{ __html: scenario.body }}
          />
        )}

        {scenario.benefits && scenario.benefits.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Why it works</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {scenario.benefits.map((benefit, index) => (
                <div
                  key={`${benefit.title}-${index}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"
                >
                  <h3 className="font-semibold">{benefit.title}</h3>
                  {benefit.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                      {benefit.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {scenario.system_diagram?.url && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold tracking-tight">System overview</h2>
            <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
              <Image
                src={scenario.system_diagram.url}
                alt="System diagram"
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain p-4"
              />
            </div>
          </section>
        )}

        {scenario.recommended_products && scenario.recommended_products.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Recommended products</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {scenario.recommended_products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl bg-brand-600 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Planning a system like this?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">
            Send us your load profile or electricity bill and our engineers will size it for you.
          </p>
          <Link
            href={`${base}/contact`}
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {dict.common.inquireNow}
          </Link>
        </section>
      </div>
    </>
  );
}
