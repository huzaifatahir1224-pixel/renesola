import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InquiryForm } from "@/components/InquiryForm";
import { ProductCard } from "@/components/ProductCard";
import { getProduct } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await getProduct(slug, locale);
    return {
      title: product.seo_title ?? `${product.name} — ${product.model_number}`,
      description: product.seo_description ?? product.short_description ?? undefined,
      openGraph: {
        images: product.hero_image?.url ? [product.hero_image.url] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

const CELL_LABEL: Record<string, string> = {
  "n-type": "N-Type",
  "hjt-type": "HJT-Type",
  bc: "BC (Back Contact)",
  "p-type": "P-Type",
};

export default async function ProductDetailPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  let product;
  try {
    product = await getProduct(slug, locale);
  } catch {
    notFound();
  }

  const power =
    product.power_min && product.power_max
      ? `${product.power_min}–${product.power_max} W`
      : null;

  const highlights = [
    { label: dict.product.power, value: power },
    {
      label: dict.product.efficiency,
      value: product.max_efficiency ? `${product.max_efficiency}%` : null,
    },
    {
      label: dict.product.cellType,
      value: product.cell_technology ? CELL_LABEL[product.cell_technology] : null,
    },
    { label: dict.product.tolerance, value: product.power_tolerance },
    { label: dict.product.degradation, value: product.annual_degradation },
    {
      label: dict.product.mechanicalLoad,
      value:
        product.mechanical_load_positive || product.mechanical_load_negative
          ? `+${product.mechanical_load_positive ?? "—"} / −${product.mechanical_load_negative ?? "—"} Pa`
          : null,
    },
    {
      label: dict.product.warranty,
      value: product.warranty_power_years
        ? `${product.warranty_product_years ?? "—"} yr product / ${product.warranty_power_years} yr power`
        : null,
    },
  ].filter((item) => item.value);

  const documents = [
    { label: dict.product.datasheet, media: product.datasheet },
    { label: dict.product.installationManual, media: product.installation_manual },
    { label: dict.product.warrantyDocument, media: product.warranty_document },
  ].filter((doc) => doc.media?.url);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--text-muted)]">
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
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`${base}/products?category=${product.category.slug}`}
                  className="hover:text-brand-600"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
            {product.hero_image?.url ? (
              <Image
                src={product.hero_image.url}
                alt={product.hero_image.alt ?? product.name ?? product.model_number}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8"
                priority
              />
            ) : (
              <div className="grid h-full place-items-center text-[var(--text-muted)]">
                No image
              </div>
            )}
          </div>

          {product.gallery.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.gallery.slice(0, 8).map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]"
                >
                  <Image
                    src={image.url}
                    alt={image.alt ?? ""}
                    fill
                    sizes="15vw"
                    className="object-contain p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">{product.model_number}</p>

          {product.short_description && (
            <p className="mt-4 leading-relaxed text-[var(--text-muted)]">
              {product.short_description}
            </p>
          )}

          {highlights.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-[var(--text-muted)]">{item.label}</dt>
                  <dd className="mt-0.5 font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.certifications.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">{dict.product.certifications}</h2>
              <ul className="flex flex-wrap gap-2">
                {product.certifications.map((cert) => (
                  <li
                    key={cert.id}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]"
                  >
                    {cert.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {documents.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">{dict.product.documents}</h2>
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.label}>
                    <a
                      href={doc.media!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                        <path d="M10 3v10m0 0 3.5-3.5M10 13 6.5 9.5M3.5 15.5h13" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {doc.label} (PDF)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <InquiryForm
              locale={locale}
              dict={dict}
              productId={product.id}
              productName={`${product.name} — ${product.model_number}`}
            />
          </div>
        </div>
      </div>

      {/* Features */}
      {product.features.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{dict.product.features}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {product.features.map((feature, index) => (
              <div
                key={`${feature.title}-${index}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                {feature.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                    {feature.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Specification tables — real HTML, so they are searchable and translatable */}
      {product.spec_groups.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{dict.product.specifications}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {product.spec_groups.map((group) => (
              <div
                key={group.group_title}
                className="overflow-hidden rounded-xl border border-[var(--border)]"
              >
                <h3 className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold">
                  {group.group_title}
                </h3>
                <div className="scroll-x">
                  <table className="w-full text-sm">
                    <tbody>
                      {group.rows.map((row, index) => (
                        <tr
                          key={`${row.label}-${index}`}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <th
                            scope="row"
                            className="w-1/2 px-4 py-2.5 text-start font-normal text-[var(--text-muted)]"
                          >
                            {row.label}
                          </th>
                          <td className="px-4 py-2.5 font-medium">
                            {row.value}
                            {row.unit ? ` ${row.unit}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {product.related_products.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{dict.product.relatedProducts}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {product.related_products.map((related) => (
              <ProductCard key={related.id} product={related} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
