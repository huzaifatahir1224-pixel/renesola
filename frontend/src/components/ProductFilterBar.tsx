"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/**
 * Power / efficiency / technology filters — the thing the reference site does not have.
 * Engineers arrive knowing the wattage they need, not the model name.
 */
export function ProductFilterBar({ dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // a new filter always starts at page 1
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeCount = ["product_type", "cell_technology", "power_gte", "power_lte", "search"].filter(
    (key) => searchParams.get(key),
  ).length;

  const clearAll = () => {
    const params = new URLSearchParams();
    const category = searchParams.get("category");
    if (category) params.set("category", category);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
          </svg>
          {dict.product.filters}
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount}</span>
          )}
        </button>

        <input
          type="search"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("search", (e.target as HTMLInputElement).value);
          }}
          placeholder="Model number or name…"
          aria-label="Search products"
          className="min-w-48 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
        />

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-brand-600 hover:underline"
          >
            {dict.product.clearFilters}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Type</span>
            <select
              value={searchParams.get("product_type") ?? ""}
              onChange={(e) => setParam("product_type", e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Any</option>
              <option value="mono-facial">Mono-Facial</option>
              <option value="bifacial">Bifacial</option>
              <option value="inverter">Inverter</option>
              <option value="battery">Battery</option>
              <option value="storage-cabinet">Storage Cabinet</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              {dict.product.cellType}
            </span>
            <select
              value={searchParams.get("cell_technology") ?? ""}
              onChange={(e) => setParam("cell_technology", e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Any</option>
              <option value="n-type">N-Type</option>
              <option value="hjt-type">HJT-Type</option>
              <option value="bc">BC (Back Contact)</option>
              <option value="p-type">P-Type</option>
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
              {dict.product.powerRange}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                defaultValue={searchParams.get("power_gte") ?? ""}
                onBlur={(e) => setParam("power_gte", e.target.value)}
                placeholder="Min"
                aria-label="Minimum power"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <span className="text-[var(--text-muted)]">–</span>
              <input
                type="number"
                inputMode="numeric"
                defaultValue={searchParams.get("power_lte") ?? ""}
                onBlur={(e) => setParam("power_lte", e.target.value)}
                placeholder="Max"
                aria-label="Maximum power"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
