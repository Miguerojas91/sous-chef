/**
 * Respuestas rápidas del chat: los mensajes más comunes durante una receta,
 * a un toque. Van en una rejilla de dos columnas.
 */

interface QuickReply {
  label: string;
  /** Decorativo; el lector de pantalla solo lee `label`. */
  emoji?: string;
  /** Lo que realmente se envía al chat. */
  msg: string;
}

const DEFAULT_REPLIES: QuickReply[] = [
  { emoji: '✅', label: '¡Listo!',        msg: 'Listo. ¿Qué sigue?' },
  { emoji: '⏭️', label: 'Siguiente',      msg: 'Siguiente paso, por favor' },
  { emoji: '🔁', label: 'Repite eso',     msg: 'Repite la explicación anterior, por favor' },
  { emoji: '❓', label: 'Tengo una duda', msg: 'Tengo una duda sobre lo que me dijiste' },
];

interface QuickRepliesProps {
  onSend: (msg: string) => void;
  /** Deshabilita los botones mientras Sous responde, para no duplicar envíos. */
  loading?: boolean;
  replies?: QuickReply[];
}

export const QuickReplies = ({ onSend, loading = false, replies = DEFAULT_REPLIES }: QuickRepliesProps) => {
  return (
    <div
      role="group"
      aria-label="Respuestas rápidas"
      className="flex flex-wrap gap-2 px-3 py-2.5 flex-shrink-0 bg-white border-t border-neutral-100"
    >
      {replies.map(({ label, emoji, msg }) => (
        <button
          key={label}
          type="button"
          disabled={loading}
          onClick={() => onSend(msg)}
          className={`flex-1 min-w-[calc(50%-4px)] min-h-11 px-3 py-2.5 border text-sm font-bold rounded-2xl transition-all text-center shadow-sm ${
            loading
              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 active:scale-95'
          }`}
        >
          {emoji && <span aria-hidden>{emoji} </span>}
          {label}
        </button>
      ))}
    </div>
  );
};
