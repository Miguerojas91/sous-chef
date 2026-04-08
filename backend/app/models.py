from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Table, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

# Tabla intermedia para requisitos previos de técnicas (Árbol de Habilidades)
technique_prerequisites = Table(
    'technique_prerequisites',
    Base.metadata,
    Column('technique_id', Integer, ForeignKey('techniques.id'), primary_key=True),
    Column('prerequisite_id', Integer, ForeignKey('techniques.id'), primary_key=True)
)

# Módulo 2: Relación entre Recetas "Jefe" y las Técnicas que evalúan
recipe_techniques = Table(
    'recipe_techniques',
    Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id'), primary_key=True),
    Column('technique_id', Integer, ForeignKey('techniques.id'), primary_key=True)
)

class UserRank(enum.Enum):
    INICIADO = "Iniciado"
    COCINERO_DE_PARTIDA = "Cocinero de Partida"
    SOUS_CHEF = "Sous Chef"
    CHEF_DE_CUISINE = "Chef de Cuisine"
    MAESTRIA_CULINARIA = "Maestría Culinaria"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    xp = Column(Integer, default=0)
    
    # Perfil alimenticio (JSON en string para DB SQLite/Postgres general, idealmente JSONB en Postgres)
    allergies = Column(String, default="[]")
    dislikes = Column(String, default="[]")
    
    # Relación con el progreso de habilidades
    completed_techniques = relationship("UserTechnique", back_populates="user")
    
    # Progreso de Recetas Jefe superadas
    completed_bosses = relationship("UserBossChallenge", back_populates="user")

    @property
    def rank(self) -> UserRank:
        if self.xp <= 500: return UserRank.INICIADO
        if self.xp <= 1500: return UserRank.COCINERO_DE_PARTIDA
        if self.xp <= 5000: return UserRank.SOUS_CHEF
        if self.xp <= 15000: return UserRank.CHEF_DE_CUISINE
        return UserRank.MAESTRIA_CULINARIA

class Technique(Base):
    __tablename__ = "techniques"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    difficulty = Column(String) # Básico, Intermedio, Difícil
    level = Column(Integer, default=1) # Nivel dentro del árbol de habilidades
    xp_reward = Column(Integer, default=100)
    
    # Módulo 4: Relación con teoría
    theory_url = Column(String, nullable=True) 
    theory_content = Column(String, nullable=True) # Contenido teórico directo
    
    # Módulo 3: Masterclass relacionada (opcional)
    masterclass_video_url = Column(String, nullable=True)

    # Autorreferencia para el árbol de habilidades
    prerequisites = relationship(
        "Technique",
        secondary=technique_prerequisites,
        primaryjoin=id == technique_prerequisites.c.technique_id,
        secondaryjoin=id == technique_prerequisites.c.prerequisite_id,
        backref="unlocked_techniques"
    )
    
    # Recetas jefe que evalúan esta técnica
    boss_recipes = relationship(
        "Recipe",
        secondary=recipe_techniques,
        back_populates="evaluated_techniques"
    )

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    video_url = Column(String, nullable=True)
    
    # Módulo 1: Propiedades para el filtro (Descubridor)
    main_protein = Column(String, index=True, nullable=True) # ej: Pollo, Carne, Vegetariano
    mood = Column(String, index=True, nullable=True) # ej: Ligero, Pesado, Reconfortante, Rápido
    
    # Módulo 3: Sabores del Mundo
    region = Column(String, index=True, nullable=True) 
    difficulty = Column(String) # Básico, Intermedio, Difícil
    
    # Módulo 2: Monstruo / Jefe de Nivel
    is_boss_challenge = Column(Boolean, default=False) 
    boss_level = Column(Integer, nullable=True) # Nivel del jefe (ej: Jefe de Nivel 1)
    xp_reward = Column(Integer, default=50) # XP por completarla
    
    # Ingredientes y pasos (almacenados como JSON stringifiers por simplicidad, o JSONB si es postgres nativo)
    ingredients = Column(String) 
    instructions = Column(String)
    
    # Técnicas que esta receta "Jefe" evalúa
    evaluated_techniques = relationship(
        "Technique",
        secondary=recipe_techniques,
        back_populates="boss_recipes"
    )

class UserTechnique(Base):
    """Registro de validación de técnicas aprendidas"""
    __tablename__ = "user_techniques"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    technique_id = Column(Integer, ForeignKey("techniques.id"), index=True)
    is_validated = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="completed_techniques")

class UserBossChallenge(Base):
    """Registro de validación fotográfica para Recetas Jefe (Módulo 2)"""
    __tablename__ = "user_boss_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), index=True)
    
    is_validated = Column(Boolean, default=False)
    validation_photo_url = Column(String, nullable=True) # Foto enviada al VisionAgent
    ai_feedback = Column(String, nullable=True) # Feedback dado por el VisionAgent
    
    user = relationship("User", back_populates="completed_bosses")

class Page(Base):
    """
    CMS: Representa una página dinámica de la aplicación (ej: Nivel Juliana).
    Guarda el esquema de bloques en 'content_json'.
    """
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    title = Column(String)
    content_json = Column(String, default="[]") # Array de Block objects
