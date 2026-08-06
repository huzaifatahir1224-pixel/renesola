/**
 * Server-side data access for the FastAPI backend.
 *
 * Every read is cached and revalidated on a timer, so a page render costs one HTTP
 * call at most and the site keeps serving if the backend is briefly down.
 */

import type {
  AiAnswer,
  CaseStudy,
  Category,
  Certification,
  DownloadItem,
  Milestone,
  Office,
  Paginated,
  Post,
  Product,
  ProductCard,
  ProductFilters,
  Scenario,
  SearchResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const API = `${API_URL}/api/v1`;

/** Content changes rarely; an hour of cache keeps the site fast and the backend quiet. */
const REVALIDATE = 3600;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function get<T>(
  path: string,
  params: Record<string, unknown> = {},
  revalidate: number = REVALIDATE,
): Promise<T> {
  const response = await fetch(`${API}${path}${toQuery(params)}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(`GET ${path} failed: ${response.statusText}`, response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * Read that returns a fallback instead of throwing.
 * A missing "latest news" block should not take down the whole homepage.
 */
async function safeGet<T>(path: string, params: Record<string, unknown>, fallback: T): Promise<T> {
  try {
    return await get<T>(path, params);
  } catch {
    return fallback;
  }
}

const emptyPage = <T>(): Paginated<T> => ({
  items: [],
  total: 0,
  page: 1,
  per_page: 12,
  pages: 1,
});

// ────────────────────────────── Catalogue ──────────────────────────────

export const getCategoryTree = (locale: string) =>
  safeGet<Category[]>("/categories/tree", { locale }, []);

export const getCategory = (slug: string, locale: string) =>
  get<Category>(`/categories/${slug}`, { locale });

export const getProducts = (filters: ProductFilters, locale: string) =>
  safeGet<Paginated<ProductCard>>("/products", { ...filters, locale }, emptyPage<ProductCard>());

export const getProduct = (slug: string, locale: string) =>
  get<Product>(`/products/${slug}`, { locale });

export const getFeaturedProducts = (locale: string, limit = 8) =>
  safeGet<Paginated<ProductCard>>(
    "/products",
    { featured: true, per_page: limit, locale },
    emptyPage<ProductCard>(),
  );

// ────────────────────────────── Content ──────────────────────────────

export const getScenarios = (locale: string) =>
  safeGet<Scenario[]>("/scenarios", { locale }, []);

export const getScenario = (slug: string, locale: string) =>
  get<Scenario>(`/scenarios/${slug}`, { locale });

export const getCases = (
  locale: string,
  params: { page?: number; per_page?: number; system_type?: string; country?: string } = {},
) => safeGet<Paginated<CaseStudy>>("/cases", { ...params, locale }, emptyPage<CaseStudy>());

export const getCase = (slug: string, locale: string) =>
  get<CaseStudy>(`/cases/${slug}`, { locale });

export const getPosts = (
  locale: string,
  params: { page?: number; per_page?: number; category?: string; tag?: string } = {},
) => safeGet<Paginated<Post>>("/posts", { ...params, locale }, emptyPage<Post>());

export const getPost = (slug: string, locale: string) =>
  get<Post>(`/posts/${slug}`, { locale });

export const getDownloads = (
  locale: string,
  params: { page?: number; per_page?: number; category?: string; region?: string } = {},
) => safeGet<Paginated<DownloadItem>>("/downloads", { ...params, locale }, emptyPage<DownloadItem>());

export const getCertifications = (locale: string, honorsOnly = false) =>
  safeGet<Certification[]>("/certifications", { locale, honors_only: honorsOnly }, []);

export const getOffices = (locale: string) => safeGet<Office[]>("/offices", { locale }, []);

export const getMilestones = (locale: string) =>
  safeGet<Milestone[]>("/milestones", { locale }, []);

// ────────────────────────────── Search ──────────────────────────────

/** Search is never cached — results must reflect the query the visitor just typed. */
export async function globalSearch(q: string, locale: string, limit = 20) {
  return get<{ query: string; total: number; results: SearchResult[] }>(
    "/search",
    { q, locale, limit },
    0,
  );
}

export async function groupedSearch(q: string, locale: string, perGroup = 5) {
  return get<{ query: string; groups: Record<string, SearchResult[]> }>(
    "/search/grouped",
    { q, locale, per_group: perGroup },
    0,
  );
}

export async function askAi(question: string, locale: string): Promise<AiAnswer> {
  const response = await fetch(`${API}/search/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, locale }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError("AI request failed", response.status);
  }
  return response.json();
}

// ────────────────────────────── Forms ──────────────────────────────

export interface InquiryPayload {
  contact_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  country?: string;
  message?: string;
  product_id?: string;
  source?: string;
  page_url?: string;
  locale?: string;
}

export async function submitInquiry(payload: InquiryPayload) {
  const response = await fetch(`${API}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.detail ?? "Submission failed", response.status);
  }
  return data as { message: string };
}

export interface ServiceRequestPayload {
  project_address: string;
  project_size?: string;
  fault_description: string;
  photos?: { url: string; filename: string }[];
  contact_name: string;
  contact_number: string;
  contact_email: string;
}

export async function submitServiceRequest(payload: ServiceRequestPayload) {
  const response = await fetch(`${API}/service-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data?.detail ?? "Submission failed", response.status);
  }
  return data as { message: string };
}

export { API_URL, ApiError };
