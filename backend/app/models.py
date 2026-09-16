from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Table, Enum, DateTime, Text
from sqlalchemy.sql import func
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
    
    # Perfil alimenticio como JSON serializado en texto (compatible con SQLite).
    allergies = Column(String, default="[]")
    dislikes = Column(String, default="[]")
    
    completed_techniques = relationship("UserTechnique", back_populates="user")
    
    # Recetas jefe superadas
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
    
    # Ingredientes y pasos como JSON serializado en texto.
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


class RefreshToken(Base):
    """
    Refresh token persistido (solo el hash, nunca el token en claro).

    Flujo:
    - /auth/login emite un access_token (JWT corto) + refresh_token opaco.
    - El cliente envía el refresh_token a /auth/refresh para rotar.
    - Cada uso consume el actual (revoked_at + replaced_by_id) y emite uno nuevo.
    - Detección de reuso: si llega un refresh_token ya revocado, se invalidan
      todos los tokens del usuario (señal de robo).
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by_id = Column(Integer, ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True)
    user_agent = Column(String(512), nullable=True)
    ip = Column(String(64), nullable=True)


class AuditLog(Base):
    """Registro append-only de acciones sensibles. RLS: el usuario ve las suyas."""
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    action = Column(String(64), nullable=False, index=True)
    target = Column(String(255), nullable=True)
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    metadata_ = Column("metadata", Text, nullable=True)  # SQLAlchemy reserva 'metadata'
    ok = Column(Boolean, server_default="1", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
