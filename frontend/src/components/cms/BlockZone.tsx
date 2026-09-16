/**
 * Zona de bloques del CMS. En modo edición el admin añade, reordena y borra
 * bloques; se guardan en localStorage bajo `cms_zone_{zoneId}`.
 */

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { ChevronUp, ChevronDown, Trash2, Type, Image as ImageIcon, LayoutList, MessageSquare, Plus } from 'lucide-react';
import { EditableText } from './EditableText';
import type { CMSBlock } from '../../types/cms';

const generateId = () => Math.random().toString(36).substr(2, 9);

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700';
const ICON_BTN = `w-11 h-11 flex items-center justify-center rounded-control text-neutral-600 transition-colors ${FOCUS_RING}`;
const ADD_BTN = `min-h-11 flex items-center gap-1.5 px-3 bg-neutral-50 text-neutral-800 rounded-control hover:bg-brand-50 hover:text-brand-800 transition-colors font-semibold text-xs ${FOCUS_RING}`;

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
        <div className={`w-full ${isEditMode ? 'p-4 md:p-6 border-2 border-dashed border-brand-300 rounded-card bg-brand-50' : ''}`}>
            {isEditMode && blocks.length === 0 && (
                <p className="text-center text-brand-800 text-sm mb-4 font-semibold">
                    Zona de bloques vacía. Añade uno con los botones de abajo.
                </p>
            )}

            <div className="flex flex-col gap-4">
                {blocks.map((block, index) => (
                    <div key={block.id} className="relative group">
                        {isEditMode && (
                            <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white border border-neutral-200 rounded-control z-10">
                                <button type="button" onClick={() => moveBlock(index, -1)} className={`${ICON_BTN} hover:text-brand-700`} aria-label="Subir bloque"><ChevronUp size={16} aria-hidden /></button>
                                <button type="button" onClick={() => moveBlock(index, 1)} className={`${ICON_BTN} hover:text-brand-700`} aria-label="Bajar bloque"><ChevronDown size={16} aria-hidden /></button>
                                <div className="w-full h-px bg-neutral-200" />
                                <button type="button" onClick={() => removeBlock(block.id)} className={`${ICON_BTN} hover:text-danger`} aria-label="Eliminar bloque"><Trash2 size={16} aria-hidden /></button>
                            </div>
                        )}
                        <BlockRenderer block={block} />
                    </div>
                ))}
            </div>

            {isEditMode && (
                <div className="mt-8 flex justify-center sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20">
                    <div className="bg-white px-3 py-2 rounded-card border border-neutral-200 shadow-overlay flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-600 flex items-center gap-1 pr-2">
                            <Plus size={16} aria-hidden /> Añadir bloque
                        </span>

                        <div className="flex flex-wrap gap-2 border-l border-neutral-200 pl-3">
                            <button type="button" onClick={() => addBlock('paragraph')} className={ADD_BTN}>
                                <Type size={16} aria-hidden /> Texto
                            </button>
                            <button type="button" onClick={() => addBlock('image')} className={ADD_BTN}>
                                <ImageIcon size={16} aria-hidden /> Imagen
                            </button>
                            <button type="button" onClick={() => addBlock('accordion')} className={ADD_BTN}>
                                <LayoutList size={16} aria-hidden /> Acordeón
                            </button>
                            <button type="button" onClick={() => addBlock('quote')} className={ADD_BTN}>
                                <MessageSquare size={16} aria-hidden /> Tip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/** En modo edición deja cambiar la URL de la imagen sin alterar la vista del usuario. */
const ImageBlock = ({ blockId }: { blockId: string }) => {
    const { isEditMode } = useEditor();
    const storedURL = localStorage.getItem(`cms_block_${blockId}_content`) || "https://images.unsplash.com/photo-1556910103-1c02745a872e?auto=format&fit=crop&q=80&w=1000";

    const [url, setURL] = useState(storedURL);
    const inputId = `cms-image-url-${blockId}`;

    return (
        <div className="my-6 group relative">
            <img src={url} alt="" className="w-full rounded-card object-cover max-h-96" />

            {isEditMode && (
                <div className="absolute inset-0 bg-neutral-950/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity rounded-card px-4">
                    <div className="w-full max-w-lg bg-white p-4 rounded-card shadow-overlay flex flex-col gap-2">
                        <label htmlFor={inputId} className="text-sm font-semibold text-neutral-600">URL de la imagen</label>
                        <input
                            id={inputId}
                            className={`w-full min-h-11 text-base sm:text-sm bg-neutral-100 rounded-control px-3 text-neutral-800 font-mono ${FOCUS_RING}`}
                            value={url}
                            onChange={e => setURL(e.target.value)}
                            onBlur={() => localStorage.setItem(`cms_block_${blockId}_content`, url)}
                            onClick={e => e.stopPropagation()}
                            placeholder="https://…"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const BlockRenderer: React.FC<{ block: CMSBlock }> = ({ block }) => {
    switch (block.type) {
        case 'paragraph':
            return (
                <p className="text-neutral-800 leading-relaxed text-base my-4 px-2">
                    <EditableText elementKey={`block_${block.id}_content`} defaultText="Escribe el texto aquí." as="span" />
                </p>
            );
        case 'quote':
            return (
                <blockquote className="border-l-4 border-brand-700 bg-brand-50 p-4 w-full rounded-r-card my-4">
                    <p className="text-brand-800 font-medium leading-relaxed">
                        <EditableText elementKey={`block_${block.id}_content`} defaultText="Escribe aquí un consejo para quien cocina." as="span" />
                    </p>
                </blockquote>
            );
        case 'accordion':
            return (
                <details className="group border border-neutral-200 rounded-card overflow-hidden my-4 bg-white w-full">
                    <summary className="flex justify-between items-center gap-3 font-bold cursor-pointer list-none min-h-14 px-4 hover:bg-neutral-50 transition-colors text-neutral-800">
                        <span className="flex items-center gap-3 min-w-0">
                            <EditableText elementKey={`block_${block.id}_emoji`} defaultText="ℹ️" as="span" />
                            <EditableText elementKey={`block_${block.id}_title`} defaultText="Título de la sección" as="span" />
                        </span>
                        <ChevronDown className="motion-safe:transition-transform group-open:rotate-180 w-5 h-5 shrink-0 text-neutral-500" aria-hidden />
                    </summary>
                    <div className="p-4 border-t border-neutral-100 text-neutral-600 leading-relaxed text-sm">
                        <EditableText elementKey={`block_${block.id}_content`} defaultText="Contenido que se muestra al abrir la sección." as="span" />
                    </div>
                </details>
            );
        case 'image':
            return <ImageBlock blockId={block.id} />;

        default:
            return <div role="alert" className="p-3 text-red-800 text-sm font-semibold bg-red-50 rounded-control">Bloque no soportado: {block.type}</div>;
    }
};
