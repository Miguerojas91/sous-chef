/**
 * DynamicPageRenderer.tsx
 *
 * Renderizador de páginas dinámicas del CMS.
 * Toma un array de `CMSBlock[]` y genera el JSX correspondiente
 * según el tipo de cada bloque (paragraph, header, image, accordion, etc.).
 *
 * Se usa en las rutas `/p/:slug` para mostrar páginas creadas por el admin.
 */

import React from 'react';
import type { CMSBlock } from '../../types/cms';
import { ChevronDown, Info } from 'lucide-react';

interface DynamicPageRendererProps {
    blocks: CMSBlock[];
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({ blocks }) => {
    if (!blocks || blocks.length === 0) {
        return (
            <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                Esta página no tiene contenido estructurado todavía.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {blocks.map(block => (
                <BlockRenderer key={block.id} block={block} />
            ))}
        </div>
    );
};

const BlockRenderer: React.FC<{ block: CMSBlock }> = ({ block }) => {
    const getAlignmentClass = () => {
        if (block.styles?.alignment === 'center') return 'text-center';
        if (block.styles?.alignment === 'right') return 'text-right';
        return 'text-left';
    };

    const getFontStyleClasses = () => {
        let classes = '';
        if (block.styles?.bold) classes += ' font-bold';
        if (block.styles?.italic) classes += ' italic';
        return classes;
    };

    switch (block.type) {
        case 'header':
            return (
                <h2 className={`text-2xl font-bold text-gray-800 mt-6 mb-2 ${getAlignmentClass()} ${getFontStyleClasses()}`}>
                    {block.content}
                </h2>
            );
        case 'paragraph':
            return (
                <p className={`text-gray-600 leading-relaxed ${getAlignmentClass()} ${getFontStyleClasses()}`}>
                    {block.content}
                </p>
            );
        case 'image':
            return (
                <div className="my-6 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={block.content} alt={block.title || "CMS Image"} className="w-full h-auto object-cover max-h-96" />
                    {block.title && <p className="text-center text-sm text-gray-500 mt-2 p-2 bg-gray-50">{block.title}</p>}
                </div>
            );
        case 'quote':
            return (
                <blockquote className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg my-4 text-orange-900 italic shadow-sm">
                    {block.content}
                </blockquote>
            );
        case 'accordion':
            return (
                <details className="group border border-gray-200 rounded-xl overflow-hidden my-4 bg-white shadow-sm hover:border-orange-200 transition-colors">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 hover:bg-orange-50 transition-colors">
                        <span className="flex items-center gap-2 text-gray-800">
                            <Info className="w-5 h-5 text-orange-500" />
                            {block.title || "Información Importante"}
                        </span>
                        <ChevronDown className="transition group-open:rotate-180 w-5 h-5 text-gray-400" />
                    </summary>
                    <div className="p-4 bg-orange-50/50 border-t border-gray-100 text-gray-700 leading-relaxed">
                        {block.content}
                    </div>
                </details>
            );
        case 'checklist': {
            // Simple string splitting by newline for checklist items if we don't use nested blocks yet
            const items = block.content.split('\n').filter(i => i.trim() !== '');
            return (
                <ul className="space-y-2 my-4">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <div className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                            <span className="text-gray-700">{item.replace(/^- /, '')}</span>
                        </li>
                    ))}
                </ul>
            );
        }
        default:
            return (
                <div className="p-4 border border-red-200 bg-red-50 text-red-500 rounded-md text-sm">
                    [Bloque desconocido: {block.type}]
                </div>
            );
    }
};
