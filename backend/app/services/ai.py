"""Groq-backed answer generation for the "AI intelligent answer" feature.

Retrieval happens in Postgres (see `retrieval.py`); this module only turns the retrieved
rows into prose. The model is instructed to answer strictly from those rows, so it cannot
invent a product or a specification that is not in the catalogue.
"""

import logging
from typing import Any

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are the product assistant for a solar PV manufacturer's website.

Answer using ONLY the numbered SOURCES provided. Rules:
- If the sources do not contain the answer, say so plainly and suggest contacting sales.
  Never invent a model number, specification, price, or certification.
- Cite the sources you used as [1], [2] inline.
- Be concise: 2-4 sentences, or a short list when comparing products.
- When the user describes a requirement (wattage, roof size, budget, home vs factory),
  recommend the specific models from the sources that fit, and say why.
- Never quote a price — pricing is always by inquiry.
- Reply in the same language the user asked in.
"""


def _client() -> Groq | None:
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not set — AI answers are disabled")
        return None
    # base_url is passed explicitly so a stray GROQ_BASE_URL in the environment cannot
    # double up the path the SDK already appends.
    return Groq(api_key=settings.GROQ_API_KEY, base_url=settings.GROQ_BASE_URL)


def build_context(sources: list[dict[str, Any]], max_chars: int = 6000) -> str:
    """Numbered source block. Truncated per source so one long article cannot crowd out the rest."""
    blocks, used = [], 0
    per_source = max(400, max_chars // max(1, len(sources)))

    for i, source in enumerate(sources, start=1):
        body = (source.get("content") or "")[:per_source]
        block = f"[{i}] {source['title']}\nURL: {source['url_path']}\n{body}"
        if used + len(block) > max_chars:
            break
        blocks.append(block)
        used += len(block)

    return "\n\n".join(blocks)


def answer_question(question: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    """Returns {answer, model, used_sources}. Degrades gracefully if Groq is unavailable."""
    if not sources:
        return {
            "answer": (
                "I could not find anything matching that in our catalogue. "
                "Try different wording, or contact our sales team for help."
            ),
            "model": None,
            "used_sources": 0,
        }

    client = _client()
    if client is None:
        # No API key: still useful — return the retrieved sources without prose.
        return {
            "answer": "AI answering is not configured. Here are the closest matches from our catalogue.",
            "model": None,
            "used_sources": len(sources),
        }

    context = build_context(sources)
    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": f"SOURCES:\n{context}\n\nQUESTION: {question}"},
            ],
            temperature=0.2,
            max_tokens=700,
        )
        return {
            "answer": completion.choices[0].message.content or "",
            "model": settings.GROQ_MODEL,
            "used_sources": len(sources),
        }
    except Exception:
        logger.exception("Groq request failed")
        return {
            "answer": (
                "The assistant is temporarily unavailable. "
                "Here are the closest matches from our catalogue."
            ),
            "model": None,
            "used_sources": len(sources),
        }
