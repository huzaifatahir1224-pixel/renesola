"use client";

import { useCallback, useEffect, useState } from "react";

import { API_URL, } from "@/lib/api";
import { adminApi, getToken } from "@/lib/admin";

interface Lead {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  source: string;
  status: string;
  page_url: string | null;
  internal_notes: string | null;
  created_at: string;
}

const STATUSES = ["new", "contacted", "qualified", "won", "lost"];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}&per_page=50` : "?per_page=50";
      const data = await adminApi.get<{ items: Lead[]; total: number }>(`/inquiries${query}`);
      setLeads(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    try {
      await adminApi.patch(`/inquiries/${id}`, { status });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function saveNotes(id: string, notes: string) {
    try {
      await adminApi.patch(`/inquiries/${id}`, { internal_notes: notes });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  function exportCsv() {
    // The export endpoint needs the bearer token, so fetch it as a blob and save.
    fetch(`${API_URL}/api/v1/inquiries/export.csv`, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "inquiries.csv";
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => window.alert("Export failed"));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-[var(--text-muted)]">{total} total</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]"
        >
          Export CSV
        </button>
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
            {status || "all"}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-6 py-14 text-center text-sm text-[var(--text-muted)]">
          No inquiries yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">
                    {lead.contact_name}
                    {lead.company_name && (
                      <span className="font-normal text-[var(--text-muted)]"> · {lead.company_name}</span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                    <a href={`mailto:${lead.email}`} className="hover:text-brand-600">{lead.email}</a>
                    {lead.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${lead.phone}`} className="hover:text-brand-600">{lead.phone}</a>
                      </>
                    )}
                    {lead.country && ` · ${lead.country}`}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {new Date(lead.created_at).toLocaleString()} · {lead.source.replace("-", " ")}
                  </p>
                </div>

                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(lead.id, e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm capitalize"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {lead.message && (
                <p className="mt-3 whitespace-pre-line rounded-lg bg-[var(--surface-muted)] p-3 text-sm">
                  {lead.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                className="mt-3 text-sm text-brand-600 hover:underline"
              >
                {expanded === lead.id ? "Hide notes" : "Internal notes"}
              </button>

              {expanded === lead.id && (
                <textarea
                  defaultValue={lead.internal_notes ?? ""}
                  onBlur={(e) => saveNotes(lead.id, e.target.value)}
                  rows={3}
                  placeholder="Notes for the sales team — saved when you click away"
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
