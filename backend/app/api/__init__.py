from fastapi import APIRouter
from .endpoints import router as endpoints_router
from .websockets import router as websockets_router
from .auth import router as auth_router
from .cms import router as cms_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(endpoints_router)
router.include_router(websockets_router)
router.include_router(cms_router, prefix="/cms", tags=["cms"])

