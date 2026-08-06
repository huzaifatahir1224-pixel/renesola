import type { Metadata } from "next";

import { InquiryForm } from "@/components/InquiryForm";
import { getOffices } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to our sales and technical team about modules, storage, and system design.",
};

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  const offices = await getOffices(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.contact}</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Please fill in your details accurately and keep the line open — we will get back to you
          as soon as possible.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="mb-5 text-xl font-semibold">Our offices</h2>
          <ul className="space-y-4">
            {offices.map((office) => (
              <li
                key={office.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{office.region_name}</h3>
                  {office.is_headquarters && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Head Office
                    </span>
                  )}
                </div>
                <address className="mt-3 space-y-1.5 text-sm not-italic text-[var(--text-muted)]">
                  {office.address && <p>{office.address}</p>}
                  {office.phone && (
                    <p>
                      <a href={`tel:${office.phone}`} className="hover:text-brand-600">
                        {office.phone}
                      </a>
                    </p>
                  )}
                  {office.email && (
                    <p>
                      <a href={`mailto:${office.email}`} className="hover:text-brand-600">
                        {office.email}
                      </a>
                    </p>
                  )}
                </address>
                {office.latitude && office.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${office.latitude},${office.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-brand-600 hover:underline"
                  >
                    View on map →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-xl font-semibold">Send us a message</h2>
          <InquiryForm locale={locale} dict={dict} source="contact-page" />
        </div>
      </div>
    </div>
  );
}
