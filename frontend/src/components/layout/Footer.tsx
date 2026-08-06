import Link from "next/link";

import type { Dictionary } from "@/lib/i18n";
import type { Category, Locale, Office } from "@/lib/types";

interface Props {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  offices: Office[];
}

export function Footer({ locale, dict, categories, offices }: Props) {
  const base = `/${locale}`;
  const hq = offices.find((o) => o.is_headquarters) ?? offices[0];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </span>
              ReneSola
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Photovoltaic modules, energy storage, and turnkey solar solutions for homes,
              industry, and utility-scale power plants across Pakistan.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">{dict.nav.products}</h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/products?category=${c.slug}`}
                    className="text-sm text-[var(--text-muted)] transition hover:text-brand-600"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">{dict.nav.support}</h3>
            <ul className="space-y-2">
              {[
                { label: dict.nav.cases, href: `${base}/cases` },
                { label: dict.nav.service, href: `${base}/service` },
                { label: dict.nav.downloads, href: `${base}/downloads` },
                { label: dict.nav.honors, href: `${base}/honors` },
                { label: dict.nav.blog, href: `${base}/blog` },
                { label: dict.nav.contact, href: `${base}/contact` },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">{dict.nav.contact}</h3>
            {hq ? (
              <address className="space-y-2 text-sm not-italic text-[var(--text-muted)]">
                {hq.address && <p>{hq.address}</p>}
                {hq.phone && (
                  <p>
                    <a href={`tel:${hq.phone}`} className="transition hover:text-brand-600">
                      {hq.phone}
                    </a>
                  </p>
                )}
                {hq.email && (
                  <p>
                    <a href={`mailto:${hq.email}`} className="transition hover:text-brand-600">
                      {hq.email}
                    </a>
                  </p>
                )}
              </address>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Add your office details in the admin panel.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ReneSola Pakistan. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href={`${base}/privacy`} className="transition hover:text-brand-600">
              Privacy
            </Link>
            <Link href={`${base}/terms`} className="transition hover:text-brand-600">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
