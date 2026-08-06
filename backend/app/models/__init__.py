"""Import every model here so Alembic autogenerate and SQLAlchemy mappers see them all."""

from app.models.associations import (
    case_products,
    product_certifications,
    product_related,
    product_scenarios,
    scenario_cases,
    scenario_products,
)
from app.models.catalog import Category, CellTechnology, Product, ProductType
from app.models.content import (
    CaseStudy,
    Certification,
    Download,
    DownloadCategory,
    Milestone,
    Office,
    Post,
    PostCategory,
    Scenario,
    SystemType,
)
from app.models.leads import (
    Inquiry,
    LeadSource,
    LeadStatus,
    ServiceRequest,
    ServiceRequestStatus,
)
from app.models.media import Media
from app.models.search import SearchDocument, SourceType
from app.models.user import User, UserRole

__all__ = [
    "CaseStudy",
    "Category",
    "CellTechnology",
    "Certification",
    "Download",
    "DownloadCategory",
    "Inquiry",
    "LeadSource",
    "LeadStatus",
    "Media",
    "Milestone",
    "Office",
    "Post",
    "PostCategory",
    "Product",
    "ProductType",
    "Scenario",
    "SearchDocument",
    "ServiceRequest",
    "ServiceRequestStatus",
    "SourceType",
    "SystemType",
    "User",
    "UserRole",
    "case_products",
    "product_certifications",
    "product_related",
    "product_scenarios",
    "scenario_cases",
    "scenario_products",
]
