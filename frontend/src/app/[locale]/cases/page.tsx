import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getCases } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Application Cases",
  description: "Installed solar projects across Pakistan — rooftop, commercial, and utility scale.",
};

const TYPES = [
  { value: "", label: "All" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial & Industrial" },
  { value: "utility", label: "Utility Scale" },
];

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CasesPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const sp = await searchParams;
  const systemType = first(sp.system_type);
  const page = Number(first(sp.page) ?? 1) || 1;

  const cases = await getCases(locale, { system_type: systemType, page, per_page: 12 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.cases}</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          {cases.total} installed projects — from household rooftops to multi-megawatt plants.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Project types">
        {TYPES.map((type) => {
          const active = (systemType ?? "") === type.value;
          return (
            <Link
              key={type.label}
              href={type.value ? `${base}/cases?system_type=${type.value}` : `${base}/cases`}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {type.label}
            </Link>
          );
        })}
      </nav>

      {cases.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          {dict.common.noResults}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.items.map((project) => (
            <Link
              key={project.id}
              href={`${base}/cases/${project.slug}`}
              className="group relative aspect-4/3 overflow-hidden rounded-xl bg-navy-800"
            >
              {project.cover_image?.url ? (
                <Image
                  src={project.cover_image.url}
                  alt={project.project_name ?? ""}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-75 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-800 to-navy-900" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white">
                <p className="text-lg font-semibold leading-tight">
                  {[project.city, project.country].filter(Boolean).join(", ")}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
                  {project.capacity_label && <span>{project.capacity_label}</span>}
                  {project.year && <span>· {project.year}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {cases.pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={`${base}/cases?page=${page - 1}${systemType ? `&system_type=${systemType}` : ""}`}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
            >
              ‹
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-[var(--text-muted)]">
            {dict.common.page} {page} {dict.common.of} {cases.pages}
          </span>
          {page < cases.pages && (
            <Link
              href={`${base}/cases?page=${page + 1}${systemType ? `&system_type=${systemType}` : ""}`}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
            >
              ›
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
