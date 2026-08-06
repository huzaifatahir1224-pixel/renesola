"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { adminApi } from "@/lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(
        String(form.get("email") ?? "").trim(),
        String(form.get("password") ?? ""),
      );
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)]"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
            RS
          </span>
          <div>
            <h1 className="font-semibold">Admin sign in</h1>
            <p className="text-xs text-[var(--text-muted)]">ReneSola Pakistan</p>
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="username" className={field} />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />
        </label>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
