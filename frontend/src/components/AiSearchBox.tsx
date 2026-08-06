"use client";

import Link from "next/link";
import { useState } from "react";

import { askAi } from "@/lib/api";
import type { Dictionary } from "@/lib/i18n";
import type { AiAnswer, Locale } from "@/lib/types";

/**
 * "AI Intelligent Answer" — asks a natural-language question and gets an answer written
 * from the real catalogue, with every source linked so the visitor can verify it.
 */
export function AiSearchBox({
  locale,
  dict,
  variant = "page",
}: {
  locale: Locale;
  dict: Dictionary;
  variant?: "hero" | "page";
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AiAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onHero = variant === "hero";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 2 || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await askAi(trimmed, locale));
    } catch {
      setError("The assistant is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span
            className={`pointer-events-none absolute inset-y-0 start-3 grid place-items-center ${
              onHero ? "text-white/60" : "text-[var(--text-muted)]"
            }`}
            aria-hidden
          >
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M10 2.5 11.6 7 16 8.6 11.6 10.2 10 14.7 8.4 10.2 4 8.6 8.4 7z" strokeLinejoin="round" />
              <path d="M15.5 13.5 16.2 15.4 18 16 16.2 16.7 15.5 18.5 14.9 16.7 13 16l1.9-.6z" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="search"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={dict.ai.placeholder}
            aria-label={dict.ai.title}
            className={`w-full rounded-lg border py-3 ps-10 pe-3 text-sm outline-none transition focus:ring-2 ${
              onHero
                ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:ring-brand-500/25"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={loading || question.trim().length < 2}
          className="shrink-0 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? dict.common.loading : dict.ai.ask}
        </button>
      </form>

      {loading && (
        <p className={`mt-3 text-sm ${onHero ? "text-white/70" : "text-[var(--text-muted)]"}`}>
          {dict.ai.thinking}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 text-start shadow-[var(--shadow-card)]">
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text)]">
            {result.answer}
          </p>

          {result.sources.length > 0 && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {dict.ai.sources}
              </p>
              <ul className="space-y-1.5">
                {result.sources.map((source, index) => (
                  <li key={source.source_id} className="flex gap-2 text-sm">
                    <span className="text-[var(--text-muted)]">[{index + 1}]</span>
                    <Link
                      href={`/${locale}${source.url_path}`}
                      className="text-brand-600 hover:underline"
                    >
                      {source.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--text-muted)]">{dict.ai.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
