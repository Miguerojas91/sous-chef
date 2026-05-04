"""
app/api/endpoints.py

Endpoints generales del usuario autenticado.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models import User, UserRank

router = APIRouter()


class UserProfileResponse(BaseModel):
    username: str
    rank: str
    xp: int
    next_rank_xp: int
    level_progress: float


# Brackets de XP por rango (alineados con UserRank en app/models.py)
RANK_BRACKETS = [
    (UserRank.INICIADO,            0,     500),
    (UserRank.COCINERO_DE_PARTIDA, 500,   1500),
    (UserRank.SOUS_CHEF,           1500,  5000),
    (UserRank.CHEF_DE_CUISINE,     5000,  15000),
    (UserRank.MAESTRIA_CULINARIA,  15000, 50000),
]


def _bracket_for_xp(xp: int) -> tuple[UserRank, int, int]:
    for rank, base, ceil in RANK_BRACKETS:
        if xp < ceil:
            return rank, base, ceil
    return RANK_BRACKETS[-1]


@router.get("/users/me", response_model=UserProfileResponse)
async def get_current_user_profile(current: User = Depends(get_current_user)):
    """Devuelve el perfil real del usuario autenticado, calculando rango y progreso."""
    xp = current.xp or 0
    rank, base_xp, next_rank_xp = _bracket_for_xp(xp)
    span = max(1, next_rank_xp - base_xp)
    progress = max(0.0, min(100.0, ((xp - base_xp) / span) * 100))
    return UserProfileResponse(
        username=current.username,
        rank=rank.value,
        xp=xp,
        next_rank_xp=next_rank_xp,
        level_progress=progress,
    )
