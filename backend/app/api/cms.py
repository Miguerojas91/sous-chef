"""
app/api/cms.py

Endpoints del CMS (Constructor Visual). La ESCRITURA y el listado completo
requieren privilegios de admin. La lectura de una página individual es pública
(el frontend la renderiza), pero NO auto-crea páginas para usuarios no-admin
(evita DoS de almacenamiento por creación masiva de slugs arbitrarios).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from app.models import Page, User
from app.core.database import get_db
from app.core.security import require_admin

router = APIRouter()


class PageUpdate(BaseModel):
    title: Optional[str] = None
    content_json: str


class PageResponse(BaseModel):
    id: int
    slug: str
    title: Optional[str] = None
    content_json: str

    class Config:
        from_attributes = True


@router.get("/pages/{slug}", response_model=PageResponse)
async def get_page(slug: str, db: AsyncSession = Depends(get_db)):
    """Lectura pública de una página. NO auto-crea (eso lo hace el PUT de admin)
    — evita que cualquiera infle la tabla con slugs arbitrarios."""
    result = await db.execute(select(Page).filter(Page.slug == slug))
    page = result.scalars().first()

    if not page:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    return page


@router.put("/pages/{slug}", response_model=PageResponse)
async def update_page(
    slug: str,
    page_in: PageUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),  # SOLO admin puede escribir
):
    result = await db.execute(select(Page).filter(Page.slug == slug))
    page = result.scalars().first()

    if not page:
        # Un admin SÍ puede crear la página al editarla por primera vez.
        page = Page(slug=slug, title=(page_in.title or slug.replace("-", " ").title()),
                    content_json=page_in.content_json)
        db.add(page)
        await db.commit()
        await db.refresh(page)
        return page

    if page_in.title is not None:
        page.title = page_in.title
    page.content_json = page_in.content_json

    await db.commit()
    await db.refresh(page)
    return page


@router.get("/pages", response_model=List[PageResponse])
async def list_pages(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),  # listar todas las páginas: solo admin
):
    result = await db.execute(select(Page))
    pages = result.scalars().all()
    return list(pages)
