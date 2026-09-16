/**
 * utils/apiClient.ts
 *
 * Cliente HTTP que añade automáticamente:
 * - Header `Authorization: Bearer <access_token>`.
 * - Reintento transparente de la request si el access_token caducó (401):
 *     1) llama a `/auth/refresh` con el refresh_token guardado.
 *     2) si OK → guarda el nuevo par, repite la request original.
 *     3) si falla → limpia sesión y dispara `sous:auth-expired`.
 * - Coalescing: si varios fetchs en paralelo reciben 401, solo uno hace
 *   refresh; los demás esperan al mismo Promise.
 *
 * Uso:
 *     const r = await apiFetch('/api/v1/users/me');
 *     const data = await r.json();
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
      // limpiar la promesa al siguiente tick
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
}

/**
 * Resuelve una URL relativa contra `BACKEND_URL` o `API_URL` (proxy).
 * Si la URL ya es absoluta, la deja tal cual.
 */
function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Rutas /api/v1/* van al backend FastAPI; el resto al proxy.
  if (url.startsWith('/api/v1') && BACKEND_URL) return `${BACKEND_URL}${url}`;
  return url; // queda relativa; Vite proxy en dev, dominio del proxy en prod
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

  // 401 → intentar refresh
  const refreshed = await attemptRefresh();
  if (!refreshed) {
    clearSession();
    window.dispatchEvent(new CustomEvent('sous:auth-expired'));
    return resp;
  }

  // Reintentar con el nuevo access token
  resp = await fetch(finalUrl, { ...rest, headers: buildHeaders() });
  return resp;
}

/** Helper JSON: lanza si no es OK. */
export async function apiJson<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const r = await apiFetch(url, options);
  if (!r.ok) {
    const detail = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(detail.detail || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}
