/**
 * utils/safeText.tsx
 *
 * Renderiza texto con marcado ligero (negrita) SIN usar
 * `dangerouslySetInnerHTML`. Acepta dos sintaxis equivalentes:
 *   - Markdown: `**negrita**`
 *   - HTML legacy: `<strong>negrita</strong>` y `<b>negrita</b>`
 *
 * Todo lo demás se trata como texto plano (escapado por React). Esto elimina
 * el vector XSS de inyectar HTML arbitrario, manteniendo el formato visual.
 */
import React from 'react';

/** Normaliza `<strong>`/`<b>` a `**...**` y luego parsea inline. */
export function renderSafeText(input: string): React.ReactNode[] {
  if (!input) return [];

  // 1. Convertir tags de negrita HTML a markdown (case-insensitive).
  const normalized = input
    .replace(/<\s*strong\s*>/gi, '**')
    .replace(/<\s*\/\s*strong\s*>/gi, '**')
    .replace(/<\s*b\s*>/gi, '**')
    .replace(/<\s*\/\s*b\s*>/gi, '**');

  // 2. Cualquier OTRO tag HTML restante se neutraliza mostrándolo como texto
  //    (React ya escapa, pero quitamos los `<...>` sobrantes para limpieza).
  //    No removemos para no perder contenido legítimo con < / >; React lo
  //    escapará de todos modos al renderizar como string.

  // 3. Parsear **bold** a nodos React.
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
