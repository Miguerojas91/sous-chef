/**
 * localUsers.ts
 *
 * Usuarios precargados para acceso directo sin backend de autenticación.
 *
 * ⚠️  IMPORTANTE — Estado actual (pre-beta cleanup):
 *
 * El array LOCAL_USERS fue VACIADO antes del beta cerrado porque las
 * contraseñas plaintext quedaban visibles en el bundle JavaScript de
 * producción (cualquiera con DevTools podía leerlas en `view-source`).
 *
 * Los usuarios fundadores (familia, amigos) deben migrar a una de estas
 * opciones:
 *  1. Registrarse via el formulario normal (recomendado — sus credenciales
 *     se guardan SOLO en su propio dispositivo en `sous_registered_users`).
 *  2. Backend con JWT (cuando esté desplegado). Ver `backend/seed_users.py`
 *     que migra los usuarios viejos a Postgres con bcrypt.
 *
 * Para tener UN admin seed sin meterlo al bundle: configura
 * `VITE_SEED_ADMIN=username:password[:email]` en Vercel env vars.
 * El AuthScreen lee este valor en runtime y lo añade al array efectivo.
 *
 * El símbolo `LOCAL_USERS` se mantiene exportado para no romper imports.
 */

/** Estructura de un usuario de la aplicación Sous Chef. */
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
  /** @deprecated — usa `preferences`. Mantenido para back-compat con storage legacy. */
  dietaryPreferences?: string[];
  /** Ingredientes con alergia (NUNCA usar). */
  allergies?: string[];
  /** Ingredientes que no le gustan (evitar, no crítico). */
  dislikes?: string[];
}

/**
 * Lista de usuarios precargados — VACÍA en producción.
 *
 * Si necesitas un admin seed: configura `VITE_SEED_ADMIN` en Vercel.
 * No agregues credenciales aquí (quedan en el bundle público).
 */
export const LOCAL_USERS: LocalUser[] = [];

/**
 * Lee un admin seed opcional desde env var (Vite lo inyecta en build pero
 * solo si está configurado — el usuario regular no lo ve en el bundle si
 * no se configuró).
 *
 * Formato esperado: `username:password` o `username:password:email`.
 */
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
