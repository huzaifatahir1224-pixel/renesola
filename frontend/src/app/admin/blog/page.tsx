"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin";

interface Row {
  id: string;
  slug: string;
  title: string | null;
  category: string;
  published_at: string | null;
}

export default function AdminBlogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<{ items: Row[]; total: number }>("/posts?per_page=50");
      setRows(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, label: string) {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      await adminApi.remove(`/posts/${id}`);
      load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-[var(--text-muted)]">{total} published posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New post
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Title</th>
                <th className="px-4 py-3 text-start font-medium">Category</th>
                <th className="px-4 py-3 text-start font-medium">Published</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[var(--text-muted)]">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[var(--text-muted)]">No posts yet.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3 capitalize text-[var(--text-muted)]">
                      {row.category.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {row.published_at ? new Date(row.published_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link href={`/admin/blog/${row.id}`} className="me-3 text-brand-600 hover:underline">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.title ?? row.slug)}
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
    </div>
  );
}
