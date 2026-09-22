/**
 * Botón flotante para que los testers de la beta reporten problemas por
 * WhatsApp, con un mensaje que ya trae la pantalla, el usuario y el dispositivo.
 *
 * `VITE_FEEDBACK_WHATSAPP`: número internacional sin `+` (ej. `573001112233`).
 * Si no está configurado, el botón no se muestra.
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { getUser } from '../utils/auth';
import { track, Events } from '../utils/analytics';

const WHATSAPP = ((import.meta.env.VITE_FEEDBACK_WHATSAPP as string | undefined) ?? '').replace(/\D/g, '');

// En estas pantallas hay un input de chat abajo a la derecha: el botón flotante
// quedaría encima de "Enviar" y el toque abriría WhatsApp en lugar de enviar.
const CHAT_ROUTES = ['/cocinar', '/milprep', '/sabores'];

function buildMessage(): string {
  const u = getUser();
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '';
  const lines = [
    '👋 Hola, soy beta tester de Sous Chef y quiero reportar algo.',
    '',
    '(Escribe aquí qué pasó)',
    '',
    'Info técnica (no la borres):',
    `Usuario: ${u?.username ?? '(sin sesión)'}`,
    `País: ${u?.country ?? '(sin configurar)'}`,
    `Premium: ${u?.isPremium ? 'sí' : 'no'}`,
    `Pantalla: ${path}`,
    `Hora: ${new Date().toLocaleString()}`,
    `Dispositivo: ${ua}`,
  ];
  return encodeURIComponent(lines.join('\n'));
}

export const FeedbackButton = () => {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();

  if (!WHATSAPP) return null;
  if (CHAT_ROUTES.some(r => pathname.startsWith(r))) return null;

  const handleOpen = () => {
    track(Events.FeedbackOpened);
    setExpanded(false);
    // Se arma al tocar para que "Pantalla" sea la actual.
    const url = `https://wa.me/${WHATSAPP}?text=${buildMessage()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 right-4 z-40 pointer-events-none">
      {expanded ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-1.5 pl-2 pointer-events-auto flex items-center gap-1 max-w-[calc(100vw-2rem)] animate-fade-in motion-reduce:animate-none">
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-2 min-h-11 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
          >
            <MessageCircle size={16} aria-hidden /> Reportar por WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Cerrar"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Reportar un problema"
          title="Reportar un problema o sugerencia"
          className="w-11 h-11 rounded-full bg-white shadow-lg border border-emerald-200 hover:border-emerald-400 hover:scale-105 transition-all flex items-center justify-center pointer-events-auto opacity-60 hover:opacity-100 focus-visible:opacity-100"
        >
          <MessageCircle size={18} className="text-emerald-600" aria-hidden />
        </button>
      )}
    </div>
  );
};
