interface QuickReply {
  label: string;
  msg: string;
}

const DEFAULT_REPLIES: QuickReply[] = [
  { label: '✅ ¡Listo!',        msg: '¡Listo! ¿Qué sigue?' },
  { label: '⏭️ Siguiente',      msg: 'Siguiente paso por favor' },
  { label: '🔁 Repite eso',     msg: 'Repite la explicación anterior, por favor' },
  { label: '❓ Tengo una duda', msg: 'Tengo una duda sobre lo que me dijiste' },
];

interface QuickRepliesProps {
  onSend: (msg: string) => void;
  loading?: boolean;
  replies?: QuickReply[];
}

export const QuickReplies = ({ onSend, loading = false, replies = DEFAULT_REPLIES }: QuickRepliesProps) => {
  return (
    <div className="flex flex-wrap gap-2 px-3 py-2.5 flex-shrink-0 bg-white border-t border-neutral-100">
      {replies.map(({ label, msg }) => (
        <button
          key={label}
          onClick={() => !loading && onSend(msg)}
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
