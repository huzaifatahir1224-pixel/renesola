"use client";

import { useState } from "react";

import { submitInquiry } from "@/lib/api";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface Props {
  locale: Locale;
  dict: Dictionary;
  productId?: string;
  productName?: string;
  source?: string;
  compact?: boolean;
}

export function InquiryForm({
  locale,
  dict,
  productId,
  productName,
  source = "product-page",
  compact = false,
}: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const contactName = String(form.get("contact_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();

    const nextErrors: Record<string, string> = {};
    if (!contactName) nextErrors.contact_name = dict.form.required;
    if (!email) nextErrors.email = dict.form.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = dict.form.invalidEmail;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setState("sending");
    try {
      const result = await submitInquiry({
        contact_name: contactName,
        email,
        company_name: String(form.get("company_name") ?? "") || undefined,
        phone: String(form.get("phone") ?? "") || undefined,
        country: String(form.get("country") ?? "") || undefined,
        message: String(form.get("message") ?? "") || undefined,
        product_id: productId,
        source,
        locale,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      setMessage(result.message);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-6 text-center"
      >
        <p className="font-semibold text-green-700 dark:text-green-400">{message}</p>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5"
    >
      <h2 className="text-lg font-semibold">{dict.common.inquireNow}</h2>
      {productName && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{productName}</p>
      )}

      <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">
            {dict.form.contactName} <span className="text-red-500">*</span>
          </span>
          <input
            name="contact_name"
            required
            aria-invalid={Boolean(errors.contact_name)}
            className={field}
          />
          {errors.contact_name && (
            <span className="mt-1 block text-xs text-red-500">{errors.contact_name}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">
            {dict.form.email} <span className="text-red-500">*</span>
          </span>
          <input
            name="email"
            type="email"
            required
            aria-invalid={Boolean(errors.email)}
            className={field}
          />
          {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">{dict.form.companyName}</span>
          <input name="company_name" className={field} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">{dict.form.phone}</span>
          <input name="phone" type="tel" className={field} />
        </label>

        <label className={`block ${compact ? "" : "sm:col-span-2"}`}>
          <span className="mb-1 block text-xs font-medium">{dict.form.message}</span>
          <textarea name="message" rows={4} className={field} />
        </label>
      </div>

      {state === "error" && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600" role="alert">
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {state === "sending" ? dict.form.sending : dict.form.submit}
      </button>
    </form>
  );
}
