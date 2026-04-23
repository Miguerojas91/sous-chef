/**
 * friendlyError.ts
 *
 * Utilidad para convertir mensajes de error técnicos de la API de voz
 * en textos comprensibles para el usuario final.
 */

/**
 * Transforma un mensaje de error técnico en un texto amigable para mostrar en la UI.
 *
 * @param raw - Mensaje de error original (puede contener códigos HTTP, nombres de excepción, etc.)
 * @returns Mensaje legible en español, listo para mostrar al usuario.
 */
export function friendlyVoiceError(raw: string): string {
  const r = raw.toLowerCase();

  if (r.includes('websocket') || r.includes('connection') || r.includes('network') || r.includes('failed to fetch')) {
    return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  }
  if (r.includes('microphone') || r.includes('permission') || r.includes('notallowederror')) {
    return 'No se pudo acceder al micrófono. Verifica que hayas dado permiso en el navegador.';
  }
  if (r.includes('quota') || r.includes('429') || r.includes('rate limit')) {
    return 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.';
  }
  if (r.includes('500') || r.includes('internal')) {
    return 'El servidor tuvo un problema. Intenta reconectarte.';
  }
  if (r.includes('401') || r.includes('403') || r.includes('unauthorized')) {
    return 'Error de autenticación con el servicio. Contacta soporte.';
  }

  return 'No se pudo conectar con Sous. Intenta de nuevo.';
}
