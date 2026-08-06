"""Seed content: catalogue taxonomy, products, scenarios, cases, blog posts, and company data.

Product specs mirror the reference catalogue. Blog copy is written for the Pakistani
market — net metering, load shedding, tariffs — because that is what will actually earn
search traffic here.
"""

from typing import Any

# ─────────────────────────────── Categories ───────────────────────────────

CATEGORIES: list[dict[str, Any]] = [
    {
        "slug": "photovoltaic-modules",
        "name": {"en": "Photovoltaic Modules", "ur": "شمسی ماڈیولز"},
        "description": {
            "en": "N-type, HJT and back-contact solar modules from 430 W to 730 W.",
            "ur": "430 واٹ سے 730 واٹ تک کے سولر ماڈیولز۔",
        },
        "sort_order": 1,
        "children": [
            {"slug": "bc", "name": {"en": "BC", "ur": "بی سی"}, "sort_order": 1},
            {"slug": "rene-2-n-182", "name": {"en": "Rene 2-N-182"}, "sort_order": 2},
            {"slug": "rene-3-n-210", "name": {"en": "Rene 3-N-210"}, "sort_order": 3},
            {"slug": "rene-3-hjt-210", "name": {"en": "Rene 3-HJT-210"}, "sort_order": 4},
            {"slug": "rene-4-rectangular", "name": {"en": "Rene 4-Rectangular"}, "sort_order": 5},
        ],
    },
    {
        "slug": "energy-storage",
        "name": {"en": "Energy Storage", "ur": "توانائی ذخیرہ"},
        "description": {
            "en": "Hybrid inverters, LFP home batteries, and commercial storage cabinets.",
            "ur": "ہائبرڈ انورٹر، ایل ایف پی بیٹریاں اور کمرشل اسٹوریج۔",
        },
        "sort_order": 2,
        "children": [
            {"slug": "inverter", "name": {"en": "Inverter", "ur": "انورٹر"}, "sort_order": 1},
            {"slug": "household-battery", "name": {"en": "Household Battery", "ur": "گھریلو بیٹری"}, "sort_order": 2},
            {"slug": "commercial-industrial-storage", "name": {"en": "Commercial & Industrial Storage"}, "sort_order": 3},
            {"slug": "power-station-project-level", "name": {"en": "Power Station Project-Level"}, "sort_order": 4},
        ],
    },
]

# ─────────────────────────────── Products ───────────────────────────────


def _module_specs(pmax: int, voc: float, vmp: float, imp: float, eff: float, dims: str, weight: float):
    return {
        "en": [
            {
                "group_title": "Electrical Data (STC)",
                "rows": [
                    {"label": "Maximum Power (Pmax)", "value": str(pmax), "unit": "Wp"},
                    {"label": "Open Circuit Voltage (Voc)", "value": str(voc), "unit": "V"},
                    {"label": "Voltage at Maximum Power (Vmp)", "value": str(vmp), "unit": "V"},
                    {"label": "Current at Maximum Power (Imp)", "value": str(imp), "unit": "A"},
                    {"label": "Module Efficiency", "value": str(eff), "unit": "%"},
                ],
            },
            {
                "group_title": "Mechanical Data",
                "rows": [
                    {"label": "Dimensions (L x W x H)", "value": dims, "unit": "mm"},
                    {"label": "Weight", "value": str(weight), "unit": "kg"},
                    {"label": "Front Glass", "value": "2.0 mm anti-reflective coated", "unit": ""},
                    {"label": "Frame", "value": "Anodised aluminium alloy", "unit": ""},
                    {"label": "Junction Box", "value": "IP68 rated", "unit": ""},
                    {"label": "Connector", "value": "MC4 compatible", "unit": ""},
                ],
            },
            {
                "group_title": "Temperature Coefficients",
                "rows": [
                    {"label": "Temperature Coefficient of Pmax", "value": "-0.30", "unit": "%/°C"},
                    {"label": "Temperature Coefficient of Voc", "value": "-0.24", "unit": "%/°C"},
                    {"label": "Temperature Coefficient of Isc", "value": "+0.045", "unit": "%/°C"},
                    {"label": "Nominal Operating Cell Temperature", "value": "43 ± 2", "unit": "°C"},
                ],
            },
            {
                "group_title": "Operating Conditions",
                "rows": [
                    {"label": "Maximum System Voltage", "value": "1500", "unit": "V DC"},
                    {"label": "Operating Temperature", "value": "-40 to +85", "unit": "°C"},
                    {"label": "Maximum Series Fuse Rating", "value": "30", "unit": "A"},
                    {"label": "Application Class", "value": "Class A", "unit": ""},
                ],
            },
        ]
    }


_MONO_FEATURES = {
    "en": [
        {
            "title": "Non-destructive cutting",
            "description": "MBB half-cut cells reduce internal losses and improve shade tolerance.",
            "icon": "module",
        },
        {
            "title": "Excellent low-irradiation performance",
            "description": "Strong IAM response keeps output high on hazy mornings and cloudy days.",
            "icon": "power",
        },
        {
            "title": "5400 Pa mechanical load",
            "description": "Certified for 5400 Pa positive and 2400 Pa negative load — snow, wind, and monsoon.",
            "icon": "load",
        },
    ]
}

_HJT_FEATURES = {
    "en": [
        {
            "title": "Advanced 210 HJT cell",
            "description": "Heterojunction technology with MBB interconnection delivers higher conversion efficiency.",
            "icon": "module",
        },
        {
            "title": "No light-induced degradation",
            "description": "N-type wafers show no LID, so first-year loss stays under 1%.",
            "icon": "reliability",
        },
        {
            "title": "0.30% annual degradation",
            "description": "One of the lowest linear decline rates in the industry, backed for 30 years.",
            "icon": "warranty",
        },
    ]
}

PRODUCTS: list[dict[str, Any]] = [
    {
        "slug": "rs4-480-500n-e1",
        "model_number": "RS4-480~500N-E1",
        "category": "rene-2-n-182",
        "name": {"en": "Mono-Facial Module", "ur": "مونو فیشل ماڈیول"},
        "product_type": "mono-facial",
        "cell_technology": "n-type",
        "power_min": 480, "power_max": 500, "max_efficiency": 22.30,
        "short_description": {
            "en": "182 mm N-type TOPCon module for rooftop and distributed systems.",
            "ur": "چھت اور تقسیم شدہ نظاموں کے لیے 182 ملی میٹر این ٹائپ ماڈیول۔",
        },
        "specs": _module_specs(500, 45.8, 38.4, 13.02, 22.30, "1946 x 1134 x 30", 23.5),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs4-490-510nbg-e1",
        "model_number": "RS4-490~510NBG-E1",
        "category": "rene-2-n-182",
        "name": {"en": "Bifacial Module with Dual Glass", "ur": "ڈبل گلاس بائی فیشل ماڈیول"},
        "product_type": "bifacial",
        "cell_technology": "n-type",
        "power_min": 490, "power_max": 510, "max_efficiency": 22.75,
        "short_description": {"en": "Dual-glass bifacial module with up to 80% bifaciality."},
        "specs": _module_specs(510, 46.1, 38.7, 13.18, 22.75, "1946 x 1134 x 30", 27.0),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs5-525-545n-e2",
        "model_number": "RS5-525~545N-E2",
        "category": "rene-2-n-182",
        "name": {"en": "Mono-Facial Module"},
        "product_type": "mono-facial",
        "cell_technology": "n-type",
        "power_min": 525, "power_max": 545, "max_efficiency": 22.60,
        "short_description": {"en": "Higher-power 182 mm module for commercial rooftops."},
        "specs": _module_specs(545, 49.7, 41.6, 13.10, 22.60, "2278 x 1134 x 30", 27.2),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs5-535-555nbg-e2",
        "model_number": "RS5-535~555NBG-E2",
        "category": "rene-2-n-182",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "n-type",
        "power_min": 535, "power_max": 555, "max_efficiency": 23.00,
        "short_description": {"en": "Bifacial dual glass, ideal for elevated or albedo-rich sites."},
        "specs": _module_specs(555, 50.1, 41.9, 13.25, 23.00, "2278 x 1134 x 30", 31.5),
        "features": _MONO_FEATURES,
        "featured": True,
    },
    {
        "slug": "rs6-575-600n-e3",
        "model_number": "RS6-575~600N-E3",
        "category": "rene-3-n-210",
        "name": {"en": "Mono-Facial Module"},
        "product_type": "mono-facial",
        "cell_technology": "n-type",
        "power_min": 575, "power_max": 600, "max_efficiency": 23.10,
        "short_description": {"en": "210 mm N-type module for large commercial installations."},
        "specs": _module_specs(600, 53.4, 44.8, 13.40, 23.10, "2382 x 1134 x 33", 32.0),
        "features": _MONO_FEATURES,
        "featured": True,
    },
    {
        "slug": "rs6-580-605nbg-e3",
        "model_number": "RS6-580~605NBG-E3",
        "category": "rene-3-n-210",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "n-type",
        "power_min": 580, "power_max": 605, "max_efficiency": 23.30,
        "short_description": {"en": "210 mm bifacial dual glass for ground-mount and carport."},
        "specs": _module_specs(605, 53.8, 45.1, 13.52, 23.30, "2382 x 1134 x 33", 35.8),
        "features": _MONO_FEATURES,
        "featured": True,
    },
    {
        "slug": "rs7-630-650n-e2",
        "model_number": "RS7-630~650N-E2",
        "category": "rene-3-n-210",
        "name": {"en": "Mono-Facial Module"},
        "product_type": "mono-facial",
        "cell_technology": "n-type",
        "power_min": 630, "power_max": 650, "max_efficiency": 23.20,
        "short_description": {"en": "High-power module engineered for utility-scale plants."},
        "specs": _module_specs(650, 57.9, 48.6, 13.42, 23.20, "2384 x 1303 x 33", 38.2),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs7-635-655nbg-e2",
        "model_number": "RS7-635~655NBG-E2",
        "category": "rene-3-n-210",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "n-type",
        "power_min": 635, "power_max": 655, "max_efficiency": 23.40,
        "short_description": {"en": "Bifacial utility module with 30-year linear power warranty."},
        "specs": _module_specs(655, 58.2, 48.9, 13.50, 23.40, "2384 x 1303 x 33", 42.0),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs41-430-450n-e3",
        "model_number": "RS41-430~450N-E3",
        "category": "rene-4-rectangular",
        "name": {"en": "Mono-Facial Module"},
        "product_type": "mono-facial",
        "cell_technology": "n-type",
        "power_min": 430, "power_max": 450, "max_efficiency": 22.50,
        "short_description": {"en": "Compact rectangular module sized for residential roofs."},
        "specs": _module_specs(450, 41.2, 34.6, 13.01, 22.50, "1762 x 1134 x 30", 21.0),
        "features": _MONO_FEATURES,
        "featured": True,
    },
    {
        "slug": "rs41-440-460nbg-e3",
        "model_number": "RS41-440~460NBG-E3",
        "category": "rene-4-rectangular",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "n-type",
        "power_min": 440, "power_max": 460, "max_efficiency": 22.90,
        "short_description": {"en": "Rectangular bifacial module for household and small commercial."},
        "specs": _module_specs(460, 41.5, 34.9, 13.18, 22.90, "1762 x 1134 x 30", 24.5),
        "features": _MONO_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs41j-520-545nbg-e1",
        "model_number": "RS41J-520~545NBG-E1",
        "category": "bc",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "bc",
        "power_min": 520, "power_max": 545, "max_efficiency": 24.51,
        "annual_degradation": "0.40% linear",
        "short_description": {
            "en": "Back-contact module — the highest efficiency in the range at 24.51%."
        },
        "specs": _module_specs(545, 48.9, 41.0, 13.29, 24.51, "2094 x 1134 x 30", 26.8),
        "features": _MONO_FEATURES,
        "featured": True,
    },
    {
        "slug": "rs8-660-675nbg-e1",
        "model_number": "RS8-660~675NBG-E1",
        "category": "rene-3-hjt-210",
        "name": {"en": "Bifacial Module with Dual Glass"},
        "product_type": "bifacial",
        "cell_technology": "hjt-type",
        "power_min": 660, "power_max": 675, "max_efficiency": 23.30,
        "annual_degradation": "0.30% linear",
        "short_description": {"en": "HJT bifacial module with very low temperature coefficient."},
        "specs": _module_specs(675, 58.8, 49.4, 13.66, 23.30, "2384 x 1303 x 33", 41.5),
        "features": _HJT_FEATURES,
        "featured": False,
    },
    {
        "slug": "rs9-710-730hbg-e1",
        "model_number": "RS9-710~730HBG-E1",
        "category": "rene-3-hjt-210",
        "name": {"en": "Bifacial Module with Dual Glass", "ur": "ڈبل گلاس بائی فیشل ماڈیول"},
        "product_type": "bifacial",
        "cell_technology": "hjt-type",
        "power_min": 710, "power_max": 730, "max_efficiency": 23.50,
        "annual_degradation": "0.30% linear",
        "short_description": {
            "en": "Flagship HJT module — 730 W peak, built for utility-scale ground plants.",
            "ur": "فلیگ شپ ایچ جے ٹی ماڈیول — 730 واٹ، بڑے پاور اسٹیشنز کے لیے۔",
        },
        "specs": _module_specs(730, 59.4, 49.9, 14.63, 23.50, "2384 x 1303 x 33", 42.8),
        "features": _HJT_FEATURES,
        "featured": True,
    },
    # ── Energy storage ──
    {
        "slug": "rsl-05k-wm",
        "model_number": "RSL-05K-WM",
        "category": "household-battery",
        "name": {"en": "Household LFP Battery 5.12 kWh", "ur": "گھریلو ایل ایف پی بیٹری"},
        "product_type": "battery",
        "short_description": {
            "en": "Wall-mounted 51.2 V / 100 Ah lithium iron phosphate battery for homes."
        },
        "specs": {
            "en": [
                {
                    "group_title": "Battery Data",
                    "rows": [
                        {"label": "Nominal Voltage", "value": "51.2", "unit": "V"},
                        {"label": "Capacity", "value": "100", "unit": "Ah"},
                        {"label": "Energy", "value": "5.12", "unit": "kWh"},
                        {"label": "Chemistry", "value": "LiFePO4 (LFP)", "unit": ""},
                        {"label": "Cycle Life", "value": "> 6000 @ 80% DoD", "unit": "cycles"},
                        {"label": "Depth of Discharge", "value": "95", "unit": "%"},
                    ],
                },
                {
                    "group_title": "Mechanical & Environment",
                    "rows": [
                        {"label": "Dimensions", "value": "700 x 500 x 180", "unit": "mm"},
                        {"label": "Weight", "value": "48", "unit": "kg"},
                        {"label": "Protection Rating", "value": "IP65", "unit": ""},
                        {"label": "Operating Temperature", "value": "-10 to +55", "unit": "°C"},
                        {"label": "Communication", "value": "CAN / RS485", "unit": ""},
                    ],
                },
            ]
        },
        "features": {
            "en": [
                {"title": "6000+ cycles", "description": "LFP chemistry rated beyond 6000 cycles at 80% depth of discharge.", "icon": "reliability"},
                {"title": "Wall mounted", "description": "IP65 enclosure suits an indoor utility room or a shaded outdoor wall.", "icon": "module"},
                {"title": "Stackable", "description": "Parallel up to 15 units for 76.8 kWh of usable storage.", "icon": "power"},
            ]
        },
        "featured": True,
    },
    {
        "slug": "rsess261-125k",
        "model_number": "RSESS261-125K",
        "category": "commercial-industrial-storage",
        "name": {"en": "Liquid-Cooled C&I Storage Cabinet"},
        "product_type": "storage-cabinet",
        "short_description": {
            "en": "241 kWh / 125 kW liquid-cooled cabinet for factories and commercial sites."
        },
        "specs": {
            "en": [
                {
                    "group_title": "System Data",
                    "rows": [
                        {"label": "Energy Capacity", "value": "241", "unit": "kWh"},
                        {"label": "Rated Power", "value": "125", "unit": "kW"},
                        {"label": "Cooling", "value": "Liquid cooling", "unit": ""},
                        {"label": "Grid Connection", "value": "Three phase 400 V", "unit": ""},
                        {"label": "Round-trip Efficiency", "value": "> 90", "unit": "%"},
                        {"label": "Protection Rating", "value": "IP54", "unit": ""},
                    ],
                }
            ]
        },
        "features": {
            "en": [
                {"title": "Liquid cooling", "description": "Even cell temperatures extend life in Pakistan's summer heat.", "icon": "reliability"},
                {"title": "Peak shaving", "description": "Cuts demand charges by discharging during peak tariff hours.", "icon": "power"},
                {"title": "Integrated fire safety", "description": "Aerosol suppression with multi-level battery monitoring.", "icon": "load"},
            ]
        },
        "featured": True,
    },
    {
        "slug": "rs-hyb-10k-3p",
        "model_number": "RS-HYB-10K-3P",
        "category": "inverter",
        "name": {"en": "Three-Phase Hybrid Inverter 10 kW", "ur": "تھری فیز ہائبرڈ انورٹر"},
        "product_type": "inverter",
        "short_description": {
            "en": "Three-phase hybrid inverter with battery and net-metering support."
        },
        "specs": {
            "en": [
                {
                    "group_title": "Inverter Data",
                    "rows": [
                        {"label": "Rated AC Output", "value": "10", "unit": "kW"},
                        {"label": "Max PV Input", "value": "15", "unit": "kW"},
                        {"label": "MPPT Trackers", "value": "2", "unit": ""},
                        {"label": "Max Efficiency", "value": "98.2", "unit": "%"},
                        {"label": "Battery Voltage Range", "value": "40 - 60", "unit": "V"},
                        {"label": "Protection Rating", "value": "IP65", "unit": ""},
                    ],
                }
            ]
        },
        "features": {
            "en": [
                {"title": "Net metering ready", "description": "Export control and anti-islanding compliant with DISCO requirements.", "icon": "power"},
                {"title": "Seamless backup", "description": "Under 10 ms transfer keeps sensitive equipment running through an outage.", "icon": "reliability"},
                {"title": "Dual MPPT", "description": "Two independent trackers handle roofs with different orientations.", "icon": "module"},
            ]
        },
        "featured": False,
    },
]

# ─────────────────────────────── Scenarios ───────────────────────────────

SCENARIOS: list[dict[str, Any]] = [
    {
        "slug": "distributed-system",
        "name": {"en": "Distributed System", "ur": "تقسیم شدہ نظام"},
        "intro": {"en": "Rooftop generation that offsets the bill where the power is consumed."},
        "sort_order": 1,
        "children": [
            {
                "slug": "industry-and-commerce",
                "name": {"en": "Industry and Commerce", "ur": "صنعت و تجارت"},
                "intro": {
                    "en": "Factories, warehouses, and commercial buildings cutting peak tariff exposure."
                },
                "body": {
                    "en": (
                        "<p>Industrial electricity in Pakistan is billed on both consumption and "
                        "peak demand, so an unmanaged load profile is expensive twice over. A rooftop "
                        "PV array sized to the daytime baseline removes the most expensive units first, "
                        "and pairing it with storage shifts the remaining peak out of the high tariff "
                        "window.</p>"
                        "<p>A typical 500 kW textile or food-processing rooftop generates roughly "
                        "750,000 units a year in Punjab and Sindh irradiation, displacing grid supply "
                        "during exactly the hours the plant runs.</p>"
                    )
                },
                "benefits": {
                    "en": [
                        {"title": "Lower peak demand charges", "description": "Generation coincides with the working day, trimming both energy and demand components."},
                        {"title": "Net metering credit", "description": "Surplus units export to the grid under NEPRA net metering regulations."},
                        {"title": "Predictable cost", "description": "A 25-year asset fixes a portion of your tariff against future increases."},
                        {"title": "Roof space, already paid for", "description": "No land acquisition — the factory roof is the site."},
                    ]
                },
                "sort_order": 1,
            },
            {
                "slug": "household",
                "name": {"en": "Household", "ur": "گھریلو"},
                "intro": {"en": "Home systems that cover the day and ride through load shedding at night."},
                "body": {
                    "en": (
                        "<p>A household system in Pakistan does two jobs: it reduces the monthly bill "
                        "and it keeps fans, lights, and the fridge running when the grid drops. Sizing "
                        "starts from your protected load, not your total load — the circuits you want "
                        "alive during an outage.</p>"
                        "<p>A 5 kW array with a 5.12 kWh LFP battery typically covers a three-bedroom "
                        "home's daytime consumption and carries essential circuits through an evening "
                        "outage.</p>"
                    )
                },
                "benefits": {
                    "en": [
                        {"title": "Backup through load shedding", "description": "Battery carries essential circuits without a generator."},
                        {"title": "Bill reduction from day one", "description": "Daytime consumption is served by the roof, not the meter."},
                        {"title": "No fuel, no noise", "description": "Silent operation with none of the running cost of a diesel generator."},
                        {"title": "Rooftop-sized modules", "description": "Rectangular 430–460 W modules fit constrained residential roofs."},
                    ]
                },
                "sort_order": 2,
            },
        ],
    },
    {
        "slug": "ground-power-plants",
        "name": {"en": "Ground Power Plants", "ur": "گراؤنڈ پاور پلانٹس"},
        "intro": {"en": "Utility-scale generation for IPPs and captive industrial supply."},
        "sort_order": 2,
        "children": [
            {
                "slug": "large-surface-power-station",
                "name": {"en": "Large Surface Power Station"},
                "intro": {"en": "Multi-megawatt ground-mount plants on tracker or fixed-tilt structures."},
                "body": {
                    "en": (
                        "<p>Utility plants live or die on levelised cost. Higher-wattage bifacial "
                        "modules reduce the number of strings, trackers, and labour hours per megawatt, "
                        "and the rear-side gain on high-albedo desert ground adds real yield.</p>"
                        "<p>Cholistan and Tharparkar sites see some of the strongest irradiation in "
                        "South Asia, which is why the 700 W class module class matters here.</p>"
                    )
                },
                "benefits": {
                    "en": [
                        {"title": "Fewer components per MW", "description": "730 W modules cut string count, cabling, and installation labour."},
                        {"title": "Bifacial yield gain", "description": "Rear-side generation adds output over reflective desert ground."},
                        {"title": "Bankable warranty", "description": "30-year linear power warranty supports project financing."},
                        {"title": "Tier 1 status", "description": "BNEF Tier 1 listing is a financing prerequisite for most lenders."},
                    ]
                },
                "sort_order": 1,
            }
        ],
    },
]

# ─────────────────────────────── Case studies ───────────────────────────────

CASES: list[dict[str, Any]] = [
    {"slug": "cholistan-utility-plant", "project_name": {"en": "Cholistan Solar Park"}, "city": {"en": "Bahawalpur"}, "country": {"en": "Pakistan"}, "capacity_value": 12, "capacity_unit": "MW", "system_type": "utility", "year": 2025},
    {"slug": "faisalabad-textile-rooftop", "project_name": {"en": "Textile Mill Rooftop"}, "city": {"en": "Faisalabad"}, "country": {"en": "Pakistan"}, "capacity_value": 2.4, "capacity_unit": "MW", "system_type": "commercial", "year": 2025},
    {"slug": "karachi-industrial-park", "project_name": {"en": "Industrial Park Distributed System"}, "city": {"en": "Karachi"}, "country": {"en": "Pakistan"}, "capacity_value": 5, "capacity_unit": "MW", "system_type": "commercial", "year": 2024},
    {"slug": "lahore-commercial-rooftop", "project_name": {"en": "Commercial Plaza Rooftop"}, "city": {"en": "Lahore"}, "country": {"en": "Pakistan"}, "capacity_value": 800, "capacity_unit": "kW", "system_type": "commercial", "year": 2025},
    {"slug": "multan-cold-storage", "project_name": {"en": "Cold Storage Facility"}, "city": {"en": "Multan"}, "country": {"en": "Pakistan"}, "capacity_value": 1.2, "capacity_unit": "MW", "system_type": "commercial", "year": 2024},
    {"slug": "islamabad-residential-cluster", "project_name": {"en": "Residential Cluster"}, "city": {"en": "Islamabad"}, "country": {"en": "Pakistan"}, "capacity_value": 320, "capacity_unit": "kW", "system_type": "residential", "year": 2025},
    {"slug": "sukkur-agri-pumping", "project_name": {"en": "Agricultural Pumping Scheme"}, "city": {"en": "Sukkur"}, "country": {"en": "Pakistan"}, "capacity_value": 640, "capacity_unit": "kW", "system_type": "commercial", "year": 2024},
    {"slug": "hyderabad-warehouse", "project_name": {"en": "Distribution Warehouse"}, "city": {"en": "Hyderabad"}, "country": {"en": "Pakistan"}, "capacity_value": 950, "capacity_unit": "kW", "system_type": "commercial", "year": 2025},
    {"slug": "peshawar-hospital", "project_name": {"en": "Hospital Hybrid System"}, "city": {"en": "Peshawar"}, "country": {"en": "Pakistan"}, "capacity_value": 450, "capacity_unit": "kW", "system_type": "commercial", "year": 2024},
    {"slug": "quetta-telecom-sites", "project_name": {"en": "Telecom Tower Network"}, "city": {"en": "Quetta"}, "country": {"en": "Pakistan"}, "capacity_value": 180, "capacity_unit": "kW", "system_type": "commercial", "year": 2023},
    {"slug": "sialkot-sports-factory", "project_name": {"en": "Sports Goods Factory"}, "city": {"en": "Sialkot"}, "country": {"en": "Pakistan"}, "capacity_value": 1.6, "capacity_unit": "MW", "system_type": "commercial", "year": 2025},
    {"slug": "gwadar-desalination", "project_name": {"en": "Desalination Plant Supply"}, "city": {"en": "Gwadar"}, "country": {"en": "Pakistan"}, "capacity_value": 3, "capacity_unit": "MW", "system_type": "utility", "year": 2025},
]

# ─────────────────────────────── Blog posts ───────────────────────────────

POSTS: list[dict[str, Any]] = [
    {
        "slug": "net-metering-pakistan-2026-guide",
        "category": "industry-news",
        "published_at": "2026-07-28",
        "tags": ["net-metering", "pakistan", "nepra", "regulation"],
        "title": {"en": "Net Metering in Pakistan: What Changed and What It Means for Your Payback"},
        "excerpt": {
            "en": "NEPRA's net metering framework decides how much a solar system is worth. Here is how the rules work today and how to size a system around them."
        },
        "body": {
            "en": (
                "<p>Net metering is the single biggest factor in a Pakistani solar system's payback "
                "period. It determines what happens to the units you generate but do not consume, and "
                "getting the sizing wrong against the rules can add years to a project's return.</p>"
                "<h2>How the mechanism works</h2>"
                "<p>Under the NEPRA net metering regulations, a licensed distribution company installs "
                "a bi-directional meter. Units you export are credited against units you import. At "
                "the end of the billing period you settle the net position, not the gross.</p>"
                "<h2>Why oversizing hurts</h2>"
                "<p>Because credit is applied against consumption rather than paid at the full retail "
                "tariff, a system that exports far more than the site ever imports accumulates credit "
                "it cannot use efficiently. The practical rule is to size the array against your "
                "daytime baseline load, then add storage rather than more panels if you need evening "
                "cover.</p>"
                "<h2>Documentation you will need</h2>"
                "<ul>"
                "<li>Electricity bill and reference number for the connection</li>"
                "<li>CNIC of the connection holder</li>"
                "<li>Single-line diagram and equipment datasheets</li>"
                "<li>Inverter certification showing anti-islanding compliance</li>"
                "</ul>"
                "<p>That last point is where projects most often stall. Distribution companies check "
                "that the inverter carries valid certification and supports export control. Confirm "
                "this before ordering, not after.</p>"
                "<h2>What to ask your installer</h2>"
                "<p>Ask for the expected annual generation in units, not just the system size in kW, "
                "and ask which months the model expects to export. Those two numbers tell you far more "
                "about payback than the headline capacity does.</p>"
            )
        },
    },
    {
        "slug": "n-type-topcon-vs-hjt-vs-back-contact",
        "category": "industry-news",
        "published_at": "2026-07-15",
        "tags": ["technology", "topcon", "hjt", "back-contact", "efficiency"],
        "title": {"en": "N-Type TOPCon vs HJT vs Back Contact: Which Cell Technology Should You Specify?"},
        "excerpt": {
            "en": "Three N-type technologies now compete for the same rooftop. They differ in efficiency, temperature behaviour, and cost per watt — here is how to choose."
        },
        "body": {
            "en": (
                "<p>P-type PERC has largely given way to N-type across the industry. What replaced it "
                "is not one technology but three, and they behave differently enough that the choice "
                "matters.</p>"
                "<h2>N-Type TOPCon</h2>"
                "<p>The volume workhorse. Module efficiency in the 22.5–23.4% range, low "
                "light-induced degradation, and the lowest cost per watt of the three. For most "
                "commercial rooftops this is the default, and the RS6 and RS7 series sit here.</p>"
                "<h2>Heterojunction (HJT)</h2>"
                "<p>Higher efficiency and a noticeably better temperature coefficient — around "
                "-0.30%/°C against -0.35%/°C for TOPCon. In Pakistan that difference is not academic. "
                "Module temperatures routinely pass 65°C in June, and at that point HJT is delivering "
                "several percent more power than a comparable TOPCon module. The RS8 and RS9 series "
                "use HJT cells.</p>"
                "<h2>Back Contact (BC)</h2>"
                "<p>All the electrical contacts move to the rear, so no busbars shade the front. That "
                "buys the highest efficiency of the three — 24.51% on the RS41J — and a cleaner "
                "appearance that matters on visible residential roofs. It costs more per watt.</p>"
                "<h2>Choosing</h2>"
                "<ul>"
                "<li><strong>Constrained roof, efficiency matters most:</strong> back contact</li>"
                "<li><strong>Hot site, high summer load:</strong> HJT</li>"
                "<li><strong>Large area, lowest cost per watt:</strong> N-type TOPCon</li>"
                "</ul>"
                "<p>Whatever you specify, compare the temperature coefficient and the annual "
                "degradation rate alongside the efficiency figure. Nameplate efficiency is measured at "
                "25°C, which is not a condition that occurs on a Pakistani roof at midday.</p>"
            )
        },
    },
    {
        "slug": "sizing-solar-for-load-shedding",
        "category": "industry-news",
        "published_at": "2026-06-20",
        "tags": ["storage", "battery", "load-shedding", "residential"],
        "title": {"en": "Sizing Solar and Storage Around Load Shedding, Not Around Your Bill"},
        "excerpt": {
            "en": "Most home systems are sized from the electricity bill. If backup matters to you, that is the wrong starting number."
        },
        "body": {
            "en": (
                "<p>There are two different design problems hiding inside one request. Reducing your "
                "bill is an energy problem. Riding through an outage is a power problem. They produce "
                "different system designs.</p>"
                "<h2>Start from protected load</h2>"
                "<p>List the circuits that must stay alive during an outage — fans, lights, "
                "refrigerator, internet, maybe one air conditioner. Add up their simultaneous draw. "
                "That figure, not your monthly units, sets the inverter and battery power rating.</p>"
                "<h2>Then size the battery for duration</h2>"
                "<p>Multiply your protected load by the longest outage you want to cover. A 1.5 kW "
                "protected load across a four-hour evening outage needs about 6 kWh of usable energy. "
                "At 95% depth of discharge, a 5.12 kWh LFP unit covers most of that; two units cover "
                "it comfortably with margin for a cloudy day.</p>"
                "<h2>Finally size the array</h2>"
                "<p>The array has to serve the daytime load and recharge the battery before evening. "
                "In practice that means roughly 1.5 to 2 times the battery's daily throughput in kW of "
                "panel, adjusted for your roof's orientation.</p>"
                "<h2>Why LFP</h2>"
                "<p>Lithium iron phosphate tolerates heat better than other lithium chemistries and "
                "does not degrade nearly as fast when held at high state of charge. In a Karachi or "
                "Multan summer that is the difference between a battery that lasts a decade and one "
                "that does not.</p>"
            )
        },
    },
    {
        "slug": "bifacial-gain-in-pakistan-conditions",
        "category": "industry-news",
        "published_at": "2026-05-30",
        "tags": ["bifacial", "yield", "utility", "design"],
        "title": {"en": "How Much Extra Yield Do Bifacial Modules Actually Deliver in Pakistan?"},
        "excerpt": {
            "en": "Bifacial gain is real but highly site-dependent. Ground reflectivity and mounting height decide whether you get 3% or 15%."
        },
        "body": {
            "en": (
                "<p>A bifacial module generates from both faces. How much the rear face contributes "
                "depends almost entirely on what is underneath it.</p>"
                "<h2>Albedo is the variable that matters</h2>"
                "<p>Albedo is the fraction of light the ground reflects. Dark asphalt sits around 0.10 "
                "and returns very little. Dry desert sand in Cholistan or Tharparkar can reach 0.35 or "
                "higher. Light gravel or a white membrane roof lands in between.</p>"
                "<h2>Mounting height and row spacing</h2>"
                "<p>A module flat against a rooftop gets almost nothing from its rear face. Raise it "
                "and widen the row spacing and the rear irradiance climbs quickly. On a ground-mount "
                "structure at one metre clearance with generous pitch, 8–12% gain is realistic on "
                "reflective ground.</p>"
                "<h2>Practical expectations</h2>"
                "<ul>"
                "<li><strong>Flush rooftop, dark surface:</strong> 2–4%</li>"
                "<li><strong>Elevated rooftop, light surface:</strong> 5–8%</li>"
                "<li><strong>Ground mount, desert albedo:</strong> 8–15%</li>"
                "</ul>"
                "<p>Model it for your specific site rather than accepting a datasheet headline. The "
                "rear-side figure quoted on any manufacturer's specification sheet, ours included, is "
                "measured under a defined albedo that your site may not match.</p>"
            )
        },
    },
    {
        "slug": "renesola-tier-1-q2-2026",
        "category": "company-news",
        "published_at": "2026-07-08",
        "tags": ["tier-1", "bloomberg-nef", "bankability"],
        "title": {"en": "ReneSola Retains BNEF Tier 1 Status for the 14th Consecutive Year"},
        "excerpt": {
            "en": "BloombergNEF's Tier 1 list is a financing prerequisite for most lenders. Here is what the classification actually measures."
        },
        "body": {
            "en": (
                "<p>ReneSola has again been listed as a BloombergNEF Tier 1 photovoltaic module "
                "manufacturer, extending an unbroken run to fourteen years.</p>"
                "<h2>What Tier 1 measures</h2>"
                "<p>The classification is often misread as a quality rating. It is not. BNEF assesses "
                "<em>bankability</em>: whether a manufacturer's modules have been supplied to at least "
                "six different projects financed non-recourse by six different banks in the preceding "
                "two years.</p>"
                "<h2>Why it matters to a project</h2>"
                "<p>Most project lenders will not finance a plant built with non-Tier 1 modules, and "
                "many public tenders make the listing a qualification requirement. For a developer, "
                "specifying a Tier 1 manufacturer is frequently the difference between a financeable "
                "project and one that stalls.</p>"
                "<p>Cumulative shipments now exceed 30 GW across more than 80% of global markets.</p>"
            )
        },
        "featured": True,
    },
    {
        "slug": "renesola-pakistan-market-entry",
        "category": "company-news",
        "published_at": "2026-06-12",
        "tags": ["pakistan", "distribution", "expansion"],
        "title": {"en": "ReneSola Expands Distribution and Technical Support Across Pakistan"},
        "excerpt": {
            "en": "Local stock, local technical support, and faster warranty turnaround for installers and EPC partners across Pakistan."
        },
        "body": {
            "en": (
                "<p>ReneSola is expanding its distribution footprint in Pakistan, with warehoused "
                "stock and in-country technical support for installers and EPC partners.</p>"
                "<h2>What changes for partners</h2>"
                "<ul>"
                "<li>Shorter lead times on the RS6, RS7, and RS41 series</li>"
                "<li>Local technical support for system design and net metering documentation</li>"
                "<li>Faster warranty claim handling through the after-sales portal</li>"
                "<li>Training for installation teams on handling and mounting practice</li>"
                "</ul>"
                "<h2>Documentation</h2>"
                "<p>Region-specific datasheets, warranty terms, and installation manuals are available "
                "in the download centre. Partners submitting a warranty claim should use the "
                "after-sales service form, which routes directly to the technical team.</p>"
            )
        },
    },
    {
        "slug": "solar-pakistan-2026-exhibition",
        "category": "exhibitions",
        "published_at": "2026-04-18",
        "tags": ["exhibition", "solar-pakistan", "lahore"],
        "title": {"en": "Meet Us at Solar Pakistan 2026, Lahore"},
        "excerpt": {
            "en": "The full module range and the C&I storage cabinet will be on display, with technical staff available for system design discussions."
        },
        "body": {
            "en": (
                "<p>ReneSola will exhibit at Solar Pakistan 2026 in Lahore. The stand will show the "
                "current module range alongside the liquid-cooled commercial storage cabinet.</p>"
                "<h2>On display</h2>"
                "<ul>"
                "<li>RS9 HJT bifacial module — 730 W</li>"
                "<li>RS41J back-contact module — 24.51% efficiency</li>"
                "<li>RSESS261-125K liquid-cooled storage cabinet</li>"
                "<li>Household LFP battery and three-phase hybrid inverter</li>"
                "</ul>"
                "<p>Technical staff will be available throughout for system design and net metering "
                "questions. Bring a bill and a roof plan if you want a sizing discussion.</p>"
            )
        },
    },
    {
        "slug": "module-handling-installation-mistakes",
        "category": "industry-news",
        "published_at": "2026-03-22",
        "tags": ["installation", "quality", "warranty", "best-practice"],
        "title": {"en": "Five Installation Mistakes That Void a Module Warranty"},
        "excerpt": {
            "en": "Most warranty claims we reject are traced to handling and mounting, not manufacturing. These are the five we see most often."
        },
        "body": {
            "en": (
                "<p>A 30-year power warranty assumes the module was installed the way the manual "
                "specifies. Here are the five deviations behind most rejected claims.</p>"
                "<h2>1. Standing or kneeling on modules</h2>"
                "<p>Glass tolerates distributed load, not point load. Body weight on a small area "
                "creates micro-cracks that are invisible at handover and show up as hot spots two "
                "years later in electroluminescence imaging.</p>"
                "<h2>2. Clamping outside the specified zone</h2>"
                "<p>The manual marks where clamps may sit. Clamping outside that zone concentrates "
                "stress into the frame and transfers it into the laminate. This is the single most "
                "common cause of frame deformation claims.</p>"
                "<h2>3. Carrying modules by the junction box or cables</h2>"
                "<p>Neither is a structural element. Lifting by cable damages the sealing at the "
                "junction box and lets moisture in — often a full season before the fault appears.</p>"
                "<h2>4. Mismatched or dirty connectors</h2>"
                "<p>Mixing connector brands, even 'MC4 compatible' ones, produces contact resistance "
                "and heating. Contamination inside the connector does the same. Connector burn-out is "
                "an installation fault, not a module fault.</p>"
                "<h2>5. Insufficient clearance behind the array</h2>"
                "<p>Modules mounted flush against a roof surface run hotter, which reduces output "
                "immediately and accelerates degradation permanently. Respect the ventilation gap in "
                "the manual.</p>"
                "<p>All installation manuals are in the download centre. If you are unsure about a "
                "mounting arrangement, ask before you build it.</p>"
            )
        },
    },
]

# ─────────────────────── Certifications, offices, milestones ───────────────────────

CERTIFICATIONS: list[dict[str, Any]] = [
    {"name": "IEC 61215", "issuing_body": "TÜV", "description": {"en": "Design qualification and type approval for terrestrial PV modules."}, "sort_order": 1},
    {"name": "IEC 61730", "issuing_body": "TÜV", "description": {"en": "Photovoltaic module safety qualification."}, "sort_order": 2},
    {"name": "ISO 9001:2015", "issuing_body": "TÜV", "description": {"en": "Quality management system."}, "sort_order": 3},
    {"name": "ISO 14001:2015", "issuing_body": "TÜV", "description": {"en": "Environmental management system."}, "sort_order": 4},
    {"name": "ISO 45001:2018", "issuing_body": "TÜV", "description": {"en": "Occupational health and safety management."}, "sort_order": 5},
    {"name": "UL 61730", "issuing_body": "UL", "description": {"en": "North American PV module safety standard."}, "sort_order": 6},
]

OFFICES: list[dict[str, Any]] = [
    {
        "region_name": {"en": "Pakistan — Head Office", "ur": "پاکستان — مرکزی دفتر"},
        "address": {"en": "Gulberg III, Lahore, Punjab, Pakistan", "ur": "گلبرگ III، لاہور، پنجاب، پاکستان"},
        "phone": "+92 42 1234 5678",
        "email": "sales@renesola.pk",
        "latitude": 31.5204, "longitude": 74.3587,
        "is_headquarters": True, "sort_order": 1,
    },
    {
        "region_name": {"en": "Karachi Regional Office"},
        "address": {"en": "Shahrah-e-Faisal, Karachi, Sindh, Pakistan"},
        "phone": "+92 21 1234 5678",
        "email": "karachi@renesola.pk",
        "latitude": 24.8607, "longitude": 67.0011,
        "sort_order": 2,
    },
    {
        "region_name": {"en": "Islamabad Regional Office"},
        "address": {"en": "Blue Area, Islamabad, Pakistan"},
        "phone": "+92 51 1234 5678",
        "email": "islamabad@renesola.pk",
        "latitude": 33.6844, "longitude": 73.0479,
        "sort_order": 3,
    },
]

MILESTONES: list[dict[str, Any]] = [
    {"year": 2026, "title": {"en": "Pakistan distribution network expanded"}, "description": {"en": "Local stock, technical support, and installer training rolled out nationwide."}},
    {"year": 2025, "title": {"en": "Strategy upgrade and deep market expansion"}, "description": {"en": "Focus shifted to integrated PV plus storage solutions across emerging markets."}},
    {"year": 2024, "title": {"en": "New production bases operational"}, "description": {"en": "Yancheng, Kunming, and Anyang added 16.5 GW module and 5 GW cell capacity."}},
    {"year": 2023, "title": {"en": "N-TOPCon and HJT series recognised globally"}, "description": {"en": "Next-generation module series achieved international market acceptance."}},
    {"year": 2022, "title": {"en": "Global expansion"}, "description": {"en": "New offices across the Americas and Europe; 10 GW of combined capacity under construction."}},
    {"year": 2005, "title": {"en": "ReneSola founded"}, "description": {"en": "Established as a photovoltaic manufacturer and project developer."}},
]

DOWNLOADS: list[dict[str, Any]] = [
    {"title": {"en": "RS9-710~730HBG-E1 Datasheet"}, "category": "datasheet", "product": "rs9-710-730hbg-e1", "sort_order": 1},
    {"title": {"en": "RS6-575~600N-E3 Datasheet"}, "category": "datasheet", "product": "rs6-575-600n-e3", "sort_order": 2},
    {"title": {"en": "RS41J-520~545NBG-E1 Datasheet"}, "category": "datasheet", "product": "rs41j-520-545nbg-e1", "sort_order": 3},
    {"title": {"en": "Household LFP Battery Datasheet"}, "category": "datasheet", "product": "rsl-05k-wm", "sort_order": 4},
    {"title": {"en": "Module Installation Manual"}, "category": "installation", "sort_order": 5},
    {"title": {"en": "Energy Storage Installation Guide"}, "category": "installation", "sort_order": 6},
    {"title": {"en": "Limited Warranty Terms — 30 Year Linear Power"}, "category": "warranty", "sort_order": 7},
    {"title": {"en": "IEC 61215 / 61730 Certificate"}, "category": "certificate", "sort_order": 8},
    {"title": {"en": "ISO 9001:2015 Certificate"}, "category": "certificate", "sort_order": 9},
    {"title": {"en": "Company Profile"}, "category": "company", "sort_order": 10},
    {"title": {"en": "Warranty Terms — For Pakistan"}, "category": "regional", "region": "For Pakistan", "sort_order": 11},
    {"title": {"en": "Commercial Storage Cabinet Brochure"}, "category": "stored-energy", "product": "rsess261-125k", "sort_order": 12},
]
