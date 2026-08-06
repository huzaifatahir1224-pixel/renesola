/** UI strings. Content comes from the CMS; only chrome lives here. */

import type { Locale } from "./types";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return LOCALES.some((l) => l.code === value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
}

// No `as const` anywhere below: literal types would make every translation
// incompatible with the English shape ("ہوم" is not assignable to "Home").
const en = {
  nav: {
    home: "Home",
    products: "Products",
    scenarios: "Scenario Application",
    support: "Service & Support",
    cases: "Application Cases",
    service: "After-sales Service",
    downloads: "Download",
    blog: "Blog",
    about: "About",
    contact: "Contact",
    honors: "Certification & Honors",
    search: "Search",
  },
  common: {
    learnMore: "Learn More",
    viewAll: "View All",
    readMore: "Read More",
    inquireNow: "Inquire Now",
    download: "Download",
    preview: "Preview",
    backTo: "Back to",
    noResults: "No results found. Please try a different keyword.",
    loading: "Loading…",
    page: "Page",
    of: "of",
  },
  product: {
    specifications: "Specifications",
    features: "Features",
    certifications: "Certifications",
    documents: "Documents",
    relatedProducts: "Related Products",
    datasheet: "Datasheet",
    installationManual: "Installation Manual",
    warrantyDocument: "Warranty",
    power: "Power",
    efficiency: "Max Efficiency",
    cellType: "Cell Type",
    tolerance: "Power Tolerance",
    degradation: "Annual Degradation",
    mechanicalLoad: "Mechanical Load",
    warranty: "Warranty",
    filters: "Filters",
    clearFilters: "Clear all",
    powerRange: "Power range (W)",
    allCategories: "All categories",
    productsFound: "products",
  },
  form: {
    companyName: "Company Name",
    contactName: "Contact Name",
    email: "Email",
    phone: "Phone",
    country: "Country",
    message: "Message",
    submit: "Submit",
    reset: "Reset",
    sending: "Sending…",
    required: "This field is required",
    invalidEmail: "Enter a valid email address",
    projectAddress: "Project Address",
    projectSize: "Project Size",
    faultDescription: "Fault Description",
    livePictures: "Live Pictures",
    uploadHint: "JPG only, up to 5 MB each",
  },
  ai: {
    title: "AI Intelligent Answer",
    placeholder: "Ask about our products — e.g. “600W bifacial panel for a factory roof”",
    ask: "Ask",
    thinking: "Searching our catalogue…",
    sources: "Sources",
    disclaimer: "Answers are generated from our product catalogue. For pricing, contact sales.",
  },
};

export type Dictionary = typeof en;

const ur: Dictionary = {
  nav: {
    home: "ہوم",
    products: "مصنوعات",
    scenarios: "استعمال کے مواقع",
    support: "سروس اور سپورٹ",
    cases: "منصوبے",
    service: "بعد از فروخت سروس",
    downloads: "ڈاؤن لوڈ",
    blog: "بلاگ",
    about: "ہمارے بارے میں",
    contact: "رابطہ",
    honors: "اسناد و اعزازات",
    search: "تلاش",
  },
  common: {
    learnMore: "مزید جانیں",
    viewAll: "سب دیکھیں",
    readMore: "مزید پڑھیں",
    inquireNow: "ابھی رابطہ کریں",
    download: "ڈاؤن لوڈ",
    preview: "پیش نظارہ",
    backTo: "واپس",
    noResults: "کوئی نتیجہ نہیں ملا۔ دوسرا لفظ آزمائیں۔",
    loading: "لوڈ ہو رہا ہے…",
    page: "صفحہ",
    of: "از",
  },
  product: {
    specifications: "تفصیلات",
    features: "خصوصیات",
    certifications: "اسناد",
    documents: "دستاویزات",
    relatedProducts: "متعلقہ مصنوعات",
    datasheet: "ڈیٹا شیٹ",
    installationManual: "تنصیب گائیڈ",
    warrantyDocument: "وارنٹی",
    power: "پاور",
    efficiency: "زیادہ سے زیادہ کارکردگی",
    cellType: "سیل کی قسم",
    tolerance: "پاور ٹالرنس",
    degradation: "سالانہ کمی",
    mechanicalLoad: "میکینیکل لوڈ",
    warranty: "وارنٹی",
    filters: "فلٹرز",
    clearFilters: "سب ہٹائیں",
    powerRange: "پاور رینج (واٹ)",
    allCategories: "تمام اقسام",
    productsFound: "مصنوعات",
  },
  form: {
    companyName: "کمپنی کا نام",
    contactName: "نام",
    email: "ای میل",
    phone: "فون",
    country: "ملک",
    message: "پیغام",
    submit: "بھیجیں",
    reset: "دوبارہ",
    sending: "بھیجا جا رہا ہے…",
    required: "یہ خانہ ضروری ہے",
    invalidEmail: "درست ای میل درج کریں",
    projectAddress: "منصوبے کا پتہ",
    projectSize: "منصوبے کا سائز",
    faultDescription: "خرابی کی تفصیل",
    livePictures: "تصاویر",
    uploadHint: "صرف JPG، زیادہ سے زیادہ 5 MB",
  },
  ai: {
    title: "اے آئی ذہین جواب",
    placeholder: "ہماری مصنوعات کے بارے میں پوچھیں",
    ask: "پوچھیں",
    thinking: "کیٹلاگ تلاش کیا جا رہا ہے…",
    sources: "حوالہ جات",
    disclaimer: "جوابات ہمارے پروڈکٹ کیٹلاگ سے بنائے جاتے ہیں۔ قیمت کے لیے سیلز سے رابطہ کریں۔",
  },
};

const dictionaries: Partial<Record<Locale, Dictionary>> = { en, ur };

export function getDictionary(locale: Locale): Dictionary {
  // Arabic and Chinese fall back to English chrome until translated.
  return dictionaries[locale] ?? en;
}
