/** Usuarios locales: no pongas credenciales aquí, quedan en el bundle público (admin seed vía `VITE_SEED_ADMIN`). */

export interface LocalUser {
  /** Nombre de usuario único (insensible a mayúsculas al comparar). */
  username: string;
  /** Contraseña en texto plano (solo para MVP local). */
  password: string;
  /** Correo electrónico opcional, usado para verificar membresía premium vía Hotmart. */
  email?: string;
  /** Puntos de experiencia acumulados. Aumentan al completar niveles. */
  xp: number;
  /** Rango calculado a partir del XP (ej. "Iniciado", "Sous Chef"). */
  rank: string;
  /** Si es `true`, tiene acceso al Constructor Visual CMS y a todos los módulos. */
  is_admin: boolean;
  /** Si es `true`, tiene acceso a los mundos premium (Mundos 3-5 del Modo Aventura). */
  isPremium?: boolean;
  /** Código ISO del país del usuario para localización de recetas (ej. 'CO', 'MX'). */
  country?: string;
  /**
   * IDs de TODOS los filtros activos persistentes del usuario (dietéticos,
   * restricciones de hogar como "sin horno", presupuesto, familia, etc.).
   * Se inyectan automáticamente al system prompt en cada sesión sin pedir
   * confirmación. El usuario los edita desde su perfil.
   */
  preferences?: string[];
  /** @deprecated Usa `preferences`; se conserva para leer storage antiguo. */
  dietaryPreferences?: string[];
  /** Nunca se usan en una receta. */
  allergies?: string[];
  /** Se evitan, pero no es crítico. */
  dislikes?: string[];
}

/** Vacío a propósito; se mantiene exportado para no romper imports. */
export const LOCAL_USERS: LocalUser[] = [];

/** Admin opcional desde `VITE_SEED_ADMIN` con formato `username:password[:email]`. */
export function getSeedAdmin(): LocalUser[] {
  const raw = ((import.meta.env.VITE_SEED_ADMIN as string | undefined) ?? '').trim();
  if (!raw) return [];
  const parts = raw.split(':');
  if (parts.length < 2) return [];
  return [{
    username: parts[0],
    password: parts[1],
    email: parts[2] || undefined,
    xp: 9999,
    rank: 'Maestría Culinaria',
    is_admin: true,
  }];
}
