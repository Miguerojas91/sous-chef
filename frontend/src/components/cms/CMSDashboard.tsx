import React, { useEffect, useState } from 'react';
import { ShieldAlert, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../context/EditorContext';

interface PageItem {
    id: number;
    slug: string;
    title: string;
}

export const CMSDashboard: React.FC = () => {
    const { isAdmin, isEditMode, toggleEditMode } = useEditor();
    const navigate = useNavigate();
    const [pages, setPages] = useState<PageItem[]>([]);

    useEffect(() => {
        // En MVP cargamos páginas simuladas (las que ya migramos o probamos)
        // Pronto llamará a fetch('/api/v1/cms/pages')
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setPages([
            { id: 1, slug: 'cms-test', title: 'Página de Prueba Motor CMS' },
            { id: 2, slug: 'juliana-level', title: 'Nivel 1: Juliana (Próxima Migración)' },
        ]);
        
        // Ensure edit mode is on when we are in the dashboard
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (!isEditMode) toggleEditMode();
    }, []);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 h-screen">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Acceso Denegado</h1>
                <p className="text-gray-500 mt-2">Solo los administradores pueden acceder al Modo Dios.</p>
                <button onClick={() => navigate('/')} className="mt-6 text-orange-600 hover:text-orange-700 font-bold">Volver al Inicio</button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-100 p-8 font-sans overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                
                <header className="flex items-center justify-between mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-orange-500">
                            <ShieldAlert className="w-8 h-8" />
                            MODO DIOS (CMS)
                        </h1>
                        <p className="text-gray-400 mt-2">Gestor visual de contenido estructural.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        <Plus className="w-5 h-5" />
                        Crear Nueva Página
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map(page => (
                        <div key={page.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col hover:border-orange-500/50 transition-colors group">
                            <h2 className="text-xl font-bold text-white mb-2">{page.title}</h2>
                            <p className="text-gray-400 text-sm mb-6 flex-1">/{page.slug}</p>
                            
                            <button 
                                onClick={() => navigate(`/${page.slug}`)} 
                                className="w-full flex items-center justify-between bg-gray-700 hover:bg-orange-600 text-gray-200 hover:text-white font-medium py-3 px-4 rounded-xl transition-colors">
                                <span>Editar Visualmente</span>
                                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
