/**
 * ChatMessage.tsx
 *
 * Componente de renderizado de mensajes del chat. Soporta dos modos:
 *
 * - **Mensajes del usuario**: texto plano sin formato.
 * - **Mensajes del chef**: markdown ligero con soporte de negrita, cursiva,
 *   títulos (#, ##, ###), listas numeradas, viñetas y separadores.
 *
 * El parser está implementado sin dependencias externas para mantener
 * el bundle pequeño. Interpreta el subset de markdown que genera el
 * system prompt del chef (ver `services/gemini.ts`).
 *
 * Indicador de escritura:
 * Cuando `text` es una cadena vacía, muestra tres puntos animados en lugar
 * del mensaje, indicando que la respuesta está siendo generada (SSE streaming).
 */

import React from 'react';

// ── Parser de markdown ligero — sin dependencias externas ─────────────────────

/**
 * Convierte texto inline con marcadores `**bold**` y `*italic*` en nodos React.
 * Solo procesa un nivel de anidamiento; no soporta marcadores anidados.
 *
 * @param text - Línea de texto con posibles marcadores de negrita/cursiva.
 * @returns Array de nodos React: texto plano, `<strong>` o `<em>`.
 */
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/** Props del componente ChatMessage. */
interface ChatMessageProps {
  /** Contenido textual del mensaje. Cadena vacía activa el indicador de escritura. */
  text: string;
  /** Si es `true`, aplica el parser de markdown (mensajes del chef). */
  isChef: boolean;
}

/**
 * Renderiza un mensaje individual del chat.
 *
 * - Si `text` está vacío: muestra tres puntos pulsantes (indicador de generación).
 * - Si `isChef` es `false`: texto plano del usuario.
 * - Si `isChef` es `true`: mensaje del chef con markdown completo.
 */
export const ChatMessage = ({ text, isChef }: ChatMessageProps) => {
  // Indicador de escritura (placeholder vacío durante streaming SSE)
  if (!text) {
    return (
      <span className="flex gap-1 items-center h-4">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    );
  }

  // Mensaje del usuario — texto plano, sin formato
  if (!isChef) {
    return <span className="text-sm leading-relaxed">{text}</span>;
  }

  // ── Mensaje del chef — parser markdown línea por línea ────────────────────
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw  = lines[i];
    const line = raw.trim();

    // Línea vacía → separador de espacio pequeño
    if (!line) {
      nodes.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Separador horizontal (--- o ═══)
    if (/^[-═]{3,}$/.test(line)) {
      nodes.push(<hr key={i} className="border-neutral-200 my-2" />);
      i++;
      continue;
    }

    // Título nivel 3 (###)
    if (line.startsWith('### ')) {
      nodes.push(
        <p key={i} className="text-sm font-bold text-neutral-700 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(4))}
        </p>
      );
      i++;
      continue;
    }

    // Título nivel 2 (##)
    if (line.startsWith('## ')) {
      nodes.push(
        <p key={i} className="text-sm font-black text-neutral-800 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(3))}
        </p>
      );
      i++;
      continue;
    }

    // Título nivel 1 (#)
    if (line.startsWith('# ')) {
      nodes.push(
        <p key={i} className="text-sm font-black text-neutral-800 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(2))}
        </p>
      );
      i++;
      continue;
    }

    // Lista numerada (1. 2. 3. ...)
    if (/^\d+\.\s/.test(line)) {
      const listItems: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\.\s*/, '');
        listItems.push(
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-orange-500 font-bold flex-shrink-0 w-4">{num}.</span>
            <span>{parseInline(content)}</span>
          </li>
        );
        num++;
        i++;
      }
      nodes.push(
        <ul key={`ol-${i}`} className="space-y-1 my-1">{listItems}</ul>
      );
      continue;
    }

    // Lista con viñetas (- o •)
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
        const content = lines[i].trim().slice(2);
        listItems.push(
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-orange-400 flex-shrink-0 mt-0.5">•</span>
            <span>{parseInline(content)}</span>
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1">{listItems}</ul>
      );
      continue;
    }

    // Párrafo normal
    nodes.push(
      <p key={i} className="text-sm leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
};
