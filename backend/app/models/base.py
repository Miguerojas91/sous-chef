from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, JSON, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.core.database import Base

class DifficultyLevel(enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    dietary_preferences = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("CookingSession", back_populates="user")
    technique_progress = relationship("TechniqueProgress", back_populates="user")

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    ingredients = Column(JSON, nullable=False)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    estimated_time_minutes = Column(Integer)
    
    steps = relationship("RecipeStep", back_populates="recipe", order_by="RecipeStep.step_number")

class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"))
    step_number = Column(Integer, nullable=False)
    instruction = Column(Text, nullable=False)
    
    didactic_explanation = Column(Text)  # el porqué del paso
    safety_warning = Column(Text)        # aviso de seguridad que se inyecta en la voz
    expected_visual_state = Column(Text) # referencia para validar la foto con visión
    timer_seconds = Column(Integer)

    recipe = relationship("Recipe", back_populates="steps")

class TechniqueProgress(Base):
    __tablename__ = "technique_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    technique_name = Column(String, nullable=False)
    proficiency_level = Column(Integer, default=1)
    last_practiced_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="technique_progress")

class CookingSession(Base):
    __tablename__ = "cooking_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"))
    current_step_number = Column(Integer, default=1)
    status = Column(String, default="active") # active, completed, aborted
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    
    # Historial de interacciones que da contexto a la sesión
    interaction_log = Column(JSON, default=[]) 
    
    # Temporizadores activos: {"timer_id": {"label": "Pasta", "end_time": "ISO...", "duration": 600}}
    active_timers = Column(JSON, default={})

    user = relationship("User", back_populates="sessions")
