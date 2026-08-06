"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MediaPicker } from "@/components/admin/MediaPicker";
import { RepeaterField } from "@/components/admin/RepeaterField";
import { adminApi } from "@/lib/admin";

interface CategoryOption {
  id: string;
  name: string | null;
  slug: string;
  children?: CategoryOption[];
}

interface FormState {
  name_en: string;
  name_ur: string;
  model_number: string;
  slug: string;
  short_description_en: string;
  category_id: string;
  product_type: string;
  cell_technology: string;
  power_min: string;
  power_max: string;
  max_efficiency: string;
  power_tolerance: string;
  annual_degradation: string;
  mechanical_load_positive: string;
  mechanical_load_negative: string;
  warranty_product_years: string;
  warranty_power_years: string;
  hero_image_id: string;
  featured: boolean;
  is_published: boolean;
}

const EMPTY: FormState = {
  name_en: "", name_ur: "", model_number: "", slug: "", short_description_en: "",
  category_id: "", product_type: "", cell_technology: "",
  power_min: "", power_max: "", max_efficiency: "",
  power_tolerance: "0~+3%", annual_degradation: "0.40% linear",
  mechanical_load_positive: "5400", mechanical_load_negative: "2400",
  warranty_product_years: "15", warranty_power_years: "30",
  hero_image_id: "", featured: false, is_published: false,
};

interface Feature { title: string; description: string; icon: string }
interface SpecRow { label: string; value: string; unit: string }
interface SpecGroup { group_title: string; rows: SpecRow[] }

/** Shape of the public product-detail response we read back into the form. */
interface ProductDetailResponse {
  name?: string | null;
  model_number?: string;
  slug?: string;
  short_description?: string | null;
  category?: { id?: string } | null;
  product_type?: string | null;
  cell_technology?: string | null;
  power_min?: number | null;
  power_max?: number | null;
  max_efficiency?: number | null;
  power_tolerance?: string | null;
  annual_degradation?: string | null;
  mechanical_load_positive?: number | null;
  mechanical_load_negative?: number | null;
  warranty_product_years?: number | null;
  warranty_power_years?: number | null;
  hero_image?: { id?: string; url?: string } | null;
  features?: Partial<Feature>[];
  spec_groups?: { group_title?: string; rows?: Partial<SpecRow>[] }[];
}

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [form, setForm] = useState<FormState>(EMPTY);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    adminApi.get<CategoryOption[]>("/categories/tree").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    // The admin listing gives us the slug; the detail endpoint gives the full record.
    adminApi
      .get<{ items: { id: string; slug: string }[] }>("/products/admin/all?per_page=200")
      .then(async (list) => {
        const match = list.items.find((p) => p.id === params.id);
        if (!match) throw new Error("Product not found");
        const full = await adminApi.get<ProductDetailResponse>(`/products/${match.slug}`);

        setForm({
          name_en: full.name ?? "",
          name_ur: "",
          model_number: full.model_number ?? "",
          slug: full.slug ?? "",
          short_description_en: full.short_description ?? "",
          category_id: full.category?.id ?? "",
          product_type: full.product_type ?? "",
          cell_technology: full.cell_technology ?? "",
          power_min: full.power_min?.toString() ?? "",
          power_max: full.power_max?.toString() ?? "",
          max_efficiency: full.max_efficiency?.toString() ?? "",
          power_tolerance: full.power_tolerance ?? "",
          annual_degradation: full.annual_degradation ?? "",
          mechanical_load_positive: full.mechanical_load_positive?.toString() ?? "",
          mechanical_load_negative: full.mechanical_load_negative?.toString() ?? "",
          warranty_product_years: full.warranty_product_years?.toString() ?? "",
          warranty_power_years: full.warranty_power_years?.toString() ?? "",
          hero_image_id: full.hero_image?.id ?? "",
          featured: false,
          is_published: true,
        });
        setHeroUrl(full.hero_image?.url ?? null);
        setFeatures(
          (full.features ?? []).map((f) => ({
            title: f.title ?? "", description: f.description ?? "", icon: f.icon ?? "",
          })),
        );
        setSpecGroups(
          (full.spec_groups ?? []).map((g) => ({
            group_title: g.group_title ?? "",
            rows: (g.rows ?? []).map((r) => ({
              label: r.label ?? "", value: r.value ?? "", unit: r.unit ?? "",
            })),
          })),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoaded(true));
  }, [isNew, params.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const num = (value: string) => (value.trim() === "" ? null : Number(value));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: { en: form.name_en, ...(form.name_ur ? { ur: form.name_ur } : {}) },
      model_number: form.model_number,
      short_description: form.short_description_en ? { en: form.short_description_en } : null,
      category_id: form.category_id || null,
      product_type: form.product_type || null,
      cell_technology: form.cell_technology || null,
      power_min: num(form.power_min),
      power_max: num(form.power_max),
      max_efficiency: num(form.max_efficiency),
      power_tolerance: form.power_tolerance || null,
      annual_degradation: form.annual_degradation || null,
      mechanical_load_positive: num(form.mechanical_load_positive),
      mechanical_load_negative: num(form.mechanical_load_negative),
      warranty_product_years: num(form.warranty_product_years),
      warranty_power_years: num(form.warranty_power_years),
      hero_image_id: form.hero_image_id || null,
      features: features.length ? { en: features } : null,
      spec_groups: specGroups.length ? { en: specGroups } : null,
      featured: form.featured,
      is_published: form.is_published,
    };
    if (form.slug) payload.slug = form.slug;

    try {
      if (isNew) await adminApi.post("/products", payload);
      else await adminApi.patch(`/products/${params.id}`, payload);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";
  const label = "mb-1 block text-sm font-medium";

  const flatCategories: { id: string; label: string }[] = [];
  for (const parent of categories) {
    flatCategories.push({ id: parent.id, label: parent.name ?? parent.slug });
    for (const child of parent.children ?? []) {
      flatCategories.push({ id: child.id, label: `   ${child.name ?? child.slug}` });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "New product" : "Edit product"}</h1>
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
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Name (English) *</span>
            <input required value={form.name_en} onChange={(e) => set("name_en", e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Name (Urdu)</span>
            <input value={form.name_ur} onChange={(e) => set("name_ur", e.target.value)} dir="rtl" className={field} />
          </label>
          <label className="block">
            <span className={label}>Model number *</span>
            <input required value={form.model_number} onChange={(e) => set("model_number", e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>URL slug</span>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from model number" className={field} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Short description</span>
          <textarea rows={2} value={form.short_description_en} onChange={(e) => set("short_description_en", e.target.value)} className={field} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={label}>Category</span>
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={field}>
              <option value="">—</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Type</span>
            <select value={form.product_type} onChange={(e) => set("product_type", e.target.value)} className={field}>
              <option value="">—</option>
              <option value="mono-facial">Mono-Facial</option>
              <option value="bifacial">Bifacial</option>
              <option value="inverter">Inverter</option>
              <option value="battery">Battery</option>
              <option value="storage-cabinet">Storage Cabinet</option>
            </select>
          </label>
          <label className="block">
            <span className={label}>Cell technology</span>
            <select value={form.cell_technology} onChange={(e) => set("cell_technology", e.target.value)} className={field}>
              <option value="">—</option>
              <option value="n-type">N-Type</option>
              <option value="hjt-type">HJT-Type</option>
              <option value="bc">BC</option>
              <option value="p-type">P-Type</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">Hero image</h2>
        <MediaPicker
          value={form.hero_image_id}
          previewUrl={heroUrl}
          onChange={(id, url) => {
            set("hero_image_id", id);
            setHeroUrl(url);
          }}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-semibold">Key specs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className={label}>Power min (W)</span>
            <input type="number" value={form.power_min} onChange={(e) => set("power_min", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Power max (W)</span>
            <input type="number" value={form.power_max} onChange={(e) => set("power_max", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Max efficiency (%)</span>
            <input type="number" step="0.01" value={form.max_efficiency} onChange={(e) => set("max_efficiency", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Power tolerance</span>
            <input value={form.power_tolerance} onChange={(e) => set("power_tolerance", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Annual degradation</span>
            <input value={form.annual_degradation} onChange={(e) => set("annual_degradation", e.target.value)} className={field} /></label>
          <div />
          <label className="block"><span className={label}>Load + (Pa)</span>
            <input type="number" value={form.mechanical_load_positive} onChange={(e) => set("mechanical_load_positive", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Load − (Pa)</span>
            <input type="number" value={form.mechanical_load_negative} onChange={(e) => set("mechanical_load_negative", e.target.value)} className={field} /></label>
          <div />
          <label className="block"><span className={label}>Product warranty (yr)</span>
            <input type="number" value={form.warranty_product_years} onChange={(e) => set("warranty_product_years", e.target.value)} className={field} /></label>
          <label className="block"><span className={label}>Power warranty (yr)</span>
            <input type="number" value={form.warranty_power_years} onChange={(e) => set("warranty_power_years", e.target.value)} className={field} /></label>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">Features</h2>
        <RepeaterField
          items={features}
          onChange={setFeatures}
          blank={{ title: "", description: "", icon: "" }}
          addLabel="+ Add feature"
          render={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem]">
              <input placeholder="Title" value={item.title} onChange={(e) => update({ ...item, title: e.target.value })} className={field} />
              <input placeholder="Description" value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} className={field} />
              <select value={item.icon} onChange={(e) => update({ ...item, icon: e.target.value })} className={field}>
                <option value="">Icon</option>
                <option value="module">Module</option>
                <option value="power">Power</option>
                <option value="load">Load</option>
                <option value="reliability">Reliability</option>
                <option value="warranty">Warranty</option>
              </select>
            </div>
          )}
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-1 font-semibold">Specification table</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Rendered as a real HTML table on the product page — searchable and translatable.
        </p>
        <RepeaterField
          items={specGroups}
          onChange={setSpecGroups}
          blank={{ group_title: "", rows: [] }}
          addLabel="+ Add spec group"
          render={(group, update) => (
            <div className="space-y-3">
              <input
                placeholder="Group title — e.g. Electrical Data (STC)"
                value={group.group_title}
                onChange={(e) => update({ ...group, group_title: e.target.value })}
                className={`${field} font-medium`}
              />
              <RepeaterField
                items={group.rows}
                onChange={(rows) => update({ ...group, rows })}
                blank={{ label: "", value: "", unit: "" }}
                addLabel="+ Add row"
                compact
                render={(row, updateRow) => (
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
                    <input placeholder="Label" value={row.label} onChange={(e) => updateRow({ ...row, label: e.target.value })} className={field} />
                    <input placeholder="Value" value={row.value} onChange={(e) => updateRow({ ...row, value: e.target.value })} className={field} />
                    <input placeholder="Unit" value={row.unit} onChange={(e) => updateRow({ ...row, unit: e.target.value })} className={field} />
                  </div>
                )}
              />
            </div>
          )}
        />
      </section>

      <section className="flex flex-wrap gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} className="h-4 w-4" />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4" />
          Featured on homepage
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
