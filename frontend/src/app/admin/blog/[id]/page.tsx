"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { adminApi } from "@/lib/admin";

/** Shape of the public post-detail response we read back into the form. */
interface PostDetailResponse {
  title?: string | null;
  slug?: string;
  category?: string;
  excerpt?: string | null;
  body?: string | null;
  tags?: string[];
  published_at?: string | null;
  cover_image?: { id?: string; url?: string } | null;
}

export default function BlogEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [title, setTitle] = useState("");
  const [titleUr, setTitleUr] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("company-news");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [coverId, setCoverId] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [featured, setFeatured] = useState(false);

  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    adminApi
      .get<{ items: { id: string; slug: string }[] }>("/posts?per_page=200")
      .then(async (list) => {
        const match = list.items.find((p) => p.id === params.id);
        if (!match) throw new Error("Post not found");
        const full = await adminApi.get<PostDetailResponse>(`/posts/${match.slug}`);
        setTitle(full.title ?? "");
        setSlug(full.slug ?? "");
        setCategory(full.category ?? "company-news");
        setExcerpt(full.excerpt ?? "");
        setBody(full.body ?? "");
        setTags((full.tags ?? []).join(", "));
        setPublishedAt(full.published_at ? full.published_at.slice(0, 10) : "");
        setCoverId(full.cover_image?.id ?? "");
        setCoverUrl(full.cover_image?.url ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoaded(true));
  }, [isNew, params.id]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: { en: title, ...(titleUr ? { ur: titleUr } : {}) },
      category,
      excerpt: excerpt ? { en: excerpt } : null,
      body: body ? { en: body } : null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image_id: coverId || null,
      published_at: publishedAt ? `${publishedAt}T09:00:00` : null,
      is_published: isPublished,
      featured,
    };
    if (slug) payload.slug = slug;

    try {
      if (isNew) await adminApi.post("/posts", payload);
      else await adminApi.patch(`/posts/${params.id}`, payload);
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";
  const label = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "New blog post" : "Edit blog post"}</h1>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="block">
          <span className={label}>Title (English) *</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>Title (Urdu)</span>
          <input value={titleUr} onChange={(e) => setTitleUr(e.target.value)} dir="rtl" className={field} />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>Category *</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              <option value="company-news">Company News</option>
              <option value="industry-news">Industry News</option>
              <option value="exhibitions">Exhibition Information</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>Publish date</span>
            <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>URL slug</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" className={field} />
          </label>
        </div>

        <label className="block">
          <span className={label}>Excerpt</span>
          <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={field} />
        </label>

        <label className="block">
          <span className={label}>Tags</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="solar, pakistan, net-metering" className={field} />
        </label>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">Cover image</h2>
        <MediaPicker
          value={coverId}
          previewUrl={coverUrl}
          prefix="blog"
          onChange={(id, url) => {
            setCoverId(id);
            setCoverUrl(url);
          }}
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">Body</h2>
        <RichTextEditor value={body} onChange={setBody} />
      </section>

      <section className="flex flex-wrap gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4" />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4" />
          Featured
        </label>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[var(--border)] px-5 py-2 text-sm">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
