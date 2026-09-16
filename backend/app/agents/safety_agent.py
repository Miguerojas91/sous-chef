from typing import List, Optional
from pydantic import BaseModel

class SafetyAlert(BaseModel):
    severity: str  # 'info', 'warning', 'critical'
    message: str
    action_required: bool

class SafetyAgent:
    """
    Recordatorios de seguridad en el flujo de voz según el paso y los
    temporizadores. No accede al video de forma continua, por privacidad.
    """
    def __init__(self):
        pass

    async def generate_safety_check(self, recipe_context: dict, elapsed_time: int) -> Optional[SafetyAlert]:
        """Sin implementar: nunca devuelve alerta."""
        return None
