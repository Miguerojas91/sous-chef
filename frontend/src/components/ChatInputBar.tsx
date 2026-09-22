/**
 * Barra de entrada del chat: micrófono, campo de texto y enviar.
 *
 * El campo NO se deshabilita mientras Sous responde. Deshabilitarlo cierra el
 * teclado en móvil y obliga a tocar el campo otra vez entre paso y paso de la
 * receta; solo se bloquea el envío.
 *
 * Los botones redondos se ven de 28px pero el área táctil es de 44px: el
 * margen negativo evita que la barra crezca.
 */
import { useState } from 'react';
import { Mic, Send } from 'lucide-react';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  /** Si se omite, no se muestra el botón de micrófono. */
  onStartVoice?: () => void;
  placeholder?: string;
}

const hitArea = 'group w-11 h-11 -my-2 flex-shrink-0 flex items-center justify-center rounded-full outline-none';
const circle = 'w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors group-focus-visible:ring-2 group-focus-visible:ring-offset-2';

export const ChatInputBar = ({
  onSend, isLoading, onStartVoice, placeholder = 'Escribe tu pregunta',
}: ChatInputBarProps) => {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !isLoading;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex-shrink-0 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] bg-white border-t border-neutral-100">
      <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-1 py-1.5 focus-within:border-orange-300">
        {onStartVoice && (
          <button
            type="button"
            onClick={onStartVoice}
            aria-label="Hablar con Sous (manos libres)"
            title="Hablar con Sous (manos libres)"
            className={hitArea}
          >
            <span className={`${circle} bg-violet-600 group-hover:bg-violet-700 group-focus-visible:ring-violet-400`}>
              <Mic className="w-4 h-4" aria-hidden />
            </span>
          </button>
        )}
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          enterKeyHint="send"
          aria-label="Escribe tu pregunta a Sous"
          placeholder={isLoading ? 'Sous está respondiendo…' : placeholder}
          className={`flex-1 min-w-0 min-h-7 bg-transparent border-none outline-none text-base md:text-sm text-neutral-700 placeholder:text-neutral-400 ${onStartVoice ? '' : 'pl-2'}`}
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Enviar"
          className={`${hitArea} disabled:cursor-not-allowed`}
        >
          <span className={`${circle} bg-orange-500 group-hover:bg-orange-600 group-disabled:opacity-40group-focus-visible:ring-orange-400`}>
            <Send className="w-4 h-4" aria-hidden />
          </span>
        </button>
      </div>
    </div>
  );
};
