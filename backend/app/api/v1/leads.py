"""Inquiries and after-sales service requests.

Submission is public; reading and managing them requires the sales or admin role.
"""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select

from app.api.deps import DbSession, PaginationDep, require_sales
from app.models.leads import (
    Inquiry,
    LeadSource,
    LeadStatus,
    ServiceRequest,
    ServiceRequestStatus,
)
from app.schemas.common import MessageResponse
from app.services.notifications import notify_inquiry, notify_service_request

router = APIRouter(tags=["leads"])


# ────────────────────────────── Inquiries ──────────────────────────────


class InquiryCreate(BaseModel):
    contact_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    company_name: str | None = None
    phone: str | None = None
    country: str | None = None
    message: str | None = None
    product_id: UUID | None = None
    source: LeadSource = LeadSource.PRODUCT_PAGE
    page_url: str | None = None
    locale: str | None = None


def _inquiry_out(lead: Inquiry) -> dict[str, Any]:
    return {
        "id": str(lead.id),
        "contact_name": lead.contact_name,
        "company_name": lead.company_name,
        "email": lead.email,
        "phone": lead.phone,
        "country": lead.country,
        "message": lead.message,
        "product_id": str(lead.product_id) if lead.product_id else None,
        "source": lead.source.value,
        "status": lead.status.value,
        "page_url": lead.page_url,
        "locale": lead.locale,
        "internal_notes": lead.internal_notes,
        "created_at": lead.created_at.isoformat(),
    }


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
def create_inquiry(
    db: DbSession,
    request: Request,
    background: BackgroundTasks,
    payload: InquiryCreate,
) -> MessageResponse:
    """Public — the "Inquire Now" form on every product page."""
    lead = Inquiry(
        **payload.model_dump(),
        referrer=request.headers.get("referer"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Email the sales team without making the visitor wait for SMTP.
    background.add_task(notify_inquiry, lead.id)
    return MessageResponse(message="Thank you — our team will contact you shortly.")


@router.get("/inquiries", dependencies=[Depends(require_sales)])
def list_inquiries(
    db: DbSession,
    page: PaginationDep,
    lead_status: Annotated[LeadStatus | None, Query(alias="status")] = None,
    source: LeadSource | None = None,
) -> dict[str, Any]:
    stmt = select(Inquiry)
    if lead_status:
        stmt = stmt.where(Inquiry.status == lead_status)
    if source:
        stmt = stmt.where(Inquiry.source == source)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Inquiry.created_at.desc()).offset(page.offset).limit(page.limit)
    ).all()
    return {
        "items": [_inquiry_out(r) for r in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


class InquiryUpdate(BaseModel):
    status: LeadStatus | None = None
    internal_notes: str | None = None


@router.patch("/inquiries/{inquiry_id}", dependencies=[Depends(require_sales)])
def update_inquiry(db: DbSession, inquiry_id: UUID, payload: InquiryUpdate) -> dict[str, Any]:
    lead = db.get(Inquiry, inquiry_id)
    if lead is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inquiry not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return _inquiry_out(lead)


@router.get("/inquiries/export.csv", dependencies=[Depends(require_sales)])
def export_inquiries(db: DbSession) -> Any:
    """CSV for the sales team's spreadsheet."""
    import csv
    import io

    from fastapi.responses import StreamingResponse

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["Date", "Name", "Company", "Email", "Phone", "Country", "Source", "Status", "Message"]
    )
    for lead in db.scalars(select(Inquiry).order_by(Inquiry.created_at.desc())):
        writer.writerow(
            [
                lead.created_at.strftime("%Y-%m-%d %H:%M"),
                lead.contact_name,
                lead.company_name or "",
                lead.email,
                lead.phone or "",
                lead.country or "",
                lead.source.value,
                lead.status.value,
                (lead.message or "").replace("\n", " "),
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inquiries.csv"},
    )


# ────────────────────────── Service requests ──────────────────────────


class ServiceRequestCreate(BaseModel):
    project_address: str = Field(min_length=1)
    project_size: str | None = None
    fault_description: str = Field(min_length=1)
    photos: list[dict[str, Any]] | None = None
    contact_name: str = Field(min_length=1, max_length=255)
    contact_number: str = Field(min_length=1, max_length=60)
    contact_email: EmailStr


def _service_out(req: ServiceRequest) -> dict[str, Any]:
    return {
        "id": str(req.id),
        "project_address": req.project_address,
        "project_size": req.project_size,
        "fault_description": req.fault_description,
        "photos": req.photos or [],
        "contact_name": req.contact_name,
        "contact_number": req.contact_number,
        "contact_email": req.contact_email,
        "status": req.status.value,
        "internal_notes": req.internal_notes,
        "created_at": req.created_at.isoformat(),
    }


@router.post("/service-requests", status_code=status.HTTP_201_CREATED)
def create_service_request(
    db: DbSession, background: BackgroundTasks, payload: ServiceRequestCreate
) -> MessageResponse:
    """Public — the after-sales fault report form."""
    req = ServiceRequest(**payload.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    background.add_task(notify_service_request, req.id)
    return MessageResponse(message="Your report has been received. Our service team will be in touch.")


@router.get("/service-requests", dependencies=[Depends(require_sales)])
def list_service_requests(
    db: DbSession,
    page: PaginationDep,
    request_status: Annotated[ServiceRequestStatus | None, Query(alias="status")] = None,
) -> dict[str, Any]:
    stmt = select(ServiceRequest)
    if request_status:
        stmt = stmt.where(ServiceRequest.status == request_status)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(ServiceRequest.created_at.desc()).offset(page.offset).limit(page.limit)
    ).all()
    return {
        "items": [_service_out(r) for r in rows],
        "total": total,
        "page": page.page,
        "per_page": page.per_page,
        "pages": max(1, -(-total // page.per_page)),
    }


class ServiceRequestUpdate(BaseModel):
    status: ServiceRequestStatus | None = None
    internal_notes: str | None = None


@router.patch("/service-requests/{request_id}", dependencies=[Depends(require_sales)])
def update_service_request(
    db: DbSession, request_id: UUID, payload: ServiceRequestUpdate
) -> dict[str, Any]:
    req = db.get(ServiceRequest, request_id)
    if req is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service request not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(req, key, value)
    db.commit()
    db.refresh(req)
    return _service_out(req)
