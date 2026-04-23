/**
 * QuickReplies.tsx
 *
 * Barra de respuestas rápidas predefinidas para el chat del chef.
 * Aparece debajo del historial y permite al usuario enviar mensajes
 * frecuentes con un solo toque, sin necesidad de escribir.
 *
 * Las respuestas por defecto cubren las acciones más comunes durante
 * una sesión de cocina: confirmar paso completado, pedir el siguiente,
 * repetir una explicación y hacer una pregunta.
 */

/** Par etiqueta–mensaje de una respuesta rápida. */
interface QuickReply {
  /** Texto visible en el botón (incluye emoji). */
  label: string;
  /** Texto real enviado al chat cuando se pulsa el botón. */
  msg: string;
}

/** Respuestas rápidas que se muestran por defecto en todas las sesiones. */
const DEFAULT_REPLIES: QuickReply[] = [
  { label: '✅ ¡Listo!',        msg: '¡Listo! ¿Qué sigue?' },
  { label: '⏭️ Siguiente',      msg: 'Siguiente paso por favor' },
  { label: '🔁 Repite eso',     msg: 'Repite la explicación anterior, por favor' },
  { label: '❓ Tengo una duda', msg: 'Tengo una duda sobre lo que me dijiste' },
];

/** Props del componente QuickReplies. */
interface QuickRepliesProps {
  /** Función a llamar cuando el usuario pulsa un botón; recibe el `msg` de la respuesta. */
  onSend: (msg: string) => void;
  /** Si es `true`, los botones se deshabilitan mientras la IA está respondiendo. */
  loading?: boolean;
  /** Respuestas personalizadas que reemplazan las predeterminadas. */
  replies?: QuickReply[];
}

/**
 * Barra horizontal de botones de respuesta rápida para el chat.
 * Los botones se distribuyen en dos columnas y se deshabilitan durante
 * la carga para evitar envíos duplicados.
 */
export const QuickReplies = ({ onSend, loading = false, replies = DEFAULT_REPLIES }: QuickRepliesProps) => {
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2.5 flex-shrink-0 bg-white border-t border-neutral-100">
      {replies.map(({ label, msg }) => (
        <button
          key={label}
          disabled={loading}
          onClick={() => onSend(msg)}
          className={`flex-1 min-w-[calc(50%-4px)] px-3 py-2.5 border text-sm font-bold rounded-2xl transition-all text-center shadow-sm
            ${loading
              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 active:scale-95'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
