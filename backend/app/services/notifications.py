"""Email notifications for new leads and service requests.

Runs in a background task so a slow SMTP server never delays the visitor's response.
If SMTP is not configured the send is skipped and logged — form submissions are still
stored, so nothing is lost.
"""

import logging
import smtplib
from email.message import EmailMessage
from uuid import UUID

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.leads import Inquiry, ServiceRequest

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, body: str) -> None:
    if not (settings.SMTP_HOST and to):
        logger.info("SMTP not configured — skipping email %r to %r", subject, to)
        return

    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except Exception:
        # Never raise: the lead is already saved, and the admin inbox still shows it.
        logger.exception("Failed to send notification email to %s", to)


def notify_inquiry(inquiry_id: UUID) -> None:
    with SessionLocal() as db:
        lead = db.get(Inquiry, inquiry_id)
        if lead is None:
            return

        body = "\n".join(
            [
                "A new inquiry has arrived.",
                "",
                f"Name:     {lead.contact_name}",
                f"Company:  {lead.company_name or '-'}",
                f"Email:    {lead.email}",
                f"Phone:    {lead.phone or '-'}",
                f"Country:  {lead.country or '-'}",
                f"Source:   {lead.source.value}",
                f"Page:     {lead.page_url or '-'}",
                "",
                "Message:",
                lead.message or "(none)",
            ]
        )
        _send(settings.SALES_EMAIL, f"New inquiry — {lead.contact_name}", body)

        lead.notified = True
        db.commit()


def notify_service_request(request_id: UUID) -> None:
    with SessionLocal() as db:
        req = db.get(ServiceRequest, request_id)
        if req is None:
            return

        body = "\n".join(
            [
                "A new after-sales service request has arrived.",
                "",
                f"Contact:  {req.contact_name}",
                f"Phone:    {req.contact_number}",
                f"Email:    {req.contact_email}",
                f"Address:  {req.project_address}",
                f"Size:     {req.project_size or '-'}",
                f"Photos:   {len(req.photos or [])} attached",
                "",
                "Fault description:",
                req.fault_description,
            ]
        )
        _send(
            settings.SERVICE_EMAIL or settings.SALES_EMAIL,
            f"Service request — {req.contact_name}",
            body,
        )

        req.notified = True
        db.commit()
