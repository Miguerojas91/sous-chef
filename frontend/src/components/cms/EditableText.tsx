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

   const textStyle = {
        color: customColor ? customColor : undefined,
   };

   // Para asegurar que el color gane a cualquier clase de Tailwind, 
   // construimos un style object limpio.
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
             className={`${className} ${isEditing ? 'border border-dashed border-orange-400/50 bg-orange-400/5 outline-none cursor-text px-0.5 rounded transition-all hover:bg-orange-400/10 min-h-[1em]' : ''}`}
          >
             {text}
          </Tag>
       );
   };

   if (isEditMode) {
      return (
         <div className="relative group/editable inline-block">
            {renderTag(true)}

            {/* Visible Trigger for Color Picker */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPopupPos({ x: rect.left, y: rect.bottom + 5 });
                }}
                className="absolute -top-4 -right-2 p-1 bg-white border border-orange-200 rounded-full shadow-md text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/editable:opacity-100 z-[60]"
                title="Cambiar color del texto"
            >
                <Palette size={12} />
            </button>
            
            {popupPos && createPortal(
                <div 
                    className="fixed z-[99999] bg-white p-3 rounded-xl shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200"
                    style={{ left: Math.min(window.innerWidth - 200, popupPos.x), top: popupPos.y }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center">Color del Texto</span>
                        
                        <div className="flex items-center gap-3 justify-center">
                            <input 
                                type="color" 
                                value={customColor || '#000000'}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                onChange={e => {
                                    const val = e.target.value;
                                    setCustomColor(val);
                                    localStorage.setItem(`cms_color_${elementKey}`, val);
                                }}
                            />
                            
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => {
                                        setCustomColor('');
                                        localStorage.removeItem(`cms_color_${elementKey}`);
                                        setPopupPos(null);
                                    }}
                                    className="text-[10px] font-bold text-neutral-400 hover:text-red-500 uppercase p-1"
                                >
                                    Limpiar
                                </button>
                                <button 
                                    onClick={() => setPopupPos(null)}
                                    className="text-[10px] font-bold text-orange-500 uppercase p-1"
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
