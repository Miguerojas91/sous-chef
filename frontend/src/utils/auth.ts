/**
 * Sesión del frontend: backend JWT si hay `VITE_BACKEND_URL`, si no, solo local.
 * localStorage: `user` (LocalUser), `sous_token` (JWT, ~15 min),
 * `sous_refresh` (refresh token opaco, ~30 días).
 */

import type { LocalUser } from '../data/localUsers';
import { emitUserStateChange } from './events';

const BACKEND_URL = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

const TOKEN_KEY = 'sous_token';
const REFRESH_KEY = 'sous_refresh';
const USER_KEY = 'user';

export const isBackendAuthEnabled = () => Boolean(BACKEND_URL);

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);

export const getUser = (): LocalUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
};

export const getUserCountry = (): string | undefined => getUser()?.country;

export const setUserCountry = (countryCode: string): void => {
  const user = getUser();
  if (!user) return;
  const next = { ...user, country: countryCode };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitUserStateChange();
};

/** Cae a `dietaryPreferences` para usuarios guardados antes de `preferences`. */
export const getUserPreferences = (): string[] => {
  const u = getUser();
  return u?.preferences ?? u?.dietaryPreferences ?? [];
};

export const setUserPreferences = (ids: string[]): void => {
  const user = getUser();
  if (!user) return;
  // Se borra el campo antiguo para que no queden dos fuentes distintas.
  const next = { ...user, preferences: ids };
  delete next.dietaryPreferences;
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitUserStateChange();
};

export const getUserAllergies = (): string[] => getUser()?.allergies ?? [];

export const setUserAllergies = (allergies: string[]): void => {
  const user = getUser();
  if (!user) return;
  const next = { ...user, allergies };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitUserStateChange();
};

export const getUserDislikes = (): string[] => getUser()?.dislikes ?? [];

export const setUserDislikes = (dislikes: string[]): void => {
  const user = getUser();
  if (!user) return;
  const next = { ...user, dislikes };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitUserStateChange();
};

/** @deprecated Usa `getUserPreferences`. */
export const getUserDietary = getUserPreferences;
/** @deprecated Usa `setUserPreferences`. */
export const setUserDietary = setUserPreferences;

export const setSession = (user: LocalUser, token?: string, refreshToken?: string): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  emitUserStateChange();
};

export const clearSession = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  emitUserStateChange();
};

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface JwtPayload {
  sub: string;
  exp?: number;
  iat?: number;
  is_admin?: boolean;
  username?: string;
}

/** Solo lee claims: no verifica la firma, no usar para decisiones de seguridad. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(): boolean {
  const t = getToken();
  if (!t) return true;
  const payload = decodeJwt(t);
  if (!payload?.exp) return false; // sin exp no se asume caducado
  // 30 s de margen para no mandar un token que caduca en tránsito
  return payload.exp * 1000 < Date.now() + 30_000;
}

export class BackendUnavailableError extends Error {}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    allergies: string[];
    dislikes: string[];
    xp: number;
  };
}

async function postBackend<T>(path: string, body: unknown): Promise<T> {
  if (!BACKEND_URL) throw new BackendUnavailableError('VITE_BACKEND_URL no configurada');
  let resp: Response;
  try {
    resp = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new BackendUnavailableError((e as Error).message);
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || `Error ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

function authResponseToUser(r: AuthResponse): LocalUser {
  return {
    username: r.user.username,
    password: '', // con JWT no se guarda la contraseña
    email: r.user.email,
    xp: r.user.xp,
    rank: 'Iniciado', // el header lo recalcula a partir del XP
    is_admin: r.user.is_admin,
  };
}

export async function backendLogin(username: string, password: string): Promise<LocalUser> {
  const r = await postBackend<AuthResponse>('/api/v1/auth/login', { username, password });
  const u = authResponseToUser(r);
  setSession(u, r.access_token, r.refresh_token);
  return u;
}

export async function backendRegister(args: {
  username: string;
  email: string;
  password: string;
  allergies?: string[];
  dislikes?: string[];
}): Promise<LocalUser> {
  const r = await postBackend<AuthResponse>('/api/v1/auth/register', args);
  const u = authResponseToUser(r);
  setSession(u, r.access_token, r.refresh_token);
  return u;
}

/** Revoca este refresh token en el servidor; ignora errores. */
export async function backendLogout(): Promise<void> {
  if (!BACKEND_URL) return;
  const rt = getRefreshToken();
  const at = getToken();
  if (!rt || !at) return;
  try {
    await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${at}` },
      body: JSON.stringify({ refresh_token: rt }),
    });
  } catch { /* sin conexión: se ignora */ }
}

/** Revoca todas las sesiones del usuario en todos sus dispositivos. */
export async function backendLogoutAll(): Promise<void> {
  if (!BACKEND_URL) return;
  const at = getToken();
  if (!at) return;
  try {
    await fetch(`${BACKEND_URL}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${at}` },
    });
  } catch { /* se ignora */ }
}
