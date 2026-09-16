/** Página de prueba del renderizador de bloques con datos fijos (ruta `/cms-test`). */

import React from 'react';
import { DynamicPageRenderer } from './DynamicPageRenderer';
import type { CMSBlock } from '../../types/cms';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_BLOCKS: CMSBlock[] = [
    {
        id: '1',
        type: 'header',
        content: 'Página de prueba del CMS',
        styles: { alignment: 'center', bold: true }
    },
    {
        id: '2',
        type: 'paragraph',
        content: 'Este contenido sale de un JSON de bloques, no de componentes escritos a mano.',
        styles: { alignment: 'center' }
    },
    {
        id: '3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
        title: 'Imagen de prueba'
    },
    {
        id: '4',
        type: 'accordion',
        title: '¿Para qué sirve?',
        content: 'Para que los administradores cambien textos e imágenes en pantalla sin esperar un despliegue.'
    },
    {
        id: '5',
        type: 'checklist',
        content: '- Probar cada tipo de bloque\n- Migrar los niveles del Modo Aventura\n- Añadir una barra de herramientas de edición'
    }
];

export const CMSTestPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-50 text-neutral-900 p-4 md:p-6 w-full flex justify-center">
                <div className="max-w-3xl w-full h-fit bg-white rounded-card border border-neutral-200 p-4 md:p-6">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="min-h-11 flex items-center gap-2 px-2 -ml-2 mb-6 rounded-control text-neutral-600 hover:text-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                    >
                        <ArrowLeft className="w-5 h-5" aria-hidden />
                        Volver al inicio
                    </button>
                    <p className="text-sm font-semibold text-neutral-600 mb-4">
                        Prueba del renderizador de bloques
                    </p>
                    <DynamicPageRenderer blocks={MOCK_BLOCKS} />
                </div>
            </div>
        </div>
    );
};
