"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/admin";

interface MediaItem {
  id: string;
  url: string;
  filename?: string;
  mime_type?: string;
}

/** Upload a new file or pick one already in the library. */
export function MediaPicker({
  value,
  previewUrl,
  onChange,
  prefix = "",
}: {
  value: string;
  previewUrl: string | null;
  onChange: (id: string, url: string | null) => void;
  prefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    adminApi
      .get<{ items: MediaItem[] }>("/media?images_only=true&per_page=60")
      .then((data) => setLibrary(data.items))
      .catch(() => setError("Could not load the media library"));
  }, [open]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const media = await adminApi.upload(file, prefix);
      onChange(media.id, media.url);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
          {previewUrl ? (
            <Image src={previewUrl} alt="" fill sizes="112px" className="object-contain p-2" />
          ) : (
            <div className="grid h-full place-items-center text-xs text-[var(--text-muted)]">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            {busy ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUpload}
              disabled={busy}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-muted)]"
          >
            {open ? "Close library" : "Choose from library"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("", null)}
              className="rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-500/10"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-[var(--border)] p-3">
          {library.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              Nothing in the library yet.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {library.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id, item.url);
                    setOpen(false);
                  }}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${
                    value === item.id ? "border-brand-600" : "border-transparent hover:border-brand-300"
                  }`}
                >
                  <Image src={item.url} alt="" fill sizes="100px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
