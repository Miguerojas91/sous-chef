/**
 * Respuestas rápidas del chat: los mensajes más comunes durante una receta,
 * a un toque. Van en una sola fila con scroll horizontal para no quitarle
 * altura a la conversación en pantallas chicas.
 */

interface QuickReply {
  label: string;
  /** Lo que realmente se envía al chat. */
  msg: string;
}

const DEFAULT_REPLIES: QuickReply[] = [
  { label: 'Listo',          msg: 'Listo. ¿Qué sigue?' },
  { label: 'Siguiente',      msg: 'Siguiente paso, por favor' },
  { label: 'Repite eso',     msg: 'Repite la explicación anterior, por favor' },
  { label: 'Tengo una duda', msg: 'Tengo una duda sobre lo que me dijiste' },
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
      className="flex gap-2 px-3 py-2 flex-shrink-0 bg-white border-t border-neutral-200 overflow-x-auto overscroll-x-contain snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {replies.map(({ label, msg }) => (
        <button
          key={label}
          type="button"
          disabled={loading}
          onClick={() => onSend(msg)}
          className="flex-none snap-start min-h-11 px-4 border text-sm font-semibold rounded-full whitespace-nowrap transition-colors bg-brand-50 border-brand-200 text-brand-800 hover:bg-brand-100 disabled:bg-neutral-100 disabled:border-neutral-200 disabled:text-neutral-500"
        >
          {label}
        </button>
      ))}
    </div>
  );
};
