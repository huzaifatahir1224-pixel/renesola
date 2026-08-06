"""Many-to-many join tables."""

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


def _ref(name: str, target: str) -> Column:
    return Column(
        name, UUID(as_uuid=True), ForeignKey(target, ondelete="CASCADE"), primary_key=True
    )


product_certifications = Table(
    "product_certifications",
    Base.metadata,
    _ref("product_id", "products.id"),
    _ref("certification_id", "certifications.id"),
)

product_scenarios = Table(
    "product_scenarios",
    Base.metadata,
    _ref("product_id", "products.id"),
    _ref("scenario_id", "scenarios.id"),
)

# Self-referential: "you may also be interested in…"
product_related = Table(
    "product_related",
    Base.metadata,
    _ref("product_id", "products.id"),
    _ref("related_id", "products.id"),
)

case_products = Table(
    "case_products",
    Base.metadata,
    _ref("case_id", "case_studies.id"),
    _ref("product_id", "products.id"),
)

scenario_products = Table(
    "scenario_products",
    Base.metadata,
    _ref("scenario_id", "scenarios.id"),
    _ref("product_id", "products.id"),
)

scenario_cases = Table(
    "scenario_cases",
    Base.metadata,
    _ref("scenario_id", "scenarios.id"),
    _ref("case_id", "case_studies.id"),
)
