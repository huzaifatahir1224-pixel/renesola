"use client";

import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin";

interface ServiceRequest {
  id: string;
  project_address: string;
  project_size: string | null;
  fault_description: string;
  photos: { url: string; filename: string }[];
  contact_name: string;
  contact_number: string;
  contact_email: string;
  status: string;
  internal_notes: string | null;
  created_at: string;
}

const STATUSES = ["open", "in-progress", "resolved", "closed"];

export default function AdminServiceRequestsPage() {
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}&per_page=50` : "?per_page=50";
      const data = await adminApi.get<{ items: ServiceRequest[]; total: number }>(
        `/service-requests${query}`,
      );
      setItems(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load service requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/service-requests/${id}`, { status });
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Service requests</h1>
        <p className="text-sm text-[var(--text-muted)]">{total} total</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...STATUSES].map((status) => (
          <button
            key={status || "all"}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full border px-3 py-1 text-sm capitalize transition ${
              filter === status
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-brand-400"
            }`}
          >
            {(status || "all").replace("-", " ")}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-14 text-center text-sm text-[var(--text-muted)]">
          No service requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{item.contact_name}</h2>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    <a href={`tel:${item.contact_number}`} className="hover:text-brand-600">
                      {item.contact_number}
                    </a>
                    {" · "}
                    <a href={`mailto:${item.contact_email}`} className="hover:text-brand-600">
                      {item.contact_email}
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>

                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("-", " ")}</option>
                  ))}
                </select>
              </div>

              <dl className="mt-4 grid gap-3 rounded-lg bg-[var(--surface-muted)] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Project address</dt>
                  <dd className="mt-0.5">{item.project_address}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Project size</dt>
                  <dd className="mt-0.5">{item.project_size || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[var(--text-muted)]">Fault description</dt>
                  <dd className="mt-0.5 whitespace-pre-line">{item.fault_description}</dd>
                </div>
              </dl>

              {item.photos?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.photos.map((photo, index) =>
                    photo.url ? (
                      <a
                        key={index}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-brand-600 hover:underline"
                      >
                        {photo.filename}
                      </a>
                    ) : (
                      <span
                        key={index}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                      >
                        {photo.filename} (not uploaded)
                      </span>
                    ),
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
