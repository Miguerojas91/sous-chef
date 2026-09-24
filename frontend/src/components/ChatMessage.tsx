/**
 * Mensajes del chat. Los del usuario van en texto plano; los del chef pasan
 * por un parser de markdown ligero (negrita, cursiva, títulos, listas,
 * separadores y tablas simples) escrito a mano para no sumar dependencias.
 * Cubre el subconjunto que pide el system prompt de `services/gemini.ts`.
 *
 * Un `text` vacío es el placeholder del streaming y se muestra como
 * "Sous está escribiendo".
 */

import React from 'react';
import type { ReactNode } from 'react';

function parseInline(text: string): ReactNode[] {
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

const TABLE_SEPARATOR = /^\|?[\s:|-]+\|?$/;
const isTableRow = (line: string) => line.startsWith('|') && line.endsWith('|') && line.length > 2;

interface ChatMessageProps {
  text: string;
  isChef: boolean;
}

export const ChatMessage = ({ text, isChef }: ChatMessageProps) => {
  if (!text) {
    return (
      <span role="status" className="flex gap-1 items-center h-4">
        <span className="sr-only">Sous está escribiendo</span>
        <span aria-hidden className="w-1.5 h-1.5 bg-neutral-400 rounded-full motion-safe:animate-bounce [animation-delay:0ms]" />
        <span aria-hidden className="w-1.5 h-1.5 bg-neutral-400 rounded-full motion-safe:animate-bounce [animation-delay:150ms]" />
        <span aria-hidden className="w-1.5 h-1.5 bg-neutral-400 rounded-full motion-safe:animate-bounce [animation-delay:300ms]" />
      </span>
    );
  }

  if (!isChef) {
    return <span className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</span>;
  }

  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      nodes.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    if (/^[-═]{3,}$/.test(line)) {
      nodes.push(<hr key={i} className="border-neutral-200 my-2" />);
      i++;
      continue;
    }

    // Las tablas markdown no caben en 360px: cada fila pasa a una línea
    // "celda · celda" y la fila separadora se descarta.
    if (isTableRow(line)) {
      const rows: ReactNode[] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        const row = lines[i].trim();
        if (!TABLE_SEPARATOR.test(row)) {
          const cells = row.slice(1, -1).split('|').map(c => c.trim()).filter(Boolean);
          rows.push(
            <li key={i} className="text-[15px] leading-relaxed">
              {cells.map((c, ci) => (
                <React.Fragment key={ci}>
                  {ci > 0 && <span className="text-orange-400" aria-hidden> · </span>}
                  {parseInline(c)}
                </React.Fragment>
              ))}
            </li>,
          );
        }
        i++;
      }
      nodes.push(<ul key={`tb-${i}`} className="space-y-1 my-1">{rows}</ul>);
      continue;
    }

    if (line.startsWith('### ')) {
      nodes.push(
        <p key={i} className="text-sm font-bold text-neutral-700 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(4))}
        </p>,
      );
      i++;
      continue;
    }

    if (line.startsWith('## ') || line.startsWith('# ')) {
      nodes.push(
        <p key={i} className="text-sm font-black text-neutral-800 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.replace(/^#{1,2}\s/, ''))}
        </p>,
      );
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const listItems: ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\.\s*/, '');
        listItems.push(
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
            <span className="text-orange-500 font-bold flex-shrink-0 min-w-[1rem]" aria-hidden>{num}.</span>
            <span className="min-w-0 flex-1">{parseInline(content)}</span>
          </li>,
        );
        num++;
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="space-y-1 my-1">{listItems}</ol>);
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      const listItems: ReactNode[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
        const content = lines[i].trim().slice(2);
        listItems.push(
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
            <span className="text-orange-400 flex-shrink-0 mt-0.5" aria-hidden>•</span>
            <span className="min-w-0 flex-1">{parseInline(content)}</span>
          </li>,
        );
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="space-y-0.5 my-1">{listItems}</ul>);
      continue;
    }

    nodes.push(
      <p key={i} className="text-[15px] leading-relaxed">
        {parseInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
};

interface ChatBubbleProps {
  isChef: boolean;
  children: ReactNode;
}

/**
 * Burbuja de mensaje. `[overflow-wrap:anywhere]` evita que una URL o una
 * palabra larga ensanche la burbuja y abra scroll horizontal en móvil.
 */
export const ChatBubble = ({ isChef, children }: ChatBubbleProps) => (
  <div className={`flex ${isChef ? 'justify-start' : 'justify-end'}`}>
    <div
      className={`max-w-[85%] min-w-0 px-3.5 py-3 [overflow-wrap:anywhere] ${
        isChef
          ? 'bg-white border-2 border-neutral-200 text-ink rounded-[20px_20px_20px_6px] shadow-[0_3px_0_theme(colors.neutral.200)] font-semibold'
          : 'bg-orange-600 text-white rounded-[20px_20px_6px_20px] shadow-[0_3px_0_theme(colors.orange.800)] font-bold'
      }`}
    >
      {isChef ? null : <span className="sr-only">Tú: </span>}
      {children}
    </div>
  </div>
);
