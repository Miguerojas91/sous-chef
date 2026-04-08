import asyncio
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.base import Recipe, RecipeStep, DifficultyLevel

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Receta: Spaghetti Carbonara Auténtica
        carbonara = Recipe(
            title="Spaghetti Carbonara Auténtica",
            description="La receta clásica romana, sin crema, solo huevos, queso pecorino, guanciale y pimienta negra.",
            ingredients=["400g Spaghetti", "150g Guanciale", "4 Yemas de huevo", "100g Pecorino Romano", "Pimienta Negra"],
            difficulty=DifficultyLevel.MEDIUM,
            estimated_time_minutes=25
        )
        session.add(carbonara)
        await session.flush()

        steps = [
            RecipeStep(
                recipe_id=carbonara.id,
                step_number=1,
                instruction="Pon una olla grande con agua a hervir.",
                didactic_explanation="Necesitamos mucha agua para que la pasta se mueva libremente. No añadas sal todavía.",
                safety_warning="Cuidado con el vapor al destapar la olla.",
                timer_seconds=600 # 10 min aprox para hervir
            ),
            RecipeStep(
                recipe_id=carbonara.id,
                step_number=2,
                instruction="Corta el guanciale en tiras y sofríelo a fuego medio.",
                didactic_explanation="Queremos que la grasa se derrita lentamente (renderizar) y el guanciale quede crujiente, no quemado.",
                safety_warning="Cuidado con las salpicaduras de grasa caliente.",
                expected_visual_state="El guanciale debe estar dorado y crujiente, con la grasa transparente alrededor."
            ),
             RecipeStep(
                recipe_id=carbonara.id,
                step_number=3,
                instruction="Mezcla las yemas con el queso pecorino y mucha pimienta negra.",
                didactic_explanation="Esta mezcla se llama 'carbón'. Debe quedar como una pasta densa, no líquida.",
            ),
             RecipeStep(
                recipe_id=carbonara.id,
                step_number=4,
                instruction="Cuando el agua hierva, añade sal y la pasta. Cocina hasta que esté al dente.",
                didactic_explanation="Prueba la pasta 2 minutos antes del tiempo del paquete. Debe tener un punto blanco en el centro.",
                timer_seconds=540 # 9 min
            )
        ]
        session.add_all(steps)
        await session.commit()
        print("Datos de prueba insertados correctamente.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
