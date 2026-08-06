import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "ReneSola Pakistan",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME ?? "ReneSola Pakistan"}`,
  },
};

/**
 * The real <html> attributes are set by the [locale] layout, which knows the language
 * and text direction. This root only loads fonts and global CSS.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
