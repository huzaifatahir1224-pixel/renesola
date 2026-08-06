"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin";

interface Row {
  id: string;
  slug: string;
  name: string | null;
  model_number: string;
  is_published: boolean;
  category: { name: string | null } | null;
  power_min: number | null;
  power_max: number | null;
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<{
        items: Row[];
        total: number;
        pages: number;
      }>(`/products/admin/all?page=${page}&per_page=20`);
      setRows(data.items);
      setTotal(data.total);
      setPages(data.pages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, label: string) {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await adminApi.remove(`/products/${id}`);
      load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-[var(--text-muted)]">{total} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New product
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-start">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Name</th>
                <th className="px-4 py-3 text-start font-medium">Model</th>
                <th className="px-4 py-3 text-start font-medium">Category</th>
                <th className="px-4 py-3 text-start font-medium">Power</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    No products yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{row.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.model_number}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {row.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {row.power_min && row.power_max ? `${row.power_min}–${row.power_max} W` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.is_published
                            ? "bg-green-500/15 text-green-700"
                            : "bg-amber-500/15 text-amber-700"
                        }`}
                      >
                        {row.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/admin/products/${row.id}`}
                        className="me-3 text-brand-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.model_number)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ‹
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
