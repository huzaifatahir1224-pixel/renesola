import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/ProductCard";
import { getCase } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const item = await getCase(slug, locale);
    return {
      title: item.project_name ?? "Case Study",
      description: `${item.capacity_label ?? ""} solar installation in ${item.city ?? ""}, ${item.country ?? ""}.`,
    };
  } catch {
    return { title: "Case Study" };
  }
}

export default async function CaseDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  let item;
  try {
    item = await getCase(slug, locale);
  } catch {
    notFound();
  }

  const facts = [
    { label: "Location", value: [item.city, item.country].filter(Boolean).join(", ") },
    { label: "Capacity", value: item.capacity_label },
    {
      label: "Type",
      value: item.system_type
        ? { residential: "Residential", commercial: "Commercial & Industrial", utility: "Utility Scale" }[
            item.system_type
          ]
        : null,
    },
    { label: "Commissioned", value: item.year ? String(item.year) : null },
  ].filter((f) => f.value);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
        <Link href={`${base}/cases`} className="hover:text-brand-600">
          ← {dict.nav.cases}
        </Link>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{item.project_name}</h1>

      {item.cover_image?.url && (
        <div className="relative mt-7 aspect-video overflow-hidden rounded-2xl bg-[var(--surface-muted)]">
          <Image
            src={item.cover_image.url}
            alt={item.project_name ?? ""}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-[var(--text-muted)]">{fact.label}</dt>
            <dd className="mt-1 font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {item.description && (
        <div className="prose-cms mt-8" dangerouslySetInnerHTML={{ __html: item.description }} />
      )}

      {item.products && item.products.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold">Products used</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {item.products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
