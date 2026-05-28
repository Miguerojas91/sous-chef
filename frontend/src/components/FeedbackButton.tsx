/**
 * FeedbackButton.tsx
 *
 * Botón flotante discreto para que los testers de la beta puedan reportar
 * problemas directamente al equipo. Abre WhatsApp con un mensaje pre-llenado
 * que incluye contexto técnico básico (página actual, user, versión).
 *
 * Configuración:
 *  - `VITE_FEEDBACK_WHATSAPP` — número en formato internacional sin `+`
 *    (ej. `573001112233`). Si no está, el botón no se renderiza.
 */
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { getUser } from '../utils/auth';
import { track, Events } from '../utils/analytics';

const WHATSAPP = ((import.meta.env.VITE_FEEDBACK_WHATSAPP as string | undefined) ?? '').replace(/\D/g, '');

function buildMessage(): string {
  const u = getUser();
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '';
  const lines = [
    '👋 Hola, soy beta tester de Sous Chef y quiero reportar algo.',
    '',
    '— Cuéntale el problema o sugerencia aquí —',
    '',
    '─── Info técnica (no la borres) ───',
    `Usuario: ${u?.username ?? '(no logueado)'}`,
    `País:    ${u?.country ?? '(no configurado)'}`,
    `Premium: ${u?.isPremium ? 'sí' : 'no'}`,
    `Pantalla: ${path}`,
    `Hora:    ${new Date().toLocaleString()}`,
    `Device:  ${ua}`,
  ];
  return encodeURIComponent(lines.join('\n'));
}

export const FeedbackButton = () => {
  const [expanded, setExpanded] = useState(false);

  if (!WHATSAPP) return null; // no configurado → no renderizar

  const handleOpen = () => {
    track(Events.FeedbackOpened);
    setExpanded(false);
    // Mensaje generado en click (siempre fresco con la pantalla actual)
    const url = `https://wa.me/${WHATSAPP}?text=${buildMessage()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-[150] pointer-events-none">
      {expanded ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-3 pr-4 pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
          >
            <MessageCircle size={16} /> Reportar por WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Cerrar"
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Reportar problema"
          title="Reportar problema o sugerencia"
          className="w-11 h-11 rounded-full bg-white shadow-lg border border-emerald-200 hover:border-emerald-400 hover:scale-105 transition-all flex items-center justify-center pointer-events-auto opacity-60 hover:opacity-100"
        >
          <MessageCircle size={18} className="text-emerald-600" />
        </button>
      )}
    </div>
  );
};
