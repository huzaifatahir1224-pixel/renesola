import type { Metadata } from "next";
import Link from "next/link";

import { getDownloads } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Download Centre",
  description: "Datasheets, certificates, installation manuals, and warranty documents.",
};

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "datasheet", label: "Datasheet" },
  { value: "certificate", label: "Certificate" },
  { value: "warranty", label: "Warranty" },
  { value: "installation", label: "Installation" },
  { value: "stored-energy", label: "Stored Energy" },
  { value: "company", label: "Company" },
  { value: "regional", label: "Regional" },
];

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DownloadsPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const sp = await searchParams;
  const category = first(sp.category);
  const downloads = await getDownloads(locale, { category, per_page: 48 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.downloads}</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Datasheets, certificates, and manuals. These are the documents you need to design a
          system, submit a tender, or file a warranty claim.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold">Categories</h2>
          <ul className="space-y-1 text-sm">
            {CATEGORIES.map((item) => {
              const active = (category ?? "") === item.value;
              return (
                <li key={item.label}>
                  <Link
                    href={item.value ? `${base}/downloads?category=${item.value}` : `${base}/downloads`}
                    className={`block rounded-md px-3 py-2 transition hover:bg-[var(--surface-muted)] ${
                      active
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div>
          {downloads.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
              No documents in this category yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {downloads.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600">
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                        <path d="M11.5 2H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 18h8a1.5 1.5 0 0 0 1.5-1.5V6z" />
                        <path d="M11.5 2v4h4" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {item.category.replace("-", " ")}
                        {item.region ? ` · ${item.region}` : ""}
                      </p>
                    </div>
                  </div>

                  {item.file?.url ? (
                    <div className="mt-auto flex gap-2">
                      <a
                        href={item.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm transition hover:bg-[var(--surface-muted)]"
                      >
                        {dict.common.preview}
                      </a>
                      <a
                        href={item.file.url}
                        download
                        className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-700"
                      >
                        {dict.common.download}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-auto text-xs text-[var(--text-muted)]">
                      File not uploaded yet — add it in the admin panel.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
