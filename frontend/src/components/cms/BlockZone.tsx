/**
 * BlockZone.tsx
 *
 * Zona de contenido dinámico del CMS. Renderiza una lista de bloques
 * (`CMSBlock[]`) y, en modo edición admin, permite añadir, reordenar
 * y eliminar bloques inline.
 *
 * Tipos de bloque soportados:
 * - `paragraph` — Párrafo de texto editable.
 * - `header`    — Encabezado con texto editable.
 * - `image`     — Imagen con URL y pie de foto editables.
 * - `checklist` — Lista de verificación con ítems editables.
 * - `quote`     — Cita destacada con texto editable.
 *
 * Los bloques se persisten en localStorage bajo `cms_blocks_{zoneKey}`.
 * En modo lectura, el componente renderiza los bloques sin controles de edición.
 */

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { ChevronUp, ChevronDown, Trash2, Type, Image as ImageIcon, LayoutList, MessageSquare } from 'lucide-react';
import { EditableText } from './EditableText';
import type { CMSBlock } from '../../types/cms';

/**
 * Genera un identificador único corto para los bloques
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * BlockZone actúa como un contenedor dinámico donde los administradores pueden
 * inyectar, reordenar y eliminar bloques de contenido estructural al vuelo.
 * Integra nativamente EditableText para que el interior de cada bloque nazca
 * editable directamente en la interfaz.
 * 
 * @param zoneId - Identificador único para el almacenamiento persistente de esta zona.
 */
export const BlockZone: React.FC<{ zoneId: string }> = ({ zoneId }) => {
    const { isEditMode } = useEditor();
    const [blocks, setBlocks] = useState<CMSBlock[]>([]);
    
    useEffect(() => {
        const stored = localStorage.getItem(`cms_zone_${zoneId}`);
        if (stored) {
            try { setBlocks(JSON.parse(stored)); } catch (e) { console.error('Error parsing BlockZone JSON', e); }
        }
    }, [zoneId]);

    const saveBlocks = (newBlocks: CMSBlock[]) => {
        setBlocks(newBlocks);
        localStorage.setItem(`cms_zone_${zoneId}`, JSON.stringify(newBlocks));
    };

    const addBlock = (type: string) => {
        const newBlock: CMSBlock = { id: generateId(), type, content: '' };
        saveBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        saveBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= blocks.length) return;
        const newBlocks = [...blocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + direction];
        newBlocks[index + direction] = temp;
        saveBlocks(newBlocks);
    };

    if (blocks.length === 0 && !isEditMode) return null;

    return (
        <div className={`w-full ${isEditMode ? 'p-6 border-2 border-dashed border-orange-300 rounded-2xl bg-orange-50/20 shadow-inner' : ''}`}>
            {isEditMode && blocks.length === 0 && (
                <div className="text-center text-orange-400 text-sm mb-4 font-bold flex items-center justify-center gap-2">
                    <span className="animate-pulse">✨</span> Zona de Arquitectura Dinámica: Inserta módulos extra aquí debajo
                </div>
            )}
            
            <div className="flex flex-col gap-4">
                {blocks.map((block, index) => (
                    <div key={block.id} className="relative group">
                        {isEditMode && (
                            <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 p-1 bg-white border border-neutral-200 rounded-lg shadow-md z-10">
                                <button onClick={() => moveBlock(index, -1)} className="p-1 text-neutral-400 hover:text-orange-500 transition-colors" title="Subir"><ChevronUp size={16}/></button>
                                <button onClick={() => moveBlock(index, 1)} className="p-1 text-neutral-400 hover:text-orange-500 transition-colors" title="Bajar"><ChevronDown size={16}/></button>
                                <div className="w-full h-px bg-neutral-200 my-1" />
                                <button onClick={() => removeBlock(block.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={16}/></button>
                            </div>
                        )}
                        <BlockRenderer block={block} />
                    </div>
                ))}
            </div>

            {isEditMode && (
                <div className="mt-8 flex justify-center sticky bottom-10 z-20">
                    <div className="bg-white px-5 py-3 rounded-full border-2 border-orange-200 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <span className="text-xs font-black text-orange-500 uppercase tracking-widest mr-2 flex items-center gap-2">
                            <span className="text-lg">+</span> Añadir Bloque
                        </span>
                        
                        <div className="flex gap-2 border-l border-neutral-200 pl-4">
                            <button onClick={() => addBlock('paragraph')} className="flex items-center gap-1 p-2 bg-neutral-50 text-neutral-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all font-bold text-xs" title="Párrafo">
                                <Type size={16} /> Texto
                            </button>
                            <button onClick={() => addBlock('image')} className="flex items-center gap-1 p-2 bg-neutral-50 text-neutral-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all font-bold text-xs" title="Imagen">
                                <ImageIcon size={16} /> Imagen
                            </button>
                            <button onClick={() => addBlock('accordion')} className="flex items-center gap-1 p-2 bg-neutral-50 text-neutral-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all font-bold text-xs" title="Acordeón">
                                <LayoutList size={16} /> Acordeón
                            </button>
                            <button onClick={() => addBlock('quote')} className="flex items-center gap-1 p-2 bg-neutral-50 text-neutral-600 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all font-bold text-xs" title="Nota / Destacado">
                                <MessageSquare size={16} /> Tip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * ImageBlock gestiona las URLs de imágenes, permitiendo que el administrador 
 * cambie la fuente (src) cuando está en isEditMode sin romper la vista del usuario final.
 */
const ImageBlock = ({ blockId }: { blockId: string }) => {
    const { isEditMode } = useEditor();
    const storedURL = localStorage.getItem(`cms_block_${blockId}_content`) || "https://images.unsplash.com/photo-1556910103-1c02745a872e?auto=format&fit=crop&q=80&w=1000";
    
    // Estado local veloz para actualización.
    const [url, setURL] = useState(storedURL);

    return (
        <div className="my-6 group relative">
            <img src={url} alt="Bloque Media Dinámico" className="w-full rounded-2xl shadow-sm object-cover max-h-96" />
            
            {isEditMode && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl px-6 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white p-4 rounded-xl shadow-2xl flex flex-col gap-3">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">🔗 Editar origen de la imagen</span>
                        <input 
                            className="w-full text-sm bg-neutral-100 rounded-lg px-3 py-2 outline-none text-neutral-700 font-medium font-mono"
                            value={url}
                            onChange={e => setURL(e.target.value)}
                            onBlur={() => localStorage.setItem(`cms_block_${blockId}_content`, url)}
                            onClick={e => e.stopPropagation()}
                            placeholder="Pega la URL aquí..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Enrutador de Renderizado para bloques soportados.
 * Construido internamente usando <EditableText> para edición transparente.
 */
const BlockRenderer: React.FC<{ block: CMSBlock }> = ({ block }) => {
    switch (block.type) {
        case 'paragraph':
            return (
                <p className="text-neutral-700 leading-relaxed text-base my-4 text-justify px-2">
                    <EditableText elementKey={`block_${block.id}_content`} defaultText="Comienza a escribir tu texto aquí..." as="span" />
                </p>
            );
        case 'quote':
            return (
                <blockquote className="border-l-4 border-orange-500 bg-orange-50 p-5 w-full rounded-r-xl my-4 shadow-sm border-r border-t border-b border-orange-100">
                    <p className="text-orange-900 italic font-medium leading-relaxed">
                        <EditableText elementKey={`block_${block.id}_content`} defaultText="Añade un tip destacado o un consejo importante del chef para los usuarios." as="span" />
                    </p>
                </blockquote>
            );
        case 'accordion':
            return (
                <details className="group border border-neutral-200 rounded-xl overflow-hidden my-4 bg-white shadow-sm hover:border-orange-200 transition-all w-full">
                    <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-4 hover:bg-neutral-50 transition-colors text-neutral-800">
                        <span className="flex items-center gap-3">
                            <span className="bg-neutral-100 p-1.5 rounded-lg">
                                <EditableText elementKey={`block_${block.id}_emoji`} defaultText="ℹ️" as="span" />
                            </span>
                            <EditableText elementKey={`block_${block.id}_title`} defaultText="Título del Acordeón Desplegable" as="span" />
                        </span>
                        <ChevronDown className="transition-transform duration-300 group-open:rotate-180 w-5 h-5 text-neutral-400" />
                    </summary>
                    <div className="p-5 bg-neutral-50/50 border-t border-neutral-100 text-neutral-600 leading-relaxed text-sm">
                        <EditableText elementKey={`block_${block.id}_content`} defaultText="Contenido detallado y oculto del acordeón. Haz clic aquí para comenzar a editar este apartado." as="span" />
                    </div>
                </details>
            );
        case 'image':
            return <ImageBlock blockId={block.id} />;
            
        default:
            return <div className="p-3 text-red-500 text-sm font-bold bg-red-50 rounded-lg">⚠️ Fallo de CMS: Bloque estructural no soportado ({block.type})</div>;
    }
};
