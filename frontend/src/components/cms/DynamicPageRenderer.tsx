/** Renderiza una página del CMS a partir de su lista de bloques. */

import React from 'react';
import type { CMSBlock } from '../../types/cms';
import { ChevronDown, Info } from 'lucide-react';

interface DynamicPageRendererProps {
    blocks: CMSBlock[];
}

export const DynamicPageRenderer: React.FC<DynamicPageRendererProps> = ({ blocks }) => {
    if (!blocks || blocks.length === 0) {
        return (
            <div className="py-10 px-4 text-center text-neutral-600 border-2 border-dashed border-neutral-200 rounded-card">
                Esta página todavía no tiene contenido.
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
                <h2 className={`text-xl md:text-2xl font-bold text-neutral-900 mt-6 mb-2 [overflow-wrap:anywhere] ${getAlignmentClass()} ${getFontStyleClasses()}`}>
                    {block.content}
                </h2>
            );
        case 'paragraph':
            return (
                <p className={`text-neutral-600 leading-relaxed [overflow-wrap:anywhere] ${getAlignmentClass()} ${getFontStyleClasses()}`}>
                    {block.content}
                </p>
            );
        case 'image':
            return (
                <figure className="my-6 rounded-card overflow-hidden border border-neutral-200">
                    <img src={block.content} alt={block.title || ''} className="w-full h-auto object-cover max-h-96" />
                    {block.title && <figcaption className="text-center text-sm text-neutral-600 p-2 bg-neutral-50">{block.title}</figcaption>}
                </figure>
            );
        case 'quote':
            return (
                <blockquote className="border-l-4 border-brand-700 bg-brand-50 p-4 rounded-r-card my-4 text-brand-800">
                    {block.content}
                </blockquote>
            );
        case 'accordion':
            return (
                <details className="group border border-neutral-200 rounded-card overflow-hidden my-4 bg-white">
                    <summary className="flex justify-between items-center gap-3 font-medium cursor-pointer list-none min-h-14 px-4 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700">
                        <span className="flex items-center gap-2 min-w-0 text-neutral-800">
                            <Info className="w-5 h-5 shrink-0 text-brand-700" aria-hidden />
                            {block.title || 'Más información'}
                        </span>
                        <ChevronDown className="motion-safe:transition-transform group-open:rotate-180 w-5 h-5 shrink-0 text-neutral-500" aria-hidden />
                    </summary>
                    <div className="p-4 border-t border-neutral-100 text-neutral-800 leading-relaxed">
                        {block.content}
                    </div>
                </details>
            );
        case 'checklist': {
            // Ítems separados por salto de línea mientras no haya bloques anidados.
            const items = block.content.split('\n').filter(i => i.trim() !== '');
            return (
                <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 my-4">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3">
                            <span className="mt-0.5 w-5 h-5 rounded border-2 border-neutral-500 shrink-0" aria-hidden />
                            <span className="text-neutral-800 min-w-0">{item.replace(/^- /, '')}</span>
                        </li>
                    ))}
                </ul>
            );
        }
        default:
            return (
                <div role="alert" className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-control text-sm">
                    Bloque no soportado: {block.type}
                </div>
            );
    }
};
