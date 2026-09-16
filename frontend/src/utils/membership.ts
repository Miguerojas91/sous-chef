/** Membresía Premium: se consulta al proxy (la clave de Hotmart no sale del servidor) y se cachea en localStorage. */

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

/** Nunca lanza: ante cualquier error devuelve `false`. */
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

/** Síncrono, desde localStorage. Los admins siempre cuentan como Premium. */
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

export function updatePremiumStatus(isPremium: boolean): void {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    user.isPremium = isPremium;
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('userStateChange'));
  } catch { /* no crítico: se vuelve a sincronizar en el próximo login */ }
}
