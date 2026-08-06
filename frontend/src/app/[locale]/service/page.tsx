import type { Metadata } from "next";

import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { getOffices } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "After-sales Service",
  description: "Report a fault, request technical support, or file a warranty claim.",
};

export default async function ServicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  const offices = await getOffices(locale);
  const hq = offices.find((o) => o.is_headquarters) ?? offices[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          We are always ready for you
        </h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Have a problem with an installed system? Tell us what happened and attach photos — our
          technical team will pick it up from here.
        </p>
      </header>

      <ServiceRequestForm dict={dict} />

      {hq && (
        <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Urgent? Call us directly.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm">
            {hq.phone && (
              <a href={`tel:${hq.phone}`} className="font-semibold text-brand-600 hover:underline">
                {hq.phone}
              </a>
            )}
            {hq.email && (
              <a href={`mailto:${hq.email}`} className="font-semibold text-brand-600 hover:underline">
                {hq.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
