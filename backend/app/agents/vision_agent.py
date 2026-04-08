from typing import List, Optional
from pydantic import BaseModel
from openai import AsyncOpenAI
import os

class VisualAnalysisResult(BaseModel):
    description: str
    detected_ingredients: List[str]
    cooking_stage: Optional[str] = None
    potential_issues: List[str] = []
    is_passed: bool = False # For Module 2 (Boss Validation)

class VisionAgent:
    """
    Specialized agent for ON-DEMAND visual analysis.
    
    - Activated only when user explicitly requests validation.
    - Compares user's photo vs. 'Gold Standard' or expected state described in recipe.
    - Specially configured to evaluate Module 2 Boss challenges.
    """
    def __init__(self, model_name: str = "gpt-4o"):
        self.model_name = model_name
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def validate_boss_challenge(self, image_data: bytes, required_techniques: List[str]) -> VisualAnalysisResult:
        """
        Validates a Boss Challenge indicating if the user successfully applied the techniques.
        """
        import base64
        import json
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        techniques_str = ", ".join(required_techniques)
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "Eres un maestro culinario sumamente estricto pero justo. "
                        "El usuario está presentando su 'Desafío Jefe' para subir de nivel en la academia. "
                        f"DEBES evaluar si en la imagen se evidencia el dominio de estas técnicas específicas: {techniques_str}. "
                        "Si el plato cumple, devuelves is_passed true. Si notas fallos graves (ej: cortes muy irregulares si evalúas Brunoise, o una emulsión cortada), devuelves false. "
                        "Responde exclusivamente con un JSON que contenga: 'description' (tu evaluación detallada), 'is_passed' (booleano), 'potential_issues' (lista)."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Evalúa este plato según las técnicas requeridas. ¿Pasa el desafío?"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ],
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=400
        )
        
        try:
             data = json.loads(response.choices[0].message.content)
             return VisualAnalysisResult(
                 description=data.get("description", "Análisis completado."),
                 detected_ingredients=[], 
                 cooking_stage="Finalizado",
                 potential_issues=data.get("potential_issues", []),
                 is_passed=data.get("is_passed", False)
             )
        except Exception:
             return VisualAnalysisResult(description="Error en la validación.", detected_ingredients=[])

