import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCategoryTree, getOffices, getScenarios } from "@/lib/api";
import { LOCALES, dirFor, getDictionary, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const dir = dirFor(locale);

  // The mega menu and footer need the same data on every page — fetch once here.
  const [categories, scenarios, offices] = await Promise.all([
    getCategoryTree(locale),
    getScenarios(locale),
    getOffices(locale),
  ]);

  return (
    <div dir={dir} lang={locale} className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} categories={categories} scenarios={scenarios} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} categories={categories} offices={offices} />
    </div>
  );
}
