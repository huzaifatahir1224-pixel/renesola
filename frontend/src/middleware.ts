import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

const CODES = LOCALES.map((l) => l.code);

/**
 * Every public page lives under /{locale}/…, which gives each language its own
 * indexable URL. Requests without one are redirected to the visitor's best match.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = CODES.some(
    (code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`),
  );
  if (hasLocale) return NextResponse.next();

  const preferred =
    request.headers
      .get("accept-language")
      ?.split(",")
      .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
      .find((code) => CODES.includes(code as (typeof CODES)[number])) ?? DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the admin panel (not localised), and anything with a file extension.
  matcher: ["/((?!_next|api|admin|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
