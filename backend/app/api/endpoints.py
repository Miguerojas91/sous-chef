from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class UserProfileResponse(BaseModel):
    username: str
    rank: str
    xp: int
    next_rank_xp: int
    level_progress: float

@router.get("/users/me", response_model=UserProfileResponse)
async def get_current_user_profile():
    # Datos simulados para demostrar conectividad de la barra XP
    # En producción, esto sacaría current_user.xp y current_user.rank desde la BD
    current_xp = 850
    
    # Lógica basada en UserRank de models.py
    # INICIADO: <= 500, COCINERO_DE_PARTIDA: <= 1500, SOUS_CHEF: <= 5000, CHEF_DE_CUISINE: <= 15000
    next_rank_xp = 1500
    base_xp = 500 # XP del rango anterior
    
    # Calcular porcentaje solo del bracket actual
    progress = ((current_xp - base_xp) / (next_rank_xp - base_xp)) * 100
    
    return UserProfileResponse(
        username="Miguel",
        rank="Cocinero de Partida",
        xp=current_xp,
        next_rank_xp=next_rank_xp,
        level_progress=progress
    )
