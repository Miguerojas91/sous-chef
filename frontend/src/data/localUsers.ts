/**
 * localUsers.ts
 *
 * Usuarios precargados para acceso directo sin necesidad de backend de autenticación.
 * En producción estos datos se complementan con los usuarios registrados
 * dinámicamente, que se almacenan en `localStorage` bajo la clave
 * `sous_registered_users`.
 *
 * ⚠️  SEGURIDAD: Este archivo contiene contraseñas en texto plano.
 * Es aceptable mientras la app sea una demo/MVP con usuarios de confianza.
 * Para producción escalable se debe migrar a un backend de autenticación real.
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
}

/** Lista de usuarios preconfigurados que no requieren registro. */
export const LOCAL_USERS: LocalUser[] = [
  {
    username: 'admin',
    password: 'SousChef@Admin1',
    xp: 9999,
    rank: 'Maestría Culinaria',
    is_admin: true,
  },
  {
    username: 'Tatis',
    password: 'Homerojay07*',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Papa',
    password: 'Maroma2011.',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'miguerojas91',
    password: 'Miguel40.',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Olga',
    password: 'Valeria',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Alexa',
    password: 'Alexa',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Gaby',
    password: 'Gabyismm',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
];
