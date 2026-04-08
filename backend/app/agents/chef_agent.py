from typing import List, Dict, Any
from pydantic import BaseModel
from openai import AsyncOpenAI
import os

class AutonomousTimer(BaseModel):
    duration_minutes: float
    label: str
    message_to_user: str

class ChefResponse(BaseModel):
    message: str
    suggested_actions: List[str]
    timers_to_start: List[AutonomousTimer] = []

class ChefAgent:
    """
    Orchestrator agent responsible for the conversation flow and recipe guidance.
    
    VOICE-FIRST PHILOSOPHY:
    - Acts as a cooking teacher, not a GPS.
    - Explains the 'why' behind steps (didactic).
    - Manages the state machine of the cooking session.
    """
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            self.client = AsyncOpenAI(api_key=api_key)
        else:
            self.client = None
            print("WARNING: OPENAI_API_KEY not found. Chef Agent running in demo mode.")

        self.system_prompt = (
            "Eres Sous, un experto instructor culinario. Tu objetivo es enseñar, no solo dirigir.\n"
            "Debes explicar el *por qué* de cada paso de forma didáctica.\n"
            "Módulo 1: Si el usuario busca recetas por antojos o ingredientes de la nevera, dale opciones e ideas creativas.\n"
            "CRÍTICO: Comunicate de forma extremadamente clara y sencilla, como si le explicaras a un niño pequeño.\n"
            "REGLA DE ORO DE SEGURIDAD Y TIEMPOS:\n"
            "Cada vez que el usuario confirme una acción que requiera tiempo (ej: 'ya está en el horno' o 'el agua está hirviendo'), "
            "DEBES iniciar un temporizador autónomo (""timer_action"") indicando los minutos, pero SIEMPRE debes añadir una advertencia similar a esta:\n"
            "'He iniciado el temporizador de X minutos, pero mantente atento; observa el color y la textura, confía en tu instinto por encima del reloj, te lo estaré recordando.'\n"
            "Nunca des un tiempo sin esta advertencia de seguridad instintiva."
        )

    async def manage_timers(self, current_timers: Dict[str, Any], new_command: str) -> Dict[str, Any]:
        """
        Parses commands to start/stop/check timers.
        Returns updated timers state.
        e.g., 'Set a timer for 10 minutes for the pasta'
        """
        # Placeholder for NLU logic
        return current_timers

    async def get_next_step_narrative(self, step_instruction: str, didactic_info: str, context: Dict[str, Any]) -> str:
        """
        Generates the voice narrative for a specific recipe step.
        """
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Explain this step to the user: '{step_instruction}'. Context info: {didactic_info}. Make it conversational."}
            ]
        )
        return response.choices[0].message.content

    async def process_voice_command(self, transcript: str, context: Dict[str, Any]) -> ChefResponse:
        """
        Processes transcribed voice commands to control flow.
        """
        if not self.client:
             return ChefResponse(
                message=f"I heard you say: '{transcript}'. (Configure OPENAI_API_KEY to get real AI responses)",
                suggested_actions=["Next Step", "Repeat"]
            )

        dynamic_system_prompt = self.system_prompt
        
        # Check if it's a milprep session
        if context.get("is_milprep"):
            weekly_recipes = context.get("weekly_recipes", [])
            grocery_list = context.get("grocery_list", {})
            dynamic_system_prompt += (
                f"\n\n==================================\n"
                f"MODO MILPREP ACTIVADO:\n"
                f"El usuario está en el módulo de 'Meal Prep' (batch cooking).\n"
                f"Recetas de la semana: {weekly_recipes}\n"
                f"Lista de mercado: {grocery_list}\n"
                f"OBJETIVO PRINCIPAL: Organizar estas preparaciones en ORDEN DE PROCESOS (Batch Cooking) para ahorrar tiempo "
                f"(ej: picar todas las verduras juntas, preparar bases simultáneas).\n"
                f"REGLA CRÍTICA DE COMUNICACIÓN:\n"
                f"- Tus respuestas deben ser MUY RESUMIDAS, DIRECTAS y EXTREMADAMENTE ESPECÍFICAS.\n"
                f"- Usa vocabulario técnico culinario exacto para los cortes y técnicas correspondientes a cada receta individual.\n"
                f"- NUNCA digas cosas genéricas como 'pica las verduras en tamaños pequeños'.\n"
                f"- DI EXACTAMENTE CÓMO CORTAR (ejemplo): 'Para el Pollo al horno, pica la zanahoria en mirepoix (cuadros grandes irregulares). Para los Tacos, pica la cebolla blanca en brunoise (cubos pequeños muy finos).'\n"
                f"Sé muy estructurado y prioriza la eficiencia de tiempo."
            )

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": dynamic_system_prompt + " You are controlling a cooking session. Respond with JSON containing 'message', 'suggested_actions' and optionally 'timers_to_start'."},
                {"role": "user", "content": f"User said: '{transcript}'. Current context: {context}"}
            ], # type: ignore
            response_format={"type": "json_object"}
        )
        # Simple parsing for demo purposes - in prod use Pydantic parsing
        import json
        data = json.loads(response.choices[0].message.content)
        
        timers_data = data.get("timers_to_start", [])
        parsed_timers = []
        for t in timers_data:
            parsed_timers.append(AutonomousTimer(
                duration_minutes=t.get("duration_minutes", 0),
                label=t.get("label", "Timer"),
                message_to_user=t.get("message_to_user", "")
            ))
            
        return ChefResponse(
            message=data.get("message", "No te entendí bien, ¿puedes repetir?"),
            suggested_actions=data.get("suggested_actions", []),
            timers_to_start=parsed_timers
        )
