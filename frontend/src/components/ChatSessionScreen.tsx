/**
 * Pantalla de conversación con Sous: chat de texto o voz manos libres, según
 * `session.voiceMode`, con una sola confirmación para terminar.
 *
 * En móvil el chat ocupa toda la pantalla: sin la barra de la app queda altura
 * para leer la receta con el teclado abierto.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CookingChatSession } from '../hooks/useCookingChatSession';
import { ChatBubble, ChatMessage } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { QuickReplies } from './QuickReplies';
import { VoiceSessionView } from './VoiceSessionView';
import { ScreenHeader } from './ui/ScreenHeader';
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
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        backLabel={backLabel}
        className="pt-[env(safe-area-inset-top)]"
        actions={
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="min-h-11 px-3 rounded-control text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Terminar
          </button>
        }
      />

      {extraTop}

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversación con Sous"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
      >
        {messages.length === 0 && !isLoading && (
          <p className="text-center mt-10 px-4 text-sm text-neutral-600">
            Escríbele a Sous o toca el micrófono para hablar con las manos libres.
          </p>
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
