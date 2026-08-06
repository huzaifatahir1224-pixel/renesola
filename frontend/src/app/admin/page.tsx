"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/admin";

interface Counts {
  products: number;
  posts: number;
  inquiries: number;
  serviceRequests: number;
  newInquiries: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [storage, setStorage] = useState<{ backend: string; hint: string | null } | null>(null);

  useEffect(() => {
    async function load() {
      const settled = await Promise.allSettled([
        adminApi.get<{ total: number }>("/products/admin/all?per_page=1"),
        adminApi.get<{ total: number }>("/posts?per_page=1"),
        adminApi.get<{ total: number }>("/inquiries?per_page=1"),
        adminApi.get<{ total: number }>("/service-requests?per_page=1"),
        adminApi.get<{ total: number }>("/inquiries?per_page=1&status=new"),
        adminApi.get<{ backend: string; hint: string | null }>("/media/storage-status"),
      ]);

      const total = (i: number) =>
        settled[i].status === "fulfilled"
          ? ((settled[i] as PromiseFulfilledResult<{ total: number }>).value.total ?? 0)
          : 0;

      setCounts({
        products: total(0),
        posts: total(1),
        inquiries: total(2),
        serviceRequests: total(3),
        newInquiries: total(4),
      });

      if (settled[5].status === "fulfilled") {
        setStorage(
          (settled[5] as PromiseFulfilledResult<{ backend: string; hint: string | null }>).value,
        );
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Products", value: counts?.products, href: "/admin/products" },
    { label: "Blog posts", value: counts?.posts, href: "/admin/blog" },
    { label: "Inquiries", value: counts?.inquiries, href: "/admin/leads", highlight: counts?.newInquiries },
    { label: "Service requests", value: counts?.serviceRequests, href: "/admin/service-requests" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">
        Everything on the public site is managed from here.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:shadow-[var(--shadow-card-hover)]"
          >
            <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-1 text-3xl font-bold">
              {card.value === undefined ? "—" : card.value}
            </p>
            {typeof card.highlight === "number" && card.highlight > 0 && (
              <p className="mt-1 text-xs font-medium text-brand-600">{card.highlight} new</p>
            )}
          </Link>
        ))}
      </div>

      {storage && (
        <div
          className={`mt-6 rounded-xl border p-5 ${
            storage.backend === "supabase"
              ? "border-green-500/30 bg-green-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <p className="text-sm font-medium">
            File storage: <span className="capitalize">{storage.backend}</span>
          </p>
          {storage.hint && <p className="mt-1 text-sm text-[var(--text-muted)]">{storage.hint}</p>}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New product
          </Link>
          <Link
            href="/admin/blog/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New blog post
          </Link>
          <Link
            href="/admin/media"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]"
          >
            Upload media
          </Link>
        </div>
      </div>
    </div>
  );
}
