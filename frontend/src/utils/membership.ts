const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

/** Consulta el proxy para saber si un email tiene membresía activa. */
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

/** Lee el flag isPremium del objeto de usuario en localStorage (o is_admin). */
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

/** Persiste el estado premium en localStorage y dispara el evento de sync. */
export function updatePremiumStatus(isPremium: boolean): void {
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, unknown>;
    user.isPremium = isPremium;
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('userStateChange'));
  } catch { /* no crítico */ }
}
