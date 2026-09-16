/**
 * Texto editable en línea por el admin. Fuera del modo edición muestra el
 * texto guardado en `cms_text_{elementKey}` o `defaultText`. `elementKey` es
 * la clave de almacenamiento: no la cambies en textos existentes.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

interface EditableTextProps {
   elementKey: string;
   defaultText: string;
   as?: React.ElementType;
   className?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
    elementKey,
    defaultText,
    as: Tag = 'span',
    className = ''
}) => {
   const { isEditMode } = useEditor();

   const [text, setText] = useState(() => {
       const saved = localStorage.getItem(`cms_text_${elementKey}`);
       return saved || defaultText;
   });

   const [customColor, setCustomColor] = useState(() => {
       return localStorage.getItem(`cms_color_${elementKey}`) || '';
   });

   const [popupPos, setPopupPos] = useState<{x: number, y: number} | null>(null);

   useEffect(() => {
       if (!popupPos) return;
       const close = () => setPopupPos(null);
       window.addEventListener('click', close);
       return () => window.removeEventListener('click', close);
   }, [popupPos]);

   // Estilo inline para que el color elegido gane a cualquier clase de Tailwind.
   const textStyle = {
        color: customColor ? customColor : undefined,
   };

   const renderTag = (isEditing: boolean) => {
       return (
          <Tag
             contentEditable={isEditing}
             suppressContentEditableWarning={isEditing}
             style={textStyle}
             onClick={isEditing ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
             onBlur={isEditing ? (e: React.FocusEvent<HTMLElement>) => {
                const newText = e.currentTarget.textContent || '';
                setText(newText);
                localStorage.setItem(`cms_text_${elementKey}`, newText);
             } : undefined}
             className={`${className} ${isEditing ? 'border border-dashed border-brand-400 bg-brand-50 cursor-text px-0.5 rounded transition-colors hover:bg-brand-100 min-h-[1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700' : ''}`}
          >
             {text}
          </Tag>
       );
   };

   if (isEditMode) {
      return (
         <div className="relative group/editable inline-block">
            {renderTag(true)}

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPopupPos({ x: rect.left, y: rect.bottom + 5 });
                }}
                className="absolute -top-6 -right-5 w-11 h-11 flex items-center justify-center opacity-0 group-hover/editable:opacity-100 focus-visible:opacity-100 transition-opacity z-[60] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                aria-label="Cambiar color del texto"
            >
                <span className="p-1 bg-white border border-neutral-200 rounded-full text-brand-700">
                    <Palette size={12} aria-hidden />
                </span>
            </button>

            {popupPos && createPortal(
                <div
                    role="dialog"
                    aria-label="Color del texto"
                    className="fixed z-[99999] bg-white p-3 rounded-card shadow-overlay border border-neutral-200 motion-safe:animate-fade-in"
                    style={{ left: Math.min(window.innerWidth - 200, popupPos.x), top: popupPos.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        <span className="text-sm font-semibold text-neutral-600 text-center">Color del texto</span>

                        <div className="flex items-center gap-3 justify-center">
                            <input
                                type="color"
                                aria-label="Elegir color"
                                value={customColor || '#000000'}
                                className="w-11 h-11 rounded-control cursor-pointer border-0 p-0 overflow-hidden"
                                onChange={e => {
                                    const val = e.target.value;
                                    setCustomColor(val);
                                    localStorage.setItem(`cms_color_${elementKey}`, val);
                                }}
                            />

                            <div className="flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomColor('');
                                        localStorage.removeItem(`cms_color_${elementKey}`);
                                        setPopupPos(null);
                                    }}
                                    className="min-h-11 px-2 text-xs font-semibold text-neutral-600 hover:text-danger rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                >
                                    Quitar color
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPopupPos(null)}
                                    className="min-h-11 px-2 text-xs font-semibold text-brand-700 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                >
                                    Listo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
         </div>
      );
   }

   return renderTag(false);
};
