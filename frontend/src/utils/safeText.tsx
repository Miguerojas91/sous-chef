/**
 * Negrita sin `dangerouslySetInnerHTML`, para evitar XSS. Acepta `**negrita**`
 * y los antiguos `<strong>`/`<b>`; todo lo demás es texto que React escapa.
 */
import React from 'react';

function renderSafeText(input: string): React.ReactNode[] {
  if (!input) return [];

  const normalized = input
    .replace(/<\s*strong\s*>/gi, '**')
    .replace(/<\s*\/\s*strong\s*>/gi, '**')
    .replace(/<\s*b\s*>/gi, '**')
    .replace(/<\s*\/\s*b\s*>/gi, '**');

  // Otros tags no se eliminan (se perderían < y > legítimos): React los escapa como texto.
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Componente envoltorio: `<SafeText text="Corta en **brunoise**" />`. */
export const SafeText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={className}>{renderSafeText(text)}</span>
);
