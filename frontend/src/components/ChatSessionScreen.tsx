/**
 * Pantalla de conversación con Sous: chat de texto o voz manos libres, según
 * `session.voiceMode`, con una sola confirmación para terminar.
 *
 * En móvil el chat ocupa toda la pantalla: sin la barra de la app queda altura
 * para leer la receta con el teclado abierto.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ChefHat } from 'lucide-react';
import type { CookingChatSession } from '../hooks/useCookingChatSession';
import { ChatBubble, ChatMessage } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { QuickReplies } from './QuickReplies';
import { VoiceSessionView } from './VoiceSessionView';
import { ConfirmDialog } from './ui/Dialog';

interface ChatSessionScreenProps {
  session: CookingChatSession;
  /** Encabezado del chat y de la pantalla de voz. */
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  backLabel: string;
  /** Qué se borra al terminar; cada módulo borra cosas distintas. */
  endDescription: string;
  /** Se llama después de `session.end()` para que el módulo limpie su estado. */
  onEnd?: () => void;
  /** Contenido fijo entre el encabezado y los mensajes. */
  extraTop?: ReactNode;
}

export const ChatSessionScreen = ({
  session, title, subtitle, onBack, backLabel, endDescription, onEnd, extraTop,
}: ChatSessionScreenProps) => {
  const { messages, isLoading, send, voiceView, voiceMode } = session;
  const [confirmEnd, setConfirmEnd] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, voiceMode]);

  const confirmDialog = confirmEnd && (
    <ConfirmDialog
      tone={voiceMode ? 'dark' : 'light'}
      title="¿Terminar la sesión?"
      description={endDescription}
      confirmLabel="Terminar"
      destructive
      onCancel={() => setConfirmEnd(false)}
      onConfirm={() => {
        setConfirmEnd(false);
        session.end();
        onEnd?.();
      }}
    />
  );

  if (voiceMode) {
    return (
      <>
        <VoiceSessionView
          title={title}
          voiceState={voiceView.voiceState}
          transcript={voiceView.transcript}
          currentChefText={voiceView.currentChefText}
          voiceError={voiceView.voiceError}
          silenceSeconds={voiceView.silenceSeconds}
          onRetry={session.startVoice}
          onWakeUp={voiceView.wakeUp}
          onTest={voiceView.test}
          onExitVoice={session.exitVoice}
          onRequestEnd={() => setConfirmEnd(true)}
        />
        {confirmDialog}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] h-dvh md:static md:z-auto md:h-full flex flex-col bg-neutral-50">
      <header className="flex items-center gap-1 pl-1 pr-3 pt-[env(safe-area-inset-top)] min-h-12 bg-white border-b border-neutral-100 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" aria-hidden />
        </button>
        <ChefHat className="text-orange-500 w-4 h-4 mr-1 flex-shrink-0" aria-hidden />
        <div className="flex-1 min-w-0 py-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-sm font-bold text-neutral-700 leading-tight truncate">{title}</h1>
            <span
              aria-hidden
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoading ? 'bg-yellow-400 motion-safe:animate-pulse' : 'bg-emerald-500'}`}
            />
          </div>
          {subtitle && (
            <p className="text-[10px] text-neutral-400 leading-tight truncate">{subtitle}</p>
          )}
        </div>
        {/* Píldora roja de terminar: va en el encabezado para no tapar mensajes ni la barra de entrada. */}
        <button
          type="button"
          onClick={() => setConfirmEnd(true)}
          className="min-h-11 flex-shrink-0 flex items-center my-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold px-3.5 rounded-full shadow-xl ring-2 ring-white transition-all"
        >
          Terminar sesión
        </button>
      </header>

      {extraTop}

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversación con Sous"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
      >
        {messages.length === 0 && !isLoading && (
          <div className="text-center mt-10 px-4">
            <div className="text-4xl mb-3" aria-hidden>👨‍🍳</div>
            <p className="text-sm font-medium text-neutral-600">
              Escríbele a Sous o toca el micrófono para hablar con las manos libres.
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} isChef={msg.agent === 'chef'}>
            <ChatMessage text={msg.text} isChef={msg.agent === 'chef'} />
          </ChatBubble>
        ))}
        <div ref={bottomRef} />
      </div>

      <QuickReplies onSend={send} loading={isLoading} />
      <ChatInputBar onSend={send} isLoading={isLoading} onStartVoice={session.startVoice} />

      {confirmDialog}
    </div>
  );
};
