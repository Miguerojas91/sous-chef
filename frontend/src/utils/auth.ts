/**
 * utils/auth.ts
 *
 * Capa de sesión del frontend. Soporta dos modos:
 * 1. Backend JWT (si está configurada `VITE_BACKEND_URL`).
 * 2. Local-only (LOCAL_USERS + localStorage) — modo MVP heredado.
 *
 * El token JWT se guarda en `localStorage['sous_token']`. El usuario sigue
 * en `localStorage['user']` para compatibilidad con el resto del código.
 */

import type { LocalUser } from '../data/localUsers';

const BACKEND_URL = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

const TOKEN_KEY = 'sous_token';
const USER_KEY = 'user';

export const isBackendAuthEnabled = () => Boolean(BACKEND_URL);

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): LocalUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
};

export const setSession = (user: LocalUser, token?: string): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('userStateChange'));
};

export const clearSession = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('userStateChange'));
};

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Backend auth (FastAPI) ────────────────────────────────────────────────────

export class BackendUnavailableError extends Error {}

interface AuthResponse {
  access_token: string;
  token_type: string;
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

export async function backendLogin(username: string, password: string): Promise<LocalUser> {
  const r = await postBackend<AuthResponse>('/api/v1/auth/login', { username, password });
  const u: LocalUser = {
    username: r.user.username,
    password: '', // no se persiste — usamos el JWT
    email: r.user.email,
    xp: r.user.xp,
    rank: 'Iniciado', // se recalcula desde el header
    is_admin: r.user.is_admin,
  };
  setSession(u, r.access_token);
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
  const u: LocalUser = {
    username: r.user.username,
    password: '',
    email: r.user.email,
    xp: r.user.xp,
    rank: 'Iniciado',
    is_admin: r.user.is_admin,
  };
  setSession(u, r.access_token);
  return u;
}
