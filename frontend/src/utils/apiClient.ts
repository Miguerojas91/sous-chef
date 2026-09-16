/**
 * fetch con `Authorization: Bearer`. Ante un 401 renueva el token y repite la
 * petición una vez; si no puede, cierra sesión y emite `sous:auth-expired`.
 * Si varias peticiones reciben 401 a la vez, comparten un solo refresh.
 */

import {
  getToken,
  getRefreshToken,
  setSession,
  clearSession,
  getUser,
} from './auth';

const BACKEND_URL = ((import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt || !BACKEND_URL) return false;
    try {
      const r = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!r.ok) return false;
      const data = (await r.json()) as { access_token: string; refresh_token: string };
      const user = getUser();
      if (!user) return false;
      setSession(user, data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      // al siguiente tick, para que las llamadas en curso reciban la misma promesa
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
}

/** `/api/v1/*` va al backend FastAPI; lo demás queda relativo (proxy de Vite en dev, dominio del proxy en prod). */
function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/v1') && BACKEND_URL) return `${BACKEND_URL}${url}`;
  return url;
}

export interface ApiFetchOptions extends RequestInit {
  /** No reintentar el refresh aunque dé 401 (útil para /auth/login). */
  skipAuth?: boolean;
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuth, headers, ...rest } = options;
  const finalUrl = resolveUrl(url);

  const buildHeaders = (): HeadersInit => {
    const h = new Headers(headers);
    if (!skipAuth) {
      const token = getToken();
      if (token) h.set('Authorization', `Bearer ${token}`);
    }
    if (rest.body && !h.has('Content-Type')) h.set('Content-Type', 'application/json');
    return h;
  };

  let resp = await fetch(finalUrl, { ...rest, headers: buildHeaders() });

  if (resp.status !== 401 || skipAuth) return resp;

  const refreshed = await attemptRefresh();
  if (!refreshed) {
    clearSession();
    window.dispatchEvent(new CustomEvent('sous:auth-expired'));
    return resp;
  }

  resp = await fetch(finalUrl, { ...rest, headers: buildHeaders() });
  return resp;
}

/** Lanza con el `detail` del servidor si la respuesta no es OK. */
export async function apiJson<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const r = await apiFetch(url, options);
  if (!r.ok) {
    const detail = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(detail.detail || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}
