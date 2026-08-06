/** Shapes returned by the FastAPI backend. Keep in sync with `app/services/serializers.py`. */

export type Locale = "en" | "ur" | "ar" | "zh";

export const RTL_LOCALES: Locale[] = ["ur", "ar"];

export interface MediaRef {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizes?: Record<string, { url: string; width: number }>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CategoryBrief {
  id: string;
  slug: string;
  name: string | null;
}

export interface Category extends CategoryBrief {
  description: string | null;
  parent_id: string | null;
  banner_image: MediaRef | null;
  sort_order: number;
  children?: Category[];
}

export type ProductType =
  | "mono-facial"
  | "bifacial"
  | "inverter"
  | "battery"
  | "storage-cabinet";

export type CellTechnology = "n-type" | "hjt-type" | "bc" | "p-type";

export interface ProductCard {
  id: string;
  slug: string;
  name: string | null;
  model_number: string;
  short_description: string | null;
  product_type: ProductType | null;
  cell_technology: CellTechnology | null;
  power_min: number | null;
  power_max: number | null;
  max_efficiency: number | null;
  hero_image: MediaRef | null;
  category: CategoryBrief | null;
}

export interface SpecRow {
  label: string;
  value: string;
  unit?: string | null;
}

export interface SpecGroup {
  group_title: string;
  rows: SpecRow[];
}

export interface Feature {
  title: string;
  description?: string | null;
  icon?: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuing_body: string | null;
  certificate_number?: string | null;
  issued_year?: number | null;
  description?: string | null;
  image: MediaRef | null;
}

export interface Product extends ProductCard {
  power_tolerance: string | null;
  annual_degradation: string | null;
  mechanical_load_positive: number | null;
  mechanical_load_negative: number | null;
  warranty_product_years: number | null;
  warranty_power_years: number | null;
  gallery: MediaRef[];
  features: Feature[];
  spec_groups: SpecGroup[];
  datasheet: MediaRef | null;
  installation_manual: MediaRef | null;
  warranty_document: MediaRef | null;
  certifications: Certification[];
  related_products: ProductCard[];
  scenarios: { id: string; slug: string; name: string | null }[];
  seo_title: string | null;
  seo_description: string | null;
}

export interface Scenario {
  id: string;
  slug: string;
  name: string | null;
  intro: string | null;
  hero_image: MediaRef | null;
  parent_id: string | null;
  sort_order: number;
  children?: Scenario[];
  body?: string | null;
  benefits?: { title: string; description?: string }[];
  system_diagram?: MediaRef | null;
  recommended_products?: ProductCard[];
  related_cases?: CaseStudy[];
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface CaseStudy {
  id: string;
  slug: string;
  project_name: string | null;
  city: string | null;
  country: string | null;
  capacity_label: string | null;
  capacity_kw: number | null;
  system_type: "residential" | "commercial" | "utility" | null;
  year: number | null;
  cover_image: MediaRef | null;
  description?: string | null;
  products?: ProductCard[];
}

export type PostCategory = "company-news" | "industry-news" | "exhibitions";

export interface Post {
  id: string;
  slug: string;
  title: string | null;
  excerpt: string | null;
  category: PostCategory;
  tags: string[];
  published_at: string | null;
  cover_image: MediaRef | null;
  body?: string | null;
  view_count?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export type DownloadCategory =
  | "datasheet"
  | "company"
  | "certificate"
  | "warranty"
  | "installation"
  | "stored-energy"
  | "regional";

export interface DownloadItem {
  id: string;
  title: string | null;
  category: DownloadCategory;
  region: string | null;
  file: MediaRef | null;
  thumbnail: MediaRef | null;
  download_count: number;
}

export interface Office {
  id: string;
  region_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_headquarters: boolean;
}

export interface Milestone {
  id: string;
  year: number;
  title: string | null;
  description: string | null;
  image: MediaRef | null;
}

export interface SearchResult {
  source_type: "product" | "post" | "case-study" | "scenario" | "download" | "page";
  source_id: string;
  title: string;
  summary: string | null;
  url_path: string;
  image_url: string | null;
  score: number;
}

export interface AiAnswer {
  question: string;
  answer: string;
  model: string | null;
  sources: SearchResult[];
}

export interface ProductFilters {
  category?: string;
  product_type?: ProductType;
  cell_technology?: CellTechnology;
  power_gte?: number;
  power_lte?: number;
  efficiency_gte?: number;
  search?: string;
  featured?: boolean;
  page?: number;
  per_page?: number;
}
