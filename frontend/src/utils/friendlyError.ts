/** Traduce errores técnicos de la API de voz a un mensaje que el usuario entienda. */
export function friendlyVoiceError(raw: string): string {
  const r = raw.toLowerCase();

  if (r.includes('websocket') || r.includes('connection') || r.includes('network') || r.includes('failed to fetch')) {
    return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  }
  if (r.includes('microphone') || r.includes('permission') || r.includes('notallowederror')) {
    return 'No se pudo acceder al micrófono. Revisa que la app tenga permiso para usarlo.';
  }
  if (r.includes('quota') || r.includes('429') || r.includes('rate limit')) {
    return 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.';
  }
  if (r.includes('500') || r.includes('internal')) {
    return 'El servidor tuvo un problema. Intenta reconectarte.';
  }
  if (r.includes('401') || r.includes('403') || r.includes('unauthorized')) {
    return 'No se pudo verificar tu sesión con el servicio de voz. Escribe a soporte.';
  }

  return 'No se pudo conectar con Sous. Intenta de nuevo.';
}
