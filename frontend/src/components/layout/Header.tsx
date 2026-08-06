"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n";
import type { Category, Locale, Scenario } from "@/lib/types";

interface Props {
  locale: Locale;
  dict: Dictionary;
  categories: Category[];
  scenarios: Scenario[];
}

export function Header({ locale, dict, categories, scenarios }: Props) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Any navigation closes whatever was open — otherwise the menu hangs over the new page.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  const base = `/${locale}`;
  const strip = (path: string) => path.replace(/^\/[a-z]{2}/, "") || "/";

  const nav = [
    {
      key: "products",
      label: dict.nav.products,
      href: `${base}/products`,
      columns: categories.map((c) => ({
        title: c.name ?? "",
        href: `${base}/products?category=${c.slug}`,
        items: (c.children ?? []).map((child) => ({
          label: child.name ?? "",
          href: `${base}/products?category=${child.slug}`,
        })),
      })),
    },
    {
      key: "scenarios",
      label: dict.nav.scenarios,
      href: `${base}/scenarios`,
      columns: scenarios.map((s) => ({
        title: s.name ?? "",
        href: `${base}/scenarios/${s.slug}`,
        items: (s.children ?? []).map((child) => ({
          label: child.name ?? "",
          href: `${base}/scenarios/${child.slug}`,
        })),
      })),
    },
    {
      key: "support",
      label: dict.nav.support,
      href: `${base}/cases`,
      columns: [
        {
          title: dict.nav.support,
          href: `${base}/cases`,
          items: [
            { label: dict.nav.cases, href: `${base}/cases` },
            { label: dict.nav.service, href: `${base}/service` },
            { label: dict.nav.downloads, href: `${base}/downloads` },
          ],
        },
      ],
    },
    {
      key: "blog",
      label: dict.nav.blog,
      href: `${base}/blog`,
      columns: [
        {
          title: dict.nav.blog,
          href: `${base}/blog`,
          items: [
            { label: "Company News", href: `${base}/blog?category=company-news` },
            { label: "Industry News", href: `${base}/blog?category=industry-news` },
            { label: "Exhibitions", href: `${base}/blog?category=exhibitions` },
          ],
        },
      ],
    },
    {
      key: "about",
      label: dict.nav.about,
      href: `${base}/about`,
      columns: [
        {
          title: dict.nav.about,
          href: `${base}/about`,
          items: [{ label: dict.nav.honors, href: `${base}/honors` }],
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href={base} className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10l2.1 2.1M4.9 19.1l2.1-2.1m10-10l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
          <span className="hidden sm:inline">ReneSola</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {nav.map((item) => (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => setOpenMenu(item.key)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                href={item.href}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                aria-expanded={openMenu === item.key}
              >
                {item.label}
                {item.columns.length > 0 && (
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                    <path d="M5.2 7.4 10 12l4.8-4.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </Link>

              {openMenu === item.key && item.columns.length > 0 && (
                <div className="absolute start-0 top-full z-50 pt-1">
                  <div className="grid min-w-[15rem] gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-card-hover)] sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <Link
                          href={column.href}
                          className="mb-2 block text-sm font-semibold text-[var(--text)] hover:text-brand-600"
                        >
                          {column.title}
                        </Link>
                        <ul className="space-y-1.5">
                          {column.items.map((sub) => (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className="block text-sm text-[var(--text-muted)] transition hover:text-brand-600"
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link
            href={`${base}/contact`}
            className="rounded-md px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          >
            {dict.nav.contact}
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href={`${base}/search`}
            aria-label={dict.nav.search}
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          >
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
          </Link>

          <LanguageSwitcher current={locale} path={strip(pathname)} />

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] lg:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {mobileOpen ? (
                <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <nav className="border-t border-[var(--border)] bg-[var(--surface)] lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {nav.map((item) => (
              <details key={item.key} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium">
                  {item.label}
                  <span className="text-[var(--text-muted)] transition group-open:rotate-180">▾</span>
                </summary>
                <div className="ms-3 border-s border-[var(--border)] ps-3">
                  {item.columns.map((column) => (
                    <div key={column.title} className="py-1.5">
                      <Link href={column.href} className="block py-1 text-sm font-medium">
                        {column.title}
                      </Link>
                      {column.items.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block py-1 text-sm text-[var(--text-muted)]"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <Link href={`${base}/contact`} className="block rounded-md px-3 py-2.5 text-sm font-medium">
              {dict.nav.contact}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function LanguageSwitcher({ current, path }: { current: Locale; path: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M2.5 10h15M10 2.5c2 2.4 3 4.9 3 7.5s-1 5.1-3 7.5c-2-2.4-3-4.9-3-7.5s1-5.1 3-7.5Z" />
        </svg>
        <span className="uppercase">{current}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul className="absolute end-0 z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-card-hover)]">
            {LOCALES.map((l) => (
              <li key={l.code}>
                <Link
                  href={`/${l.code}${path === "/" ? "" : path}`}
                  className={`block px-3 py-2 text-sm transition hover:bg-[var(--surface-muted)] ${
                    l.code === current ? "font-semibold text-brand-600" : "text-[var(--text-muted)]"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
