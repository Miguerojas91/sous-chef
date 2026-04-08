import React from 'react';
import { DynamicPageRenderer } from './DynamicPageRenderer';
import type { CMSBlock } from '../../types/cms';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_BLOCKS: CMSBlock[] = [
    {
        id: '1',
        type: 'header',
        content: 'Bienvenido al Modo Dios (CMS Dinámico)',
        styles: { alignment: 'center', bold: true }
    },
    {
        id: '2',
        type: 'paragraph',
        content: 'Esta página ya no está escrita en código estático React. Todo este contenido proviene de un esquema JSON generado de forma dinámica.',
        styles: { alignment: 'center' }
    },
    {
        id: '3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
        title: 'El entorno de pruebas de desarrollo CMS'
    },
    {
        id: '4',
        type: 'accordion',
        title: '¿Por qué estamos haciendo esto?',
        content: 'Para que los administradores tengan un constructor visual en vivo estilo Elementor donde puedan cambiar textos e imágenes al instante, sin depender de los desarrolladores.'
    },
    {
        id: '5',
        type: 'checklist',
        content: '- Aprender a usar los bloques\n- Migrar los niveles de aventura existentes\n- Añadir la barra de herramientas de Elementor'
    }
];

export const CMSTestPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 w-full flex justify-center overflow-y-auto">
            <div className="max-w-3xl w-full bg-white rounded-3xl p-8 shadow-sm">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Volver al Dashboard
                </button>
                <div className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded-full mb-6 inline-flex shadow-sm tracking-wide uppercase">
                    Prueba del Renderizador de Bloques
                </div>
                {/* Render the JSON dynamically */}
                <DynamicPageRenderer blocks={MOCK_BLOCKS} />
            </div>
        </div>
    );
};
