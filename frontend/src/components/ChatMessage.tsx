import React from 'react';

// ── Parser de markdown ligero — sin dependencias externas ─────────────────────

/** Convierte **texto** en <strong> y *texto* en <em> dentro de una línea */
function parseInline(text: string): React.ReactNode[] {
  // Divide por **bold** y *italic*
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

interface ChatMessageProps {
  text: string;
  isChef: boolean;
}

export const ChatMessage = ({ text, isChef }: ChatMessageProps) => {
  // Indicador de escritura
  if (!text) {
    return (
      <span className="flex gap-1 items-center h-4">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    );
  }

  // Mensajes del usuario — texto plano
  if (!isChef) {
    return <span className="text-sm leading-relaxed">{text}</span>;
  }

  // Mensajes del chef — renderizado markdown
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    // Línea vacía → espacio pequeño
    if (!line) {
      nodes.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Separador horizontal --- o ═══
    if (/^[-═]{3,}$/.test(line)) {
      nodes.push(<hr key={i} className="border-neutral-200 my-2" />);
      i++;
      continue;
    }

    // Títulos ### ## #
    if (line.startsWith('### ')) {
      nodes.push(
        <p key={i} className="text-sm font-bold text-neutral-700 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(4))}
        </p>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <p key={i} className="text-sm font-black text-neutral-800 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(3))}
        </p>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <p key={i} className="text-sm font-black text-neutral-800 mt-2 mb-0.5 first:mt-0">
          {parseInline(line.slice(2))}
        </p>
      );
      i++;
      continue;
    }

    // Lista numerada  1. 2. 3.
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

    // Lista con viñetas - o •
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
