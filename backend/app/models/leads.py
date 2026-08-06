"""Everything a visitor submits: product inquiries, contact messages, and after-sales fault reports."""

import enum
import uuid
from typing import Any

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import Translatable


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    WON = "won"
    LOST = "lost"


class LeadSource(str, enum.Enum):
    PRODUCT_PAGE = "product-page"
    CONTACT_PAGE = "contact-page"
    CHATBOT = "chatbot"
    QUOTE_CALCULATOR = "quote-calculator"


class Inquiry(Base):
    """A sales lead. This table is the whole point of the website."""

    __tablename__ = "inquiries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True
    )
    product = relationship("Product", foreign_keys=[product_id])

    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, native_enum=False, length=32),
        default=LeadSource.PRODUCT_PAGE,
        nullable=False,
        index=True,
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, native_enum=False, length=20),
        default=LeadStatus.NEW,
        nullable=False,
        index=True,
    )

    # Where they came from and what they were reading — useful for the sales call.
    page_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    locale: Mapped[str | None] = mapped_column(String(10), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(60), nullable=True)

    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<Inquiry {self.email} [{self.status.value}]>"


class ServiceRequestStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ServiceRequest(Base):
    """After-sales fault report — mirrors the Service page form."""

    __tablename__ = "service_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Project information
    project_address: Mapped[str] = mapped_column(Text, nullable=False)
    project_size: Mapped[str | None] = mapped_column(String(120), nullable=True)
    fault_description: Mapped[str] = mapped_column(Text, nullable=False)

    # Demand information — uploaded photos of the fault (JPG, max 5 MB each)
    photos: Mapped[list[dict[str, Any]] | None] = mapped_column(
        Translatable, nullable=True, default=list
    )

    # Contact information
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(60), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    status: Mapped[ServiceRequestStatus] = mapped_column(
        Enum(ServiceRequestStatus, native_enum=False, length=20),
        default=ServiceRequestStatus.OPEN,
        nullable=False,
        index=True,
    )
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<ServiceRequest {self.contact_email} [{self.status.value}]>"
