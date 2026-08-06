"""Aggregates every v1 router under one prefix."""

from fastapi import APIRouter

from app.api.v1 import auth, categories, content, leads, media, products, search

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(content.router)
api_router.include_router(media.router)
api_router.include_router(leads.router)
api_router.include_router(search.router)
