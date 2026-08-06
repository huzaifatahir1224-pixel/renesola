import Image from "next/image";
import Link from "next/link";

import type { Locale, ProductCard as ProductCardType } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  "mono-facial": "Mono-Facial",
  bifacial: "Bifacial",
  inverter: "Inverter",
  battery: "Battery",
  "storage-cabinet": "Storage",
};

export function ProductCard({ product, locale }: { product: ProductCardType; locale: Locale }) {
  const power =
    product.power_min && product.power_max
      ? product.power_min === product.power_max
        ? `${product.power_max} W`
        : `${product.power_min}–${product.power_max} W`
      : null;

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-[var(--surface-muted)]">
        {product.hero_image?.url ? (
          <Image
            src={product.hero_image.url}
            alt={product.hero_image.alt ?? product.name ?? product.model_number}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-[var(--text-muted)]">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 10h20M8 4v16M16 4v16" />
            </svg>
          </div>
        )}
        {product.product_type && (
          <span className="absolute start-3 top-3 rounded-full bg-brand-600/95 px-2.5 py-1 text-xs font-medium text-white">
            {TYPE_LABEL[product.product_type] ?? product.product_type}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug group-hover:text-brand-600">
          {product.name ?? product.model_number}
        </h3>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{product.model_number}</p>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
          {power && (
            <div className="flex gap-1">
              <dt className="sr-only">Power</dt>
              <dd className="font-medium text-[var(--text)]">{power}</dd>
            </div>
          )}
          {product.max_efficiency && (
            <div className="flex gap-1">
              <dt>Eff.</dt>
              <dd className="font-medium text-[var(--text)]">{product.max_efficiency}%</dd>
            </div>
          )}
        </dl>
      </div>
    </Link>
  );
}
