import type { Metadata } from "next";
import Link from "next/link";

import { getMilestones } from "@/lib/api";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const metadata: Metadata = {
  title: "About",
  description:
    "A Tier 1 photovoltaic manufacturer, project developer, and EPC — founded 2005, 30 GW+ shipped.",
};

const STATS = [
  { value: "2005", label: "Founded" },
  { value: "30 GW+", label: "Cumulative shipments" },
  { value: "14", label: "Consecutive years BNEF Tier 1" },
  { value: "200+", label: "Quality test items" },
];

const VALUES = [
  {
    title: "Mission",
    body: "Develop solar energy to benefit all humanity — practical, affordable generation wherever it is needed.",
  },
  {
    title: "Core values",
    body: "Client orientation, sustainable shareholder returns, and genuine benefit to the people who work here.",
  },
  {
    title: "Spirit",
    body: "Sincere, plain, reverent, thankful. We would rather under-promise on a datasheet than explain a shortfall later.",
  },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const base = `/${locale}`;

  const milestones = await getMilestones(locale);

  return (
    <>
      <section className="bg-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            A Tier 1 photovoltaic manufacturer, developer, and EPC
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">
            Founded in 2005, ReneSola develops, finances, designs, builds, and maintains solar
            projects — and manufactures the modules that go into them.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-3xl font-bold text-brand-600">{stat.value}</span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section id="introduction" className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Who we are</h2>
          <div className="prose-cms mt-4">
            <p>
              ReneSola is a global photovoltaic company operating across the full project
              lifecycle — module manufacturing, project development, EPC delivery, and long-term
              operations and maintenance. Cumulative shipments exceed 30 GW across more than 80%
              of the world&apos;s solar markets.
            </p>
            <p>
              Manufacturing runs from production bases in Jiangsu, Yunnan, and Henan, with 16.5 GW
              of module capacity and 5 GW of cell capacity added in the most recent expansion.
              Every module passes more than 200 individual test items before it ships.
            </p>
            <p>
              In Pakistan we supply modules and storage through a distribution and installer
              network, with local technical support for system design, net metering documentation,
              and warranty handling.
            </p>
          </div>
        </section>

        <section id="culture" className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">What we stand for</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6"
              >
                <h3 className="font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{value.body}</p>
              </div>
            ))}
          </div>
        </section>

        {milestones.length > 0 && (
          <section id="history" className="mt-16">
            <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Our history</h2>
            <ol className="relative border-s-2 border-[var(--border)] ps-6">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="mb-8 last:mb-0">
                  <span
                    className="absolute -start-[9px] mt-1.5 grid h-4 w-4 place-items-center rounded-full border-2 border-brand-600 bg-[var(--surface)]"
                    aria-hidden
                  />
                  <span className="text-lg font-bold text-brand-600">{milestone.year}</span>
                  <h3 className="mt-0.5 font-semibold">{milestone.title}</h3>
                  {milestone.description && (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                      {milestone.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-16 rounded-2xl bg-brand-600 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">See our certifications</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">
            IEC, ISO, TÜV, and UL credentials — the documents tenders and lenders ask for.
          </p>
          <Link
            href={`${base}/honors`}
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            {dict.nav.honors}
          </Link>
        </section>
      </div>
    </>
  );
}
