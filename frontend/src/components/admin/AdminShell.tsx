"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type AdminUser, adminApi, clearToken, getToken } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "editor", "sales"] },
  { href: "/admin/products", label: "Products", roles: ["admin", "editor"] },
  { href: "/admin/blog", label: "Blog", roles: ["admin", "editor"] },
  { href: "/admin/media", label: "Media", roles: ["admin", "editor"] },
  { href: "/admin/leads", label: "Inquiries", roles: ["admin", "sales"] },
  { href: "/admin/service-requests", label: "Service Requests", roles: ["admin", "sales"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(!isLogin);

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    adminApi
      .me()
      .then(setUser)
      .catch(() => router.replace("/admin/login"))
      .finally(() => setChecking(false));
  }, [isLogin, router, pathname]);

  if (isLogin) {
    return <div className="min-h-screen bg-[var(--surface-muted)]">{children}</div>;
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--surface-muted)]">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  const visible = NAV.filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-[var(--surface-muted)]">
      <aside className="hidden w-56 shrink-0 flex-col border-e border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-5 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white text-xs">
            RS
          </span>
          Admin
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visible.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          {user && (
            <div className="mb-2 px-3">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-[var(--text-muted)]">{user.role}</p>
            </div>
          )}
          <Link
            href="/en"
            className="block rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            View site →
          </Link>
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace("/admin/login");
            }}
            className="block w-full rounded-md px-3 py-2 text-start text-sm text-red-600 hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] p-2 md:hidden">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-[var(--text-muted)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
