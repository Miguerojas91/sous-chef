/**
 * Acceso a localStorage que nunca lanza. En modo privado de Safari, con la
 * cuota llena o con el almacenamiento bloqueado, `getItem`/`setItem` lanzan;
 * aquí eso se trata como "no hay dato" o "no se guardó".
 */

/**
 * Lee y parsea JSON. Devuelve `fallback` si la clave no existe, el JSON está
 * roto, el valor no pasa `guard` o el almacenamiento no está disponible.
 */
export function readJSON<T, F = T>(key: string, guard: (value: unknown) => value is T, fallback: F): T | F {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value: unknown = JSON.parse(raw);
    return guard(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Guarda como JSON. Devuelve `false` si no se pudo escribir. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* sin almacenamiento: no hay nada que borrar */ }
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');
