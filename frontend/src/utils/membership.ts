/**
 * membership.ts
 *
 * Utilidades para verificar y gestionar el estado de membresía premium
 * del usuario. Consulta el proxy propio (no expone la clave de Hotmart)
 * y sincroniza el resultado con localStorage para uso offline inmediato.
 */

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

/**
 * Consulta el proxy para saber si un email tiene membresía premium activa.
 * Falla de forma segura: si la red falla, devuelve `false` sin lanzar error.
 *
 * @param email - Dirección de correo del usuario a verificar.
 * @returns `true` si el email tiene una suscripción activa, `false` en cualquier otro caso.
 */
export async function checkMembership(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const res = await fetch(
      `${API_URL}/api/membership/check?email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return false;
    const data = await res.json() as { isPremium: boolean };
    return data.isPremium === true;
  } catch {
    return false;
  }
}

/**
 * Verifica de forma síncrona si el usuario actualmente logueado tiene acceso premium.
 * Lee el objeto de usuario de localStorage. Los administradores siempre tienen acceso.
 *
 * @returns `true` si el usuario es premium o admin, `false` si no hay sesión o no es premium.
 */
export function isPremiumUser(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as {
      isPremium?: boolean;
      is_admin?: boolean;
    };
    return user.isPremium === true || user.is_admin === true;
  } catch {
    return false;
  }
}

/**
 * Actualiza el flag `isPremium` del usuario en localStorage y notifica
 * a los listeners del evento `userStateChange` para sincronizar la UI.
 *
 * @param isPremium - Nuevo estado de la membresía.
 */
export function updatePremiumStatus(isPremium: boolean): void {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    user.isPremium = isPremium;
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('userStateChange'));
  } catch { /* no crítico — el estado se re-sincroniza en el próximo login */ }
}
