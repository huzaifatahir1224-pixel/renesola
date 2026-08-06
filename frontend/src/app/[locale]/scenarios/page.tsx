import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getScenarios } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "Scenario Application",
  description: "Distributed rooftop systems, commercial installations, and ground-mount power plants.",
};

export default async function ScenariosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const scenarios = await getScenarios(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dict.nav.scenarios}</h1>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          The same modules, engineered into different systems depending on where the power is
          generated and consumed.
        </p>
      </header>

      <div className="space-y-12">
        {scenarios.map((parent) => (
          <section key={parent.id}>
            <h2 className="mb-1 text-2xl font-bold">{parent.name}</h2>
            {parent.intro && <p className="mb-5 text-[var(--text-muted)]">{parent.intro}</p>}

            <div className="grid gap-5 sm:grid-cols-2">
              {(parent.children ?? []).map((child) => (
                <Link
                  key={child.id}
                  href={`${base}/scenarios/${child.slug}`}
                  className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-2xl bg-navy-800 p-6"
                >
                  {child.hero_image?.url ? (
                    <Image
                      src={child.hero_image.url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover opacity-55 transition duration-300 group-hover:scale-105 group-hover:opacity-70"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-navy-900" />
                  )}
                  <div className="relative text-white">
                    <h3 className="text-xl font-semibold">{child.name}</h3>
                    {child.intro && (
                      <p className="mt-1.5 text-sm text-white/80">{child.intro}</p>
                    )}
                    <span className="mt-3 inline-block text-sm font-medium text-solar-400">
                      {dict.common.learnMore} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
