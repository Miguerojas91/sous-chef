from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from app.models import Page
from app.core.database import get_db

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
    result = await db.execute(select(Page).filter(Page.slug == slug))
    page = result.scalars().first()
    
    if not page:
        # Auto-create empty page for the CMS if it doesn't exist
        page = Page(slug=slug, title=slug.replace("-", " ").title(), content_json="[]")
        db.add(page)
        await db.commit()
        await db.refresh(page)
        
    return page

@router.put("/pages/{slug}", response_model=PageResponse)
async def update_page(slug: str, page_in: PageUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Page).filter(Page.slug == slug))
    page = result.scalars().first()
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page_in.title is not None:
        page.title = page_in.title
    page.content_json = page_in.content_json
    
    await db.commit()
    await db.refresh(page)
    return page

@router.get("/pages", response_model=List[PageResponse])
async def list_pages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Page))
    pages = result.scalars().all()
    return list(pages)
