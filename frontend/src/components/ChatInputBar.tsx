/**
 * Barra de entrada del chat: micrófono, campo de texto y enviar.
 *
 * El campo NO se deshabilita mientras Sous responde. Deshabilitarlo cierra el
 * teclado en móvil y obliga a tocar el campo otra vez entre paso y paso de la
 * receta; solo se bloquea el envío.
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
    <div className="flex-shrink-0 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-white border-t border-neutral-200">
      <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-300 rounded-card pl-1 pr-1 focus-within:ring-2 focus-within:ring-brand-700 focus-within:border-transparent">
        {onStartVoice && (
          <button
            type="button"
            onClick={onStartVoice}
            aria-label="Hablar con Sous (manos libres)"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control text-neutral-800 hover:bg-neutral-200 transition-colors"
          >
            <Mic size={20} aria-hidden />
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
          className={`flex-1 min-w-0 min-h-11 bg-transparent border-none outline-none text-base md:text-sm text-neutral-900 placeholder:text-neutral-500 ${onStartVoice ? '' : 'pl-3'}`}
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Enviar"
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control bg-brand-700 hover:bg-brand-800 text-white transition-colors disabled:bg-neutral-300 disabled:text-neutral-600"
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
};
