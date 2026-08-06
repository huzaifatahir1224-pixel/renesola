import type { Metadata } from "next";
import Image from "next/image";

import { getCertifications } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Certification & Honors",
  description: "IEC, ISO, TÜV, and UL certifications held across the product range.",
};

export default async function HonorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  const certifications = await getCertifications(locale, true);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.honors}</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Every certificate below is the document a tender committee or a lender will ask you to
          produce. Certificate copies are available in the download centre.
        </p>
      </header>

      {certifications.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          No certifications added yet.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert) => (
            <li
              key={cert.id}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)]"
            >
              {cert.image?.url && (
                <div className="relative aspect-4/3 bg-[var(--surface-muted)]">
                  <Image
                    src={cert.image.url}
                    alt={cert.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-contain p-4"
                  />
                </div>
              )}
              <div className="p-5">
                <h2 className="font-semibold">{cert.name}</h2>
                {cert.issuing_body && (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    Issued by {cert.issuing_body}
                    {cert.issued_year ? ` · ${cert.issued_year}` : ""}
                  </p>
                )}
                {cert.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {cert.description}
                  </p>
                )}
                {cert.certificate_number && (
                  <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                    {cert.certificate_number}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
