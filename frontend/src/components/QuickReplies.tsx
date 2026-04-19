interface QuickReply {
  label: string;
  msg: string;
}

const DEFAULT_REPLIES: QuickReply[] = [
  { label: '✅ ¡Listo!',           msg: '¡Listo! ¿Qué sigue?' },
  { label: '⏭️ Siguiente paso',    msg: 'Siguiente paso por favor' },
  { label: '🔁 Repite eso',        msg: 'Repite la explicación anterior, por favor' },
  { label: '❓ Tengo una duda',    msg: 'Tengo una duda sobre lo que me dijiste' },
];

interface QuickRepliesProps {
  onSend: (msg: string) => void;
  disabled?: boolean;
  replies?: QuickReply[];
}

export const QuickReplies = ({ onSend, disabled = false, replies = DEFAULT_REPLIES }: QuickRepliesProps) => {
  if (disabled) return null;

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0 scrollbar-none bg-white border-t border-neutral-100">
      {replies.map(({ label, msg }) => (
        <button
          key={label}
          onClick={() => onSend(msg)}
          className="flex-shrink-0 px-3.5 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-full hover:bg-orange-100 active:scale-95 transition-all shadow-sm whitespace-nowrap"
        >
          {label}
        </button>
      ))}
    </div>
  );
};
