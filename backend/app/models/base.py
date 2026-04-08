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
    ingredients = Column(JSON, nullable=False)  # List of ingredients
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    estimated_time_minutes = Column(Integer)
    
    steps = relationship("RecipeStep", back_populates="recipe", order_by="RecipeStep.step_number")

class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"))
    step_number = Column(Integer, nullable=False)
    instruction = Column(Text, nullable=False)
    
    # New fields for Voice-First/Privacy-First
    didactic_explanation = Column(Text)  # The "Why" behind the step
    safety_warning = Column(Text)        # Safety tip to inject
    expected_visual_state = Column(Text) # Description for On-Demand Vision validation
    timer_seconds = Column(Integer)      # Timer duration if applicable

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
    
    # Log of interactons for the "State Machine" Context
    interaction_log = Column(JSON, default=[]) 
    
    # Active Timers State: {"timer_id": {"label": "Pasta", "end_time": "ISO...", "duration": 600}}
    active_timers = Column(JSON, default={})

    user = relationship("User", back_populates="sessions")
