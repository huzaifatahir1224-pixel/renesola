"use client";

import { useState } from "react";

import { API_URL, submitServiceRequest } from "@/lib/api";
import type { Dictionary } from "@/lib/i18n";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // matches the reference site's 5 MB limit
const ACCEPTED = ["image/jpeg", "image/jpg"];

/** After-sales fault report — mirrors the reference site's Service page form. */
export function ServiceRequestForm({ dict }: { dict: Dictionary }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function handlePhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of chosen) {
      if (!ACCEPTED.includes(file.type)) rejected.push(`${file.name}: JPG only`);
      else if (file.size > MAX_PHOTO_BYTES) rejected.push(`${file.name}: over 5 MB`);
      else accepted.push(file);
    }

    setPhotos(accepted);
    setPhotoError(rejected.length ? rejected.join(" · ") : null);
  }

  async function uploadPhotos(): Promise<{ url: string; filename: string }[]> {
    // The media endpoint requires an editor token, so unauthenticated visitors get a
    // graceful degradation: the report is filed with filenames only.
    const uploaded: { url: string; filename: string }[] = [];
    for (const file of photos) {
      const body = new FormData();
      body.append("file", file);
      body.append("prefix", "service-requests");
      try {
        const response = await fetch(`${API_URL}/api/v1/media`, { method: "POST", body });
        if (response.ok) {
          const data = await response.json();
          uploaded.push({ url: data.url, filename: file.name });
        } else {
          uploaded.push({ url: "", filename: file.name });
        }
      } catch {
        uploaded.push({ url: "", filename: file.name });
      }
    }
    return uploaded;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const projectAddress = String(form.get("project_address") ?? "").trim();
    const faultDescription = String(form.get("fault_description") ?? "").trim();
    const contactName = String(form.get("contact_name") ?? "").trim();
    const contactNumber = String(form.get("contact_number") ?? "").trim();
    const contactEmail = String(form.get("contact_email") ?? "").trim();

    const next: Record<string, string> = {};
    if (!projectAddress) next.project_address = dict.form.required;
    if (!faultDescription) next.fault_description = dict.form.required;
    if (!contactName) next.contact_name = dict.form.required;
    if (!contactNumber) next.contact_number = dict.form.required;
    if (!contactEmail) next.contact_email = dict.form.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      next.contact_email = dict.form.invalidEmail;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setState("sending");
    try {
      const uploaded = photos.length ? await uploadPhotos() : [];
      const result = await submitServiceRequest({
        project_address: projectAddress,
        project_size: String(form.get("project_size") ?? "") || undefined,
        fault_description: faultDescription,
        photos: uploaded,
        contact_name: contactName,
        contact_number: contactNumber,
        contact_email: contactEmail,
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
        className="rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-10 text-center"
      >
        <p className="text-lg font-semibold text-green-700 dark:text-green-400">{message}</p>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";
  const legend = "mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 sm:p-8"
    >
      <fieldset>
        <legend className={legend}>Project information</legend>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {dict.form.projectAddress} <span className="text-red-500">*</span>
            </span>
            <input name="project_address" required className={field} />
            {errors.project_address && (
              <span className="mt-1 block text-xs text-red-500">{errors.project_address}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">{dict.form.projectSize}</span>
            <input name="project_size" placeholder="e.g. 12 kW" className={field} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {dict.form.faultDescription} <span className="text-red-500">*</span>
            </span>
            <textarea name="fault_description" rows={4} required className={field} />
            {errors.fault_description && (
              <span className="mt-1 block text-xs text-red-500">{errors.fault_description}</span>
            )}
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Demand information</legend>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{dict.form.livePictures}</span>
          <input
            type="file"
            accept="image/jpeg"
            multiple
            onChange={handlePhotos}
            className="w-full rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-sm file:me-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
          <span className="mt-1 block text-xs text-[var(--text-muted)]">{dict.form.uploadHint}</span>
          {photos.length > 0 && (
            <span className="mt-1 block text-xs text-green-600">
              {photos.length} photo{photos.length > 1 ? "s" : ""} attached
            </span>
          )}
          {photoError && <span className="mt-1 block text-xs text-red-500">{photoError}</span>}
        </label>
      </fieldset>

      <fieldset>
        <legend className={legend}>Contact information</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {dict.form.contactName} <span className="text-red-500">*</span>
            </span>
            <input name="contact_name" required className={field} />
            {errors.contact_name && (
              <span className="mt-1 block text-xs text-red-500">{errors.contact_name}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {dict.form.phone} <span className="text-red-500">*</span>
            </span>
            <input name="contact_number" type="tel" required className={field} />
            {errors.contact_number && (
              <span className="mt-1 block text-xs text-red-500">{errors.contact_number}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              {dict.form.email} <span className="text-red-500">*</span>
            </span>
            <input name="contact_email" type="email" required className={field} />
            {errors.contact_email && (
              <span className="mt-1 block text-xs text-red-500">{errors.contact_email}</span>
            )}
          </label>
        </div>
      </fieldset>

      {state === "error" && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600" role="alert">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="reset"
          onClick={() => {
            setPhotos([]);
            setErrors({});
            setPhotoError(null);
          }}
          className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
        >
          {dict.form.reset}
        </button>
        <button
          type="submit"
          disabled={state === "sending"}
          className="flex-1 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {state === "sending" ? dict.form.sending : dict.form.submit}
        </button>
      </div>
    </form>
  );
}
