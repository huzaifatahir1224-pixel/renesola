# ReneSola-Style Solar Company Website — Requirements Document

**Reference site:** https://www.renesola-energy.com/
**Domain:** Solar PV manufacturing / EPC / Energy storage — corporate + product catalog website
**Date compiled:** 2026-08-07

---

## 1. Project Overview

A corporate marketing + product catalog website for a solar energy company. It is **not** an e-commerce site — there is no cart, no pricing, no checkout. The business goal is **B2B lead generation**: showcase products, prove credibility (certifications, shipments, case studies), and capture inquiries via forms.

**Core pillars:**
1. Product catalog (PV modules + energy storage) with deep spec pages
2. Application scenarios (where the products get used)
3. Trust signals (certifications, awards, project case studies, company stats)
4. Content marketing (blog / news / exhibitions)
5. Support (downloads center, after-sales fault reporting, contact)
6. Multi-language (11+ locales)

---

## 2. Complete Sitemap

```
/                                   Home
│
├── /products                       Products (all)
│   ├── /products/pv-modules        Photovoltaic Modules
│   │   ├── /bc                       BC (Back Contact)
│   │   ├── /rene-2-n-182             Rene 2-N-182
│   │   ├── /rene-3-n-210             Rene 3-N-210
│   │   ├── /rene-3-hjt-210           Rene 3-HJT-210
│   │   └── /rene-4-rectangular       Rene 4-Rectangular
│   └── /products/energy-storage    Energy Storage
│       ├── /inverter                 Inverter
│       ├── /household-battery        Household Battery
│       ├── /commercial-industrial    Commercial & Industrial Storage
│       └── /power-station            Power Station Project-Level
│   └── /products/{slug}            Product detail page
│
├── /scenarios                      Scenario Application
│   ├── /distributed                  Distributed System
│   │   ├── /industry-commerce        Industry and Commerce
│   │   └── /household                Household
│   └── /ground-power-plants          Ground Power Plants
│       └── /large-surface            Large Surface Power Station
│
├── /support                        Service & Support
│   ├── /cases                        Application Cases (+ /cases/{slug})
│   ├── /service                      After-sales Service (fault report form)
│   └── /downloads                    Download Center (+ /downloads/{category})
│
├── /blog                           Blog / News
│   ├── /blog/company-news
│   ├── /blog/industry-news
│   ├── /blog/exhibitions
│   └── /blog/{slug}                Article detail
│
├── /about                          About
│   ├── #introduction                 Company Introduction
│   ├── #history                      History / Timeline
│   ├── #culture                      Culture
│   └── /about/honors                 Certification & Honors
│
├── /contact                        Contact (global offices + inquiry form)
├── /search                         Global search
├── /tags                           Tag list + /tags/{slug}
└── /{locale}/...                   Language variants
```

**Total unique page templates: 16**

---

## 3. Product Catalog — Full Inventory

### 3.1 Taxonomy (2 levels)

| Level 1 | Level 2 (Series) |
|---|---|
| **Photovoltaic Modules** | BC · Rene 2-N-182 · Rene 3-N-210 · Rene 3-HJT-210 · Rene 4-Rectangular |
| **Energy Storage** | Inverter · Household Battery · Commercial & Industrial Storage · Power Station Project-Level |

### 3.2 PV Module Products (~24 SKUs)

Every series ships in **two variants**: Mono-Facial and Bifacial (dual glass).

| Model | Type | Power Range |
|---|---|---|
| RS4-480~500N-E1 | Mono-facial, N-Type | 480–500 W |
| RS4-490~510NBG-E1 | Bifacial dual glass | 490–510 W |
| RS5-525~545N-E2 | Mono-facial | 525–545 W |
| RS5-535~555NBG-E2 | Bifacial dual glass | 535–555 W |
| RS6-575~600N-E3 | Mono-facial | 575–600 W |
| RS6-580~605NBG-E3 | Bifacial dual glass | 580–605 W |
| RS7-630~650N-E2 | Mono-facial | 630–650 W |
| RS7-635~655NBG-E2 | Bifacial dual glass | 635–655 W |
| RS41-430~450N-E3 | Mono-facial | 430–450 W |
| RS41-440~460NBG-E3 | Bifacial dual glass | 440–460 W |
| RS41J-520~545NBG-E1 | Bifacial, N-Type, 24.51% eff. | 520–545 W |
| RS8-660~675NBG-E1 | Bifacial dual glass | 660–675 W |
| RS9-710~730HBG-E1 | Bifacial, HJT-Type, 23.50% eff. | 710–730 W |

**Overall range:** 430 W – 730 W

### 3.3 Energy Storage Products

**Inverters**
- Off-grid: 3 kW – 12 kW
- European Hybrid: single-phase and three-phase
- American Hybrid
- Split-Phase Hybrid: 8 kW – 15 kW

**Household Batteries**
- LFP chemistry, 51.2 V
- Capacities: 100 Ah, 200 Ah, 312 Ah
- Example model: RSL-05K-WM

**Commercial & Industrial Storage**
- Cabinet: 100 kWh / 50 kW
- Cabinet: 241 kWh / 125 kW
- Liquid cooling: RSESS261-125K

**Power Station Project-Level**
- Utility-scale containerized storage systems

---

## 4. Services Offered (content to represent)

| Service | Description |
|---|---|
| **Panel Manufacturing** | Tier 1 PV module production, own factories |
| **Project Development** | Full solar project development pipeline |
| **EPC** | Engineering, Procurement & Construction |
| **Financing** | Project financing support |
| **Design** | System design for distributed + utility scale |
| **Construction** | Installation and commissioning |
| **O&M / Maintenance** | Ongoing operations and maintenance |
| **After-Sales Support** | Fault reporting, warranty claims, technical help |
| **Full-lifecycle Solutions** | Distributed, household, and large power station turnkey |

---

## 5. Content Models (Data Schema)

### 5.1 Product
```
id, slug, name, model_number, category_id, series_id,
short_description, hero_image, gallery[],
type              — Mono-facial | Bifacial dual glass
cell_technology   — N-Type | HJT-Type | BC
max_efficiency    — e.g. 24.51%
power_range_min / power_range_max (W)
power_tolerance   — e.g. 0~+3%
annual_degradation — e.g. 0.40% linear
mechanical_load_positive / negative — e.g. 5400 Pa / 2400 Pa
features[]        — title + description bullets
certifications[]  — IEC61215, IEC61730, ISO9001:2015, ISO14001:2015, ISO45001:2018
spec_table        — electrical data, mechanical data, temperature coefficients, packaging
warranty          — product warranty + 25/30-year linear power warranty
datasheet_pdf, installation_manual_pdf
applications[]    — linked scenarios
related_products[]
seo_title, seo_description, og_image
locale
```

### 5.2 Category / Series
`id, slug, name, parent_id, banner_image, description, sort_order, locale`

### 5.3 Scenario
`id, slug, name, parent_id, hero_image, gallery[], description, benefits[], system_diagram, recommended_products[], related_cases[], locale`

### 5.4 Case Study
`id, slug, project_name, location_city, location_country, capacity (e.g. "12MW"), capacity_value + unit, system_type (residential/C&I/utility), images[], year, products_used[], description, locale`

Current data: 12+ cases, 100 KW → 12 MW, across China, Brazil, Croatia, Austria.

### 5.5 Blog / News Article
`id, slug, title, category (company-news | industry-news | exhibitions), publish_date, cover_image, excerpt, body_html, tags[], author, view_count, seo fields, locale`

Volume: 100+ articles, 2022 → 2026.

### 5.6 Download Item
`id, title, category, file_pdf, file_size, thumbnail, region (e.g. "For Australia"), product_ref, sort_order, locale`

Categories: **Datasheet, Company, Certificate, Warranty, Installation, For Australia, Stored Energy**

### 5.7 Certification / Honor
`id, name (TUV, UL…), image, issuing_body, year, category, sort_order`

### 5.8 Office / Contact Location
`id, region_name, address, phone, email, latitude, longitude, sort_order`

Known offices: **China HQ** (Changzhou), **Germany** (Freiburg), **Latin America**

### 5.9 Timeline Milestone
`id, year, title, description, image, sort_order`

Known: 2022, 2023, 2024, 2025 entries.

---

## 6. Functional Requirements

### 6.1 Global / Layout
- [ ] Sticky header with logo + main nav
- [ ] **Multi-level mega menu** — 2-level dropdowns (Products → PV Modules → BC/Rene series)
- [ ] Language switcher: **EN, ZH, ES, PT, PL, MS, KO, JA, IT, DE, FR, AR**
- [ ] AR requires **RTL layout support**
- [ ] Breadcrumbs on all inner pages
- [ ] Footer: contact block, nav mirror, social share (Facebook, LinkedIn, Twitter/X), tags link, copyright, ICP/legal filing
- [ ] Fully responsive (mobile / tablet / desktop)
- [ ] Global search + tag-based search

### 6.2 Home
- [ ] Hero banner / slider
- [ ] Key stats counters: **30 GW+ shipments · 14 consecutive years BNEF Tier 1 · 25/30-year warranty · 200+ test items · 80% global market coverage · founded 2005**
- [ ] Product category showcase
- [ ] Scenario application highlights
- [ ] Case study / global presence section
- [ ] Latest news
- [ ] Certification logos strip
- [ ] Inquiry CTA

### 6.3 Product Listing
- [ ] Left sidebar category tree (persistent, expandable)
- [ ] Responsive product grid (cards: image, title, model number)
- [ ] Pagination (12 per page observed)
- [ ] Filters: series, type (mono/bifacial), power range, cell technology
- [ ] Breadcrumb reflecting category depth

### 6.4 Product Detail
- [ ] Image gallery with thumbnails / zoom
- [ ] Product title + model number
- [ ] Highlight specs block (cell type, efficiency, tolerance)
- [ ] Feature sections with icons (module tech, power generation, mechanical load)
- [ ] **Full specification table** (electrical, mechanical, temperature coefficients, packaging)
- [ ] Certification badges
- [ ] Application scenario images
- [ ] **Inquiry form** — Company name, Contact name, Email, Phone, Message → "Inquire Now"
- [ ] Datasheet PDF download
- [ ] Related products carousel
- [ ] Social share buttons

### 6.5 Scenario Pages
- [ ] Hero + description per scenario
- [ ] Image carousel / gallery
- [ ] Benefits list
- [ ] Recommended products
- [ ] Linked case studies

### 6.6 Case Studies
- [ ] Grid of image cards with overlay: `Location, Country — Capacity`
- [ ] Pagination
- [ ] Optional filters: region, capacity, system type
- [ ] Optional detail page per case

### 6.7 Download Center
- [ ] Left-nav category filter (7 categories)
- [ ] Grid of file cards with PDF thumbnail + name
- [ ] **In-browser PDF preview** before download
- [ ] Direct download link
- [ ] Pagination
- [ ] Region-specific grouping (e.g. "For Australia")

### 6.8 After-Sales Service Form
Fields required:
- **Project Information:** Project Address, Project Size, Fault Description
- **Demand Information:** Live Pictures upload — **JPG only, max 5 MB**
- **Contact Information:** Contact Name, Contact Number, Contact E-mail
- **Actions:** Reset, Submit

### 6.9 Blog
- [ ] 3 categories with dedicated listing pages
- [ ] Cards: cover image, title, date, excerpt
- [ ] Article detail with rich text, share buttons, related posts
- [ ] Tag system + tag listing page
- [ ] Pagination
- [ ] Date formats: `YYYY-MM-DD` and `DD Mon, YYYY`

### 6.10 About
- [ ] Intro section with stat counters
- [ ] **History timeline** (year-by-year milestones)
- [ ] Culture block — Mission: *"Develop solar energy benefit all humanity"*; Values: client orientation, shareholder returns, employee benefits; Spirit: sincere, plain, reverent, thankful
- [ ] Manufacturing bases map/section (Jiangsu, Yunnan, Henan provinces)
- [ ] Certification & honors carousel (TUV, UL certificates)

### 6.11 Contact
- [ ] Global office cards: region, address, phone, email
- [ ] **Online Message form**
- [ ] Embedded map
- [ ] Note text: *"Please be sure to fill in the information accurately and keep the communication open"*

### 6.12 Admin / CMS
- [ ] CRUD for all 9 content models
- [ ] Media library (images + PDFs)
- [ ] Per-locale content editing
- [ ] Inquiry/lead inbox with export
- [ ] Menu builder
- [ ] SEO fields per entity
- [ ] Draft / publish workflow

---

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **SEO** | XML sitemap (auto), robots.txt, `hreflang` for 12 locales, canonical URLs, structured data (Organization, Product, BreadcrumbList, Article), meta per page |
| **Performance** | Image optimization (WebP/AVIF), lazy loading, CDN, Lighthouse ≥ 90 |
| **i18n** | 12 languages, RTL for Arabic, locale-prefixed URLs, per-locale content fallback |
| **Accessibility** | WCAG 2.1 AA — alt text, keyboard nav, focus states, contrast |
| **Security** | HTTPS, form CAPTCHA/anti-spam, file upload validation (type + size), rate limiting, CSRF |
| **Compliance** | Cookie consent (GDPR — EU offices), privacy policy, terms |
| **Analytics** | GA4 + form conversion tracking |
| **Browsers** | Latest 2 versions of Chrome, Firefox, Safari, Edge |
| **Email** | Transactional email for form submissions → sales/service inboxes |

---

## 8. Suggested Tech Stack

| Layer | Recommendation | Alternative |
|---|---|---|
| Frontend | **Next.js 15** (App Router, SSG/ISR) | Nuxt 3, Astro |
| Styling | Tailwind CSS + shadcn/ui | — |
| CMS | **Payload CMS** or Strapi (self-host, i18n built in) | Sanity, WordPress headless |
| Database | PostgreSQL | MySQL |
| i18n | `next-intl` | `next-i18next` |
| Media | Cloudinary / S3 + CDN | — |
| Forms | React Hook Form + Zod + Resend | — |
| PDF viewer | `react-pdf` / PDF.js | — |
| Search | Typesense / Meilisearch | Algolia |
| Hosting | Vercel + managed Postgres | VPS + Docker |

---

## 9. Build Phases

| Phase | Scope | Est. |
|---|---|---|
| **1. Foundation** | Design system, layout, header/footer/nav, responsive shell | 1 wk |
| **2. CMS + Models** | All 9 content models, admin, media library | 1.5 wk |
| **3. Products** | Category tree, listing, filters, detail page, spec tables | 2 wk |
| **4. Content Pages** | Home, About, Scenarios, Cases, Honors | 1.5 wk |
| **5. Support** | Download center + PDF preview, service form, contact | 1 wk |
| **6. Blog** | Listings, categories, detail, tags, search | 1 wk |
| **7. i18n** | 12 locales, RTL, hreflang | 1 wk |
| **8. Polish** | SEO, performance, a11y, analytics, QA | 1 wk |

**Total: ~10 weeks** (single full-stack dev)

---

## 10. Content Assets Needed from Client

- [ ] Logo (SVG) + brand guidelines / color palette
- [ ] Product photography for every SKU
- [ ] Full technical spec sheets per product (electrical, mechanical, thermal, packaging)
- [ ] All datasheet / manual / warranty PDFs
- [ ] Certificate scans (IEC, ISO, TUV, UL)
- [ ] Case study photos + project data (location, capacity, year)
- [ ] Company history milestones
- [ ] Factory / facility photos
- [ ] Office addresses, phones, emails per region
- [ ] Translated copy for each target locale

---

## 11. Key Gaps in the Reference Site (opportunities to do better)

1. Category pages reuse a `Customer_case/` URL path for products — **bad IA and SEO**. Use clean `/products/{category}` routes.
2. Spec tables are embedded as **images**, not HTML — not searchable, not accessible, not translatable. Render real HTML tables.
3. Scenario pages are almost entirely images with **no descriptive copy** — weak SEO. Add real content.
4. No product comparison tool.
5. No filtering by power/efficiency on listing pages.
6. Case studies have no detail pages — just cards.
7. No search on blog listings.
8. Certification page shows generic labels ("UL Certificate" ×4) with no issuing detail or dates.
9. No pricing-request or quote-builder flow beyond a basic inquiry form.
